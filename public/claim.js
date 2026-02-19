async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json && json.error) || `HTTP_${res.status}`;
    throw new Error(err);
  }
  return json;
}

function el(id) {
  return document.getElementById(id);
}

let ercNonce = null;

async function initErc8004() {
  const out = el('erc8004Out');
  el('erc8004GetNonce').addEventListener('click', async () => {
    try {
      const agentId = el('erc8004AgentId').value.trim();
      const j = await api(`/api/claim/erc8004/nonce?agentId=${encodeURIComponent(agentId)}`);
      ercNonce = j.nonce;
      out.textContent = JSON.stringify(j, null, 2);
    } catch (e) {
      out.textContent = String(e.message || e);
    }
  });

  el('erc8004Verify').addEventListener('click', async () => {
    try {
      const agentId = el('erc8004AgentId').value.trim();
      const signature = '0x'; // real wallet signing not wired in this minimal UI
      const address = '';
      const j = await api('/api/claim/erc8004/verify', {
        method: 'POST',
        body: JSON.stringify({ agentId, nonce: ercNonce, signature, address, coop: false })
      });
      out.textContent = JSON.stringify(j, null, 2);
      if (j.nextUrl) window.location.href = j.nextUrl;
    } catch (e) {
      out.textContent = String(e.message || e);
    }
  });
}

let xNonce = null;
let xChallenge = null;

async function initX() {
  const out = el('xOut');
  el('xChallenge').addEventListener('click', async () => {
    try {
      const handle = el('xHandle').value.trim();
      const j = await api(`/api/claim/x/challenge?handle=${encodeURIComponent(handle)}`);
      xNonce = j.nonce;
      xChallenge = j.challenge;
      out.textContent = JSON.stringify(j, null, 2);
    } catch (e) {
      out.textContent = String(e.message || e);
    }
  });

  el('xVerify').addEventListener('click', async () => {
    try {
      const handle = el('xHandle').value.trim();
      const tweetUrl = el('xTweetUrl').value.trim();
      const j = await api('/api/claim/x/verify', {
        method: 'POST',
        body: JSON.stringify({ handle, nonce: xNonce, tweetUrl, coop: false })
      });
      out.textContent = JSON.stringify(j, null, 2);
      if (j.nextUrl) window.location.href = j.nextUrl;
    } catch (e) {
      out.textContent = String(e.message || e);
    }
  });
}

initErc8004();
initX();
