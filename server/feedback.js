/**
 * Feedback Capture API — ZHC1 §7.5
 *
 * Captures user feedback on experiment cards, extracts constraints and
 * preferences, detects sentiment, updates card status, and enriches
 * the parent Problem Story.
 *
 * Routes (Express Router, mounted at /api/experiment-cards):
 *   POST /:id/feedback  → submit feedback on a card
 *
 * Tests satisfied:
 *   T040: POST text feedback → constraints extracted, card status updated
 *   T041: POST audio feedback → audioUrl + transcription stored, constraints from transcription
 *   T043: After multiple feedback rounds → problemStory.constraints grows, no duplicates
 */

const express = require('express');
const {
  getCardById,
  updateCardById,
} = require('./experiment-cards');
const {
  getProblemStory,
  updateProblemStory,
} = require('./problem-stories');

// ---------------------------------------------------------------------------
// Sentiment detection — simple keyword matching
// ---------------------------------------------------------------------------

const POSITIVE_WORDS = new Set([
  'good', 'great', 'like', 'love', 'keep', 'nice', 'perfect',
  'awesome', 'excellent', 'beautiful', 'amazing', 'wonderful',
  'yes', 'approve', 'fantastic', 'superb', 'clean', 'solid',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'wrong', 'hate', 'remove', 'ugly', 'broken', 'fix',
  'terrible', 'horrible', 'awful', 'no', 'dislike', 'delete',
  'trash', 'messy', 'cramped', 'cluttered', 'slow', 'glitchy',
  'buggy', 'useless', 'distracting',
]);

const CONFUSED_WORDS = new Set([
  '?', 'what', 'why', 'confused', 'unclear', 'huh', 'weird',
  'strange', 'unexpected', 'surprising',
]);

/**
 * Detect sentiment from text.
 * @param {string} text
 * @returns {'positive'|'negative'|'neutral'|'confused'}
 */
function detectSentiment(text) {
  if (!text || typeof text !== 'string') return 'neutral';

  const lower = text.toLowerCase().trim();
  if (!lower) return 'neutral';

  let positiveCount = 0;
  let negativeCount = 0;
  let confusedCount = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) positiveCount++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negativeCount++;
  }
  for (const word of CONFUSED_WORDS) {
    if (lower.includes(word)) confusedCount++;
  }

  // Confused wins if it has the highest signal
  if (confusedCount > positiveCount && confusedCount > negativeCount) {
    return 'confused';
  }
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Constraint extraction — heuristic directive matching
// ---------------------------------------------------------------------------

const CONSTRAINT_PATTERNS = [
  {
    // "Make the header darker"
    match: /make\s+(?:it\s+|the\s+)?(.{1,40}?)(?:\s*[-–,]|\s*$)/i,
    transform: (m) => `${m[1].trim()} should be applied`,
  },
  {
    // "Change the color scheme"
    match: /change\s+(?:the\s+)?(.{1,40}?)(?:\s*[-–,]|\s*$)/i,
    transform: (m) => `${m[1].trim()} should change`,
  },
  {
    // "Use a darker palette"
    match: /use\s+(?:a\s+|an\s+|the\s+)?(.{1,40}?)(?:\s*[-–,]|\s*$)/i,
    transform: (m) => `use ${m[1].trim()}`,
  },
  {
    // "Remove the sidebar"
    match: /(?:remove|delete|drop|get rid of)\s+(?:the\s+)?(.{1,40}?)(?:\s*[-–,]|\s*$)/i,
    transform: (m) => `no ${m[1].trim()}`,
  },
  {
    // "Add a footer"
    match: /add\s+(?:a\s+|an\s+|the\s+)?(.{1,40}?)(?:\s*[-–,]|\s*$)/i,
    transform: (m) => `include ${m[1].trim()}`,
  },
];

/**
 * Extract actionable constraints from feedback text.
 * @param {string} text
 * @returns {string[]} constraint strings (max 50 chars each, deduplicated)
 */
function extractConstraints(text) {
  if (!text || typeof text !== 'string') return [];

  const constraints = [];
  const seen = new Set();
  const lower = text.toLowerCase();

  for (const pattern of CONSTRAINT_PATTERNS) {
    const match = lower.match(pattern.match);
    if (match) {
      const raw = pattern.transform(match);
      const constraint = raw.slice(0, 50).trim();
      const normalized = constraint.toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        constraints.push(constraint);
      }
    }
  }

  return constraints;
}

/**
 * Extract preferences from feedback text (softer signals).
 * @param {string} text
 * @returns {string[]}
 */
function extractPreferences(text) {
  if (!text || typeof text !== 'string') return [];

  const preferences = [];
  const seen = new Set();
  const lower = text.toLowerCase();

  const prefPatterns = [
    { re: /i\s+(?:like|prefer|love|want|enjoy)\s+(.{1,40}?)(?:\s*[.,]|\s*$)/i, prefix: 'prefers' },
    { re: /(?:needs?|should)\s+(?:be|have)\s+(.{1,40}?)(?:\s*[.,]|\s*$)/i, prefix: 'prefers' },
  ];

  for (const { re, prefix } of prefPatterns) {
    const match = lower.match(re);
    if (match) {
      const raw = `${prefix} ${match[1].trim()}`;
      const pref = raw.slice(0, 50).trim().toLowerCase();
      if (pref && !seen.has(pref)) {
        seen.add(pref);
        preferences.push(pref);
      }
    }
  }

  return preferences;
}

