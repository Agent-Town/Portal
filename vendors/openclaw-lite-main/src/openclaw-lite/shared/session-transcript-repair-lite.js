function isToolCallBlock(block) {
  if (!block || typeof block !== "object") {
    return false;
  }
  const type = block.type;
  return typeof type === "string" && (type === "toolCall" || type === "toolUse" || type === "functionCall");
}

function hasToolCallInput(block) {
  const hasInput = "input" in block ? block.input !== undefined && block.input !== null : false;
  const hasArguments = "arguments" in block ? block.arguments !== undefined && block.arguments !== null : false;
  return hasInput || hasArguments;
}

function hasNonEmptyStringField(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasToolCallId(block) {
  return hasNonEmptyStringField(block.id);
}

function hasToolCallName(block) {
  return hasNonEmptyStringField(block.name);
}

function makeMissingToolResult({ toolCallId, toolName }) {
  return {
    role: "toolResult",
    toolCallId,
    toolName: toolName || "unknown",
    content: [
      {
        type: "text",
        text: "[openclaw] missing tool result in session history; inserted synthetic error result for transcript repair.",
      },
    ],
    isError: true,
    timestamp: Date.now(),
  };
}

function extractToolCallsFromAssistant(msg) {
  const content = msg?.content;
  if (!Array.isArray(content)) {
    return [];
  }

  const toolCalls = [];
  for (const block of content) {
    if (!block || typeof block !== "object") {
      continue;
    }
    if (typeof block.id !== "string" || !block.id) {
      continue;
    }
    if (typeof block.type === "string" && (block.type === "toolCall" || block.type === "toolUse" || block.type === "functionCall")) {
      toolCalls.push({
        id: block.id,
        name: typeof block.name === "string" ? block.name : undefined,
      });
    }
  }
  return toolCalls;
}

function extractToolResultId(msg) {
  const toolCallId = msg?.toolCallId;
  if (typeof toolCallId === "string" && toolCallId) {
    return toolCallId;
  }
  const toolUseId = msg?.toolUseId;
  if (typeof toolUseId === "string" && toolUseId) {
    return toolUseId;
  }
  return null;
}

export function repairToolCallInputs(messages) {
  let droppedToolCalls = 0;
  let droppedAssistantMessages = 0;
  let changed = false;
  const out = [];

  for (const msg of Array.isArray(messages) ? messages : []) {
    if (!msg || typeof msg !== "object") {
      out.push(msg);
      continue;
    }

    if (msg.role !== "assistant" || !Array.isArray(msg.content)) {
      out.push(msg);
      continue;
    }

    const nextContent = [];
    let droppedInMessage = 0;

    for (const block of msg.content) {
      if (isToolCallBlock(block) && (!hasToolCallInput(block) || !hasToolCallId(block) || !hasToolCallName(block))) {
        droppedToolCalls += 1;
        droppedInMessage += 1;
        changed = true;
        continue;
      }
      nextContent.push(block);
    }

    if (droppedInMessage > 0) {
      if (nextContent.length === 0) {
        droppedAssistantMessages += 1;
        changed = true;
        continue;
      }
      out.push({ ...msg, content: nextContent });
      continue;
    }

    out.push(msg);
  }

  return {
    messages: changed ? out : messages,
    droppedToolCalls,
    droppedAssistantMessages,
  };
}

export function repairToolUseResultPairing(messages) {
  const out = [];
  const added = [];
  const seenToolResultIds = new Set();
  let droppedDuplicateCount = 0;
  let droppedOrphanCount = 0;
  let moved = false;
  let changed = false;

  const source = Array.isArray(messages) ? messages : [];

  const pushToolResult = (msg) => {
    const id = extractToolResultId(msg);
    if (id && seenToolResultIds.has(id)) {
      droppedDuplicateCount += 1;
      changed = true;
      return;
    }
    if (id) {
      seenToolResultIds.add(id);
    }
    out.push(msg);
  };

  for (let i = 0; i < source.length; i += 1) {
    const msg = source[i];
    if (!msg || typeof msg !== "object") {
      out.push(msg);
      continue;
    }

    const role = msg.role;
    if (role !== "assistant") {
      if (role !== "toolResult") {
        out.push(msg);
      } else {
        droppedOrphanCount += 1;
        changed = true;
      }
      continue;
    }

    const assistant = msg;
    const stopReason = assistant.stopReason;
    if (stopReason === "error" || stopReason === "aborted") {
      out.push(msg);
      continue;
    }

    const toolCalls = extractToolCallsFromAssistant(assistant);
    if (toolCalls.length === 0) {
      out.push(msg);
      continue;
    }

    const toolCallIds = new Set(toolCalls.map((toolCall) => toolCall.id));
    const spanResultsById = new Map();
    const remainder = [];

    let j = i + 1;
    for (; j < source.length; j += 1) {
      const next = source[j];
      if (!next || typeof next !== "object") {
        remainder.push(next);
        continue;
      }

      const nextRole = next.role;
      if (nextRole === "assistant") {
        break;
      }

      if (nextRole === "toolResult") {
        const id = extractToolResultId(next);
        if (id && toolCallIds.has(id)) {
          if (seenToolResultIds.has(id)) {
            droppedDuplicateCount += 1;
            changed = true;
            continue;
          }
          if (!spanResultsById.has(id)) {
            spanResultsById.set(id, next);
          }
          continue;
        }
      }

      if (nextRole !== "toolResult") {
        remainder.push(next);
      } else {
        droppedOrphanCount += 1;
        changed = true;
      }
    }

    out.push(msg);

    if (spanResultsById.size > 0 && remainder.length > 0) {
      moved = true;
      changed = true;
    }

    for (const call of toolCalls) {
      const existing = spanResultsById.get(call.id);
      if (existing) {
        pushToolResult(existing);
      } else {
        const missing = makeMissingToolResult({
          toolCallId: call.id,
          toolName: call.name,
        });
        added.push(missing);
        changed = true;
        pushToolResult(missing);
      }
    }

    for (const rem of remainder) {
      out.push(rem);
    }
    i = j - 1;
  }

  const changedOrMoved = changed || moved;
  return {
    messages: changedOrMoved ? out : messages,
    added,
    droppedDuplicateCount,
    droppedOrphanCount,
    moved: changedOrMoved,
  };
}
