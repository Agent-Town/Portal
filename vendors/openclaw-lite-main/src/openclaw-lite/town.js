/* eslint-disable no-console */

async function api(url) {
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`);
  return data;
}

function el(id) {
  return document.getElementById(id);
}

function renderHouseTile(h) {
  const houseId = typeof h.houseId === "string" ? h.houseId : "";
  const displayName = h.housePublicJson?.displayName || "House";
  const tagline = h.housePublicJson?.tagline || "";
  const updatedAt = h.updatedAt || null;

  const tile = document.createElement("div");
  tile.className = "panel";
  tile.style.margin = "0";

  const title = document.createElement("div");
  title.innerHTML = "";
  title.style.display = "flex";
  title.style.justifyContent = "space-between";
  title.style.gap = "10px";
  title.style.alignItems = "baseline";

  const name = document.createElement("strong");
  name.textContent = String(displayName);

  const id = document.createElement("span");
  id.className = "small";
  id.style.color = "var(--muted)";
  id.textContent = houseId ? `${houseId.slice(0, 6)}…${houseId.slice(-4)}` : "—";

  title.appendChild(name);
  title.appendChild(id);

  const tag = document.createElement("div");
  tag.className = "small";
  tag.style.color = "var(--muted)";
  tag.style.marginTop = "6px";
  tag.textContent = String(tagline);

  const meta = document.createElement("div");
  meta.className = "small";
  meta.style.color = "var(--muted)";
  meta.style.marginTop = "10px";
  meta.textContent = updatedAt ? `Updated ${updatedAt}` : "";

  const open = document.createElement("a");
  open.className = "btn";
  open.href = `/house?house=${encodeURIComponent(houseId)}`;
  open.textContent = "Open house";
  open.style.marginTop = "10px";
  open.style.display = "inline-flex";

  tile.appendChild(title);
  tile.appendChild(tag);
  tile.appendChild(meta);
  if (houseId) tile.appendChild(open);

  return tile;
}

async function init() {
  const grid = el("townGrid");
  if (!grid) return;

  try {
    const data = await api("/api/town/grid");
    const houses = Array.isArray(data?.houses) ? data.houses : [];

    grid.innerHTML = "";
    if (!houses.length) {
      const empty = document.createElement("div");
      empty.className = "small";
      empty.style.color = "var(--muted)";
      empty.textContent = "No published houses yet.";
      grid.appendChild(empty);
      return;
    }

    for (const h of houses) {
      grid.appendChild(renderHouseTile(h));
    }
  } catch (e) {
    console.warn(e);
    grid.innerHTML = "";
    const err = document.createElement("div");
    err.className = "small";
    err.style.color = "var(--bad)";
    err.textContent = e.message || String(e);
    grid.appendChild(err);
  }
}

init();