// ---------------------------------------------------------------------------
// Card status resolution
// ---------------------------------------------------------------------------

/**
 * Determine new card status from sentiment + gesture.
 * Gesture takes priority.
 * @param {object} opts
 * @param {string} [opts.sentiment]
 * @param {string} [opts.gesture]
 * @returns {'kept'|'discarded'|'pending_review'}
 */
function resolveCardStatus({ sentiment, gesture, hasConstraints }) {
  if (gesture === 'swipe_keep') return 'kept';
  if (gesture === 'swipe_discard') return 'discarded';
  switch (sentiment) {
    case 'positive': return 'kept';
    case 'negative': return 'discarded';
    case 'neutral':
      // If user gave constructive directives, default to kept (they engaged)
      return hasConstraints ? 'kept' : 'pending_review';
    default: return 'pending_review';
  }
}

// ---------------------------------------------------------------------------
// Express router
// ---------------------------------------------------------------------------

const feedbackRouter = express.Router();
feedbackRouter.use(express.json());

/**
 * POST /:id/feedback — submit feedback on an experiment card
 *
 * Accepts JSON body:
 *   modality: "text" | "audio" | "gesture"
 *   textContent?: string
 *   audioUrl?: string
 *   transcription?: string
 *   gesture?: "swipe_keep" | "swipe_discard"
 *   reviewDurationMs?: number
 */
feedbackRouter.post('/:id/feedback', (req, res) => {
  const cardId = req.params.id;

  // 1. Look up card (search across all stories)
  const card = getCardById(cardId);
  if (!card) {
    return res.status(404).json({
      ok: false,
      error: 'CARD_NOT_FOUND',
      message: `Experiment card ${cardId} not found`,
    });
  }

  // 2. Validate body
  const {
    modality,
    textContent,
    audioUrl,
    transcription,
    gesture,
    reviewDurationMs,
  } = req.body;

  if (!modality || !['text', 'audio', 'gesture'].includes(modality)) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_MODALITY',
      message: 'modality must be "text", "audio", or "gesture"',
    });
  }

  if (gesture && !['swipe_keep', 'swipe_discard'].includes(gesture)) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_GESTURE',
      message: 'gesture must be "swipe_keep" or "swipe_discard"',
    });
  }

  // 3. Determine text to analyze
  const textToAnalyze = textContent || transcription || '';

  // 4. Extract constraints and preferences
  const extractedConstraints = extractConstraints(textToAnalyze);
  const extractedPreferences = extractPreferences(textToAnalyze);

  // 5. Detect sentiment
  const sentiment = detectSentiment(textToAnalyze);

  // 6. Resolve card status
  const newStatus = resolveCardStatus({ sentiment, gesture, hasConstraints: extractedConstraints.length > 0 });

  // 7. Build CardFeedback object
  const feedback = {
    cardId,
    timestamp: new Date().toISOString(),
    modality,
    ...(textContent && { textContent }),
    ...(audioUrl && { audioUrl }),
    ...(transcription && { transcription }),
    ...(gesture && { gesture }),
    extractedConstraints,
    extractedPreferences,
    sentiment,
    reviewDurationMs: typeof reviewDurationMs === 'number' ? reviewDurationMs : 0,
  };

  // 8. Update card in the experiment-cards store
  updateCardById(cardId, {
    feedback,
    status: newStatus,
  });

  // 9. Update the Problem Story
  const storyId = card.problemStoryId;
  if (storyId) {
    const story = getProblemStory(storyId);
    if (story) {
      // Append feedback round
      const feedbackRound = {
        cardId,
        roundNumber: story.totalIterations + 1,
        feedback,
        timestamp: feedback.timestamp,
      };
      story.feedbackRounds = story.feedbackRounds || [];
      story.feedbackRounds.push(feedbackRound);

      // Add constraints (deduplicate, case-insensitive)
      const existingConstraints = new Set(
        (story.constraints || []).map((c) => c.toLowerCase())
      );
      for (const constraint of extractedConstraints) {
        if (!existingConstraints.has(constraint.toLowerCase())) {
          story.constraints.push(constraint);
          existingConstraints.add(constraint.toLowerCase());
        }
      }

      // Add preferences (deduplicate, case-insensitive)
      const existingPreferences = new Set(
        (story.preferences || []).map((p) => p.toLowerCase())
      );
      for (const pref of extractedPreferences) {
        if (!existingPreferences.has(pref.toLowerCase())) {
          story.preferences.push(pref);
          existingPreferences.add(pref.toLowerCase());
        }
      }

      // Increment total iterations
      story.totalIterations = (story.totalIterations || 0) + 1;
      story.updatedAt = new Date().toISOString();

      updateProblemStory(storyId, story);
    }
  }

  // 10. Return updated card
  res.json({
    ok: true,
    data: card,
  });
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  feedbackRouter,
  extractConstraints,
  extractPreferences,
  detectSentiment,
  resolveCardStatus,
};
