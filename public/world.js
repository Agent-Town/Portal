async function api(url, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(url, {
    credentials: 'include',
    ...opts,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP_${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function el(id) {
  return document.getElementById(id);
}

function safeTestId(value) {
  return String(value || '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 48);
}

function getViewMode() {
  const raw = new URLSearchParams(window.location.search).get('view') || '';
  const view = String(raw).toLowerCase();
  if (view === 'iso' || view === 'isometric' || view === '2.5d' || view === '2_5d') return 'iso';
  return 'topdown';
}

const viewMode = getViewMode();

function getArtMode() {
  const raw = new URLSearchParams(window.location.search).get('art') || '';
  const value = String(raw).trim().toLowerCase();
  if (value === 'sprites') return 'sprites';
  if (value === 'markers') return 'markers';
  return 'auto';
}

function isProbablyMobile() {
  return window.matchMedia ? window.matchMedia('(max-width: 740px)').matches : false;
}

function getTextureSizePreference() {
  const raw = new URLSearchParams(window.location.search).get('tex') || '';
  const value = String(raw).trim().toLowerCase();
  if (value === 'hd' || value === '2x') return 'hd';
  if (value === 'sd' || value === '1x') return 'sd';
  return 'auto';
}

function pickTextureSize() {
  const pref = getTextureSizePreference();
  if (pref === 'sd' || pref === 'hd') return pref;
  // Mobile-first: default to SD even on high-DPR devices. HD can be forced with ?tex=hd.
  if (isProbablyMobile()) return 'sd';
  return window.devicePixelRatio >= 2 ? 'hd' : 'sd';
}

function getAssetsPackUrl() {
  const raw = new URLSearchParams(window.location.search).get('assets');
  if (raw == null) return '/world_assets/pack.json';
  const value = String(raw).trim();
  if (!value) return '/world_assets/pack.json';
  if (value.toLowerCase() === 'off') return null;
  if (value.toLowerCase() === 'demo') return '/world_assets/demo/pack.json';
  if (value.startsWith('/')) return value;
  return `/world_assets/${encodeURIComponent(value)}/pack.json`;
}

function urlDir(url) {
  const idx = String(url || '').lastIndexOf('/');
  if (idx < 0) return '/';
  return url.slice(0, idx + 1);
}

function resolveUrl(base, maybeRelative) {
  const value = String(maybeRelative || '').trim();
  if (!value) return null;
  if (/^https?:\\/\\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `${base}${value}`;
}

async function fetchJsonMaybe(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json();
}

const assets = {
  mode: 'markers', // markers | sprites
  artPref: getArtMode(),
  texSize: pickTextureSize(), // sd | hd
  packUrl: getAssetsPackUrl(),
  packBaseUrl: null,
  pack: null,
  error: null,
  stats: { spriteHouses: 0, totalHouses: 0 }
};

const state = {
  instance: 'public',
  world: null,
  houses: [],
  inhabitants: [],
  revision: null
};

const realtime = {
  config: null,
  assignment: null,
  client: null,
  room: null,
  instanceId: null,
  selfId: null,
  seq: 0,
  players: new Map(),
  interactions: []
};

const clip = {
  recording: false,
  recorder: null,
  stream: null,
  chunks: [],
  durationTimer: null,
  autoStopTimer: null,
  startedAt: 0,
  blob: null,
  blobUrl: null,
  clipId: null,
  durationSec: 0
};

let selectedHouseId = null;
let game = null;
let gameScene = null;
let pollTimer = null;
let polling = false;
let visibleListKey = '';
let renderSpace = null;
let worldTheme = null;
let assetsLoadedOnce = false;

const houseMarkerById = new Map();
const playerMarkerById = new Map();

function setStatus(text, { error = false } = {}) {
  const status = el('worldStatus');
  status.textContent = text;
  status.classList.toggle('is-error', error);
}

function setRealtimeStatus(text, { error = false } = {}) {
  const node = el('worldRealtimeStatus');
  node.textContent = text;
  node.classList.toggle('is-error', error);
}

function setUploadStatus(text, { error = false } = {}) {
  const node = el('worldUploadStatus');
  node.textContent = text || '';
  node.style.color = error ? 'var(--bad)' : 'var(--muted)';
}

function renderCounts() {
  el('worldInstance').textContent = state.instance;
  el('worldHouseCount').textContent = String(state.houses.length);
  el('worldInhabitantCount').textContent = String(state.inhabitants.length);
}

function renderCameraReadout({ x = 0, y = 0, zoom = 1 } = {}) {
  el('worldCameraX').textContent = String(Math.round(x));
  el('worldCameraY').textContent = String(Math.round(y));
  el('worldCameraZoom').textContent = zoom.toFixed(2);
}

function inhabitantsForHouse(houseId) {
  return state.inhabitants.filter((inh) => inh.houseId === houseId);
}

function renderDetail(houseId) {
  const root = el('worldHouseDetail');
  if (!houseId) {
    root.textContent = 'Select a house marker to see details.';
    return;
  }
  const house = state.houses.find((item) => item.houseId === houseId);
  if (!house) {
    root.textContent = 'House not found.';
    return;
  }

  const inhabitants = inhabitantsForHouse(houseId);
  root.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = `${house.name} (${house.houseId})`;
  root.appendChild(title);

  const type = document.createElement('div');
  type.className = 'small';
  type.textContent = `Type: ${house.type}`;
  root.appendChild(type);

  const coord = document.createElement('div');
  coord.className = 'small';
  coord.textContent = `Coord: (${house.coord.x}, ${house.coord.y})`;
  root.appendChild(coord);

  const tags = document.createElement('div');
  tags.className = 'small';
  tags.textContent = `Tags: ${house.instanceTags.length ? house.instanceTags.join(', ') : 'none'}`;
  root.appendChild(tags);

  const pop = document.createElement('div');
  pop.className = 'small';
  pop.textContent = `Inhabitants: ${inhabitants.length}`;
  root.appendChild(pop);

  const list = document.createElement('ul');
  list.className = 'small';
  for (const inhabitant of inhabitants) {
    const li = document.createElement('li');
    li.textContent = `${inhabitant.label} (${inhabitant.role})`;
    list.appendChild(li);
  }
  root.appendChild(list);
}

function updateListSelection() {
  document.querySelectorAll('[data-world-house-btn]').forEach((node) => {
    const selected = node.getAttribute('data-house-id') === selectedHouseId;
    node.classList.toggle('is-selected', selected);
  });
}

function updateHouseMarkerSelection() {
  const theme = getWorldTheme();
  houseMarkerById.forEach((entry, houseId) => {
    const selected = houseId === selectedHouseId;
    entry.circle.setStrokeStyle(2, selected ? theme.markerSelectedStroke : theme.markerStroke, 1);
    entry.circle.setScale(selected ? 1.2 : 1);
    if (entry.sprite && typeof entry.baseSpriteScale === 'number') {
      entry.sprite.setScale(selected ? entry.baseSpriteScale * 1.05 : entry.baseSpriteScale);
    }
  });
}

function renderHouseList() {
  const list = el('worldHouseList');
  list.innerHTML = '';
  for (const house of state.houses) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-world-house-btn', '1');
    button.setAttribute('data-house-id', house.houseId);
    button.setAttribute('data-testid', `world-house-id-${house.houseId}`);

    const id = document.createElement('span');
    id.className = 'world-house-id';
    id.textContent = house.houseId;
    button.appendChild(id);

    const name = document.createElement('span');
    name.className = 'world-house-name';
    name.textContent = house.name;
    button.appendChild(name);

    button.addEventListener('click', () => selectHouse(house.houseId));
    item.appendChild(button);
    list.appendChild(item);
  }
  updateListSelection();
}

function renderVisibleHouseList(ids) {
  const key = ids.join('|');
  if (key === visibleListKey) return;
  visibleListKey = key;

  const list = el('worldVisibleHouseList');
  list.innerHTML = '';
  if (!ids.length) {
    const item = document.createElement('li');
    item.className = 'small';
    item.textContent = 'No houses in viewport.';
    list.appendChild(item);
    return;
  }

  for (const houseId of ids) {
    const house = state.houses.find((item) => item.houseId === houseId);
    if (!house) continue;
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-world-house-btn', '1');
    button.setAttribute('data-house-id', house.houseId);
    button.setAttribute('data-testid', `world-visible-house-id-${house.houseId}`);
    button.textContent = `${house.houseId} · ${house.name}`;
    button.addEventListener('click', () => selectHouse(house.houseId));
    item.appendChild(button);
    list.appendChild(item);
  }
  updateListSelection();
}

function worldDimensionsWorld() {
  return {
    width: Math.max(Number(state.world?.width || 2400), 400),
    height: Math.max(Number(state.world?.height || 1400), 300)
  };
}

function buildRenderSpace() {
  const world = worldDimensionsWorld();
  if (viewMode !== 'iso') {
    return {
      mode: 'topdown',
      world,
      dims: { width: world.width, height: world.height },
      project(x, y) {
        return { x, y };
      }
    };
  }

  const scale = 1;
  const projectRaw = (x, y) => ({
    x: (x - y) * scale,
    y: (x + y) * scale * 0.5
  });
  const corners = [
    projectRaw(0, 0),
    projectRaw(world.width, 0),
    projectRaw(0, world.height),
    projectRaw(world.width, world.height)
  ];
  const minX = Math.min(...corners.map((pt) => pt.x));
  const maxX = Math.max(...corners.map((pt) => pt.x));
  const minY = Math.min(...corners.map((pt) => pt.y));
  const maxY = Math.max(...corners.map((pt) => pt.y));
  const margin = 220;
  const offsetX = -minX + margin;
  const offsetY = -minY + margin;
  const dims = {
    width: Math.ceil(maxX - minX + margin * 2),
    height: Math.ceil(maxY - minY + margin * 2)
  };

  return {
    mode: 'iso',
    world,
    dims,
    project(x, y) {
      const pt = projectRaw(x, y);
      return { x: pt.x + offsetX, y: pt.y + offsetY };
    }
  };
}

function getRenderSpace() {
  if (!renderSpace) renderSpace = buildRenderSpace();
  return renderSpace;
}

function projectWorldXY(x, y) {
  return getRenderSpace().project(x, y);
}

function projectWorldCoord(coord) {
  return projectWorldXY(coord.x, coord.y);
}

function worldDimensions() {
  return getRenderSpace().dims;
}

function getCamera() {
  return gameScene?.cameras?.main || null;
}

function cssVar(name, fallback) {
  try {
    const value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
    const trimmed = String(value || '').trim();
    return trimmed || fallback;
  } catch (_err) {
    return fallback;
  }
}

function parseHexColor(input, fallback) {
  const raw = String(input || '').trim();
  if (!raw) return fallback;
  if (raw.startsWith('#')) {
    const hex = raw.slice(1);
    if (hex.length === 3) {
      const r = hex[0] + hex[0];
      const g = hex[1] + hex[1];
      const b = hex[2] + hex[2];
      return parseInt(`${r}${g}${b}`, 16);
    }
    if (hex.length === 6) return parseInt(hex, 16);
  }
  return fallback;
}

function getWorldTheme() {
  if (worldTheme) return worldTheme;
  const skyCss = cssVar('--world-sky', '#77bae3');
  const groundCss = cssVar('--world-ground', '#9cd37b');
  const roadCss = cssVar('--world-road', '#f9f0cf');
  const strokeCss = cssVar('--world-marker-stroke', '#2f251d');
  const selectedStrokeCss = cssVar('--world-marker-selected-stroke', '#14213d');
  const housePlayerCss = cssVar('--world-house-player', '#f5d071');
  const houseExperienceCss = cssVar('--world-house-experience', '#ff8a5b');
  const playerCss = cssVar('--world-player', '#2b66d9');
  const playerSelfCss = cssVar('--world-player-self', '#00a86b');
  const labelCss = cssVar('--world-label', '#10212e');
  const playerLabelCss = cssVar('--world-player-label', '#0d2a58');

  worldTheme = {
    skyCss,
    labelCss,
    playerLabelCss,
    ground: parseHexColor(groundCss, 0x9cd37b),
    road: parseHexColor(roadCss, 0xf9f0cf),
    markerStroke: parseHexColor(strokeCss, 0x2f251d),
    markerSelectedStroke: parseHexColor(selectedStrokeCss, 0x14213d),
    housePlayer: parseHexColor(housePlayerCss, 0xf5d071),
    houseExperience: parseHexColor(houseExperienceCss, 0xff8a5b),
    player: parseHexColor(playerCss, 0x2b66d9),
    playerSelf: parseHexColor(playerSelfCss, 0x00a86b)
  };
  return worldTheme;
}

function clampCameraCenter(x, y) {
  const cam = getCamera();
  if (!cam) return { x, y };
  const { width: worldWidth, height: worldHeight } = worldDimensions();
  const halfW = cam.width / (2 * cam.zoom);
  const halfH = cam.height / (2 * cam.zoom);
  const minX = Math.max(halfW, 0);
  const maxX = Math.max(halfW, worldWidth - halfW);
  const minY = Math.max(halfH, 0);
  const maxY = Math.max(halfH, worldHeight - halfH);
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y))
  };
}

function setCameraCenter(x, y, duration = 0) {
  const cam = getCamera();
  if (!cam) return;
  const target = clampCameraCenter(x, y);
  if (duration > 0) cam.pan(target.x, target.y, duration, 'Sine.easeInOut');
  else cam.centerOn(target.x, target.y);
}

function applyCameraZoom(nextZoom) {
  const cam = getCamera();
  if (!cam) return;
  const center = { x: cam.midPoint.x, y: cam.midPoint.y };
  const clamped = window.Phaser.Math.Clamp(nextZoom, 0.65, 2.4);
  cam.setZoom(clamped);
  setCameraCenter(center.x, center.y, 0);
}

function syncPlayerMarkers() {
  if (!gameScene) return;
  const scene = gameScene;
  const theme = getWorldTheme();
  const existing = new Set(realtime.players.keys());
  for (const [playerId, player] of realtime.players.entries()) {
    const pos = projectWorldXY(player.x, player.y);
    let marker = playerMarkerById.get(playerId);
    if (!marker) {
      const circle = scene.add.circle(pos.x, pos.y, 7, theme.player, 0.9);
      circle.setStrokeStyle(2, 0xffffff, 1);
      const label = scene.add.text(pos.x + 8, pos.y - 9, playerId.slice(0, 6), {
        fontSize: '11px',
        color: theme.playerLabelCss,
        fontFamily: 'monospace'
      });
      label.setResolution(2);
      marker = { circle, label };
      playerMarkerById.set(playerId, marker);
    }
    marker.circle.setPosition(pos.x, pos.y);
    marker.label.setPosition(pos.x + 8, pos.y - 9);
    marker.circle.setFillStyle(playerId === realtime.selfId ? theme.playerSelf : theme.player, 0.9);
  }

  for (const [playerId, marker] of Array.from(playerMarkerById.entries())) {
    if (existing.has(playerId)) continue;
    marker.circle.destroy();
    marker.label.destroy();
    playerMarkerById.delete(playerId);
  }
}

function applyCullingAndTelemetry() {
  const cam = getCamera();
  if (!cam) return;
  const view = cam.worldView;
  const pad = 12;
  const visible = [];

  houseMarkerById.forEach((entry, houseId) => {
    const x = entry.circle.x;
    const y = entry.circle.y;
    const inView =
      x >= view.x - pad &&
      x <= view.x + view.width + pad &&
      y >= view.y - pad &&
      y <= view.y + view.height + pad;

    entry.circle.setVisible(inView);
    entry.label.setVisible(inView);
    if (entry.sprite) entry.sprite.setVisible(inView);
    if (inView) visible.push(houseId);
  });

  visible.sort((a, b) => a.localeCompare(b));
  renderVisibleHouseList(visible);
  renderCameraReadout({ x: cam.midPoint.x, y: cam.midPoint.y, zoom: cam.zoom });
}

function focusCameraOn(houseId) {
  const house = state.houses.find((item) => item.houseId === houseId);
  if (!house) return;
  const pos = projectWorldCoord(house.coord);
  setCameraCenter(pos.x, pos.y, 220);
}

function selectHouse(houseId, { focusCamera = true } = {}) {
  selectedHouseId = houseId;
  updateListSelection();
  renderDetail(houseId);
  updateHouseMarkerSelection();
  if (focusCamera) focusCameraOn(houseId);
  const target = el('worldInteractTarget');
  if (target && target.querySelector(`option[value="${houseId}"]`)) {
    target.value = houseId;
  }
}

function destroyGame() {
  houseMarkerById.clear();
  for (const marker of playerMarkerById.values()) {
    marker.circle.destroy();
    marker.label.destroy();
  }
  playerMarkerById.clear();
  if (game) {
    game.destroy(true);
    game = null;
    gameScene = null;
  }
}

function shouldUseSprites() {
  if (!assets.pack) return false;
  if (assets.artPref === 'sprites') return true;
  if (assets.artPref === 'markers') return false;
  return true;
}

function validateAssetPack(pack) {
  if (!pack || typeof pack !== 'object') return false;
  if (pack.version !== 'world_assets_v1') return false;
  if (!Array.isArray(pack.atlases)) return false;
  if (!pack.sprites || typeof pack.sprites !== 'object') return false;
  return true;
}

async function initAssetPack() {
  assets.error = null;
  assets.pack = null;
  assets.packBaseUrl = null;
  if (!assets.packUrl) {
    assets.mode = 'markers';
    return;
  }

  try {
    const pack = await fetchJsonMaybe(assets.packUrl);
    if (!pack) {
      assets.mode = 'markers';
      return;
    }
    if (!validateAssetPack(pack)) {
      throw new Error('ASSET_PACK_INVALID');
    }
    assets.pack = pack;
    assets.packBaseUrl = urlDir(assets.packUrl);
    assets.mode = shouldUseSprites() ? 'sprites' : 'markers';
  } catch (err) {
    assets.error = err;
    assets.mode = 'markers';
  }
}

function registerAtlasFrames(scene, atlas) {
  if (!atlas || typeof atlas !== 'object') return 0;
  if (!atlas.key || typeof atlas.key !== 'string') return 0;
  const frames = atlas.frames;
  if (!frames || typeof frames !== 'object') return 0;

  const texture = scene.textures.get(atlas.key);
  if (!texture) return 0;

  let added = 0;
  for (const [frameName, rect] of Object.entries(frames)) {
    if (!rect || typeof rect !== 'object') continue;
    const x = Number(rect.x);
    const y = Number(rect.y);
    const w = Number(rect.w);
    const h = Number(rect.h);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) continue;
    if (w <= 0 || h <= 0) continue;
    // Source index is always 0 since each atlas uses one image source.
    texture.add(frameName, 0, x, y, w, h);
    added += 1;
  }
  return added;
}

function resolveAtlasImageUrl(atlas) {
  const base = assets.packBaseUrl || '/';
  const useHd = assets.texSize === 'hd';
  const path = useHd && atlas.image2x ? atlas.image2x : atlas.image;
  return resolveUrl(base, path);
}

function initPhaserWorld() {
  destroyGame();
  if (!window.Phaser) return;

  const theme = getWorldTheme();
  const canvasRoot = el('worldCanvas');
  const width = Math.max(640, canvasRoot.clientWidth || 640);
  const height = Math.max(360, canvasRoot.clientHeight || 360);
  const space = getRenderSpace();
  const dims = space.dims;
  const useSprites = assets.mode === 'sprites' && !!assets.pack;

  const config = {
    type: window.Phaser.AUTO,
    parent: 'worldCanvas',
    width,
    height,
    pixelArt: true,
    backgroundColor: theme.skyCss,
    scene: {
      key: 'world',
      preload() {
        if (!useSprites) return;
        const pack = assets.pack;
        for (const atlas of pack.atlases || []) {
          const url = resolveAtlasImageUrl(atlas);
          if (!url) continue;
          // Key becomes the texture key; frames are added in create().
          this.load.image(atlas.key, url);
        }
      },
      create() {
        gameScene = this;
        const scene = this;
        const cam = scene.cameras.main;
        cam.setBounds(0, 0, dims.width, dims.height);
        setCameraCenter(dims.width / 2, dims.height / 2, 0);

        if (useSprites) {
          // Add named frames to each loaded atlas texture using pack-provided clip rects.
          for (const atlas of assets.pack.atlases || []) {
            registerAtlasFrames(scene, atlas);
          }
        }

        const bg = scene.add.graphics();
        bg.lineStyle(1, 0xffffff, 0.25);
        if (space.mode === 'iso') {
          const w = space.world.width;
          const h = space.world.height;
          const p00 = space.project(0, 0);
          const p10 = space.project(w, 0);
          const p11 = space.project(w, h);
          const p01 = space.project(0, h);
          bg.fillStyle(theme.ground, 1);
          bg.fillPoints([p00, p10, p11, p01], true);
          const step = 120;
          for (let x = 0; x <= w; x += step) {
            const a = space.project(x, 0);
            const b = space.project(x, h);
            bg.lineBetween(a.x, a.y, b.x, b.y);
          }
          for (let y = 0; y <= h; y += step) {
            const a = space.project(0, y);
            const b = space.project(w, y);
            bg.lineBetween(a.x, a.y, b.x, b.y);
          }
        } else {
          bg.fillStyle(theme.ground, 1);
          bg.fillRect(0, dims.height * 0.45, dims.width, dims.height * 0.55);
          bg.fillStyle(theme.road, 1);
          bg.fillRoundedRect(100, dims.height * 0.42, Math.max(200, dims.width - 200), 150, 28);
          for (let x = 0; x <= dims.width; x += 120) bg.lineBetween(x, 0, x, dims.height);
          for (let y = 0; y <= dims.height; y += 120) bg.lineBetween(0, y, dims.width, y);
        }

        assets.stats = { spriteHouses: 0, totalHouses: state.houses.length };
        for (const house of state.houses) {
          const pos = space.project(house.coord.x, house.coord.y);
          const spec = useSprites ? assets.pack?.sprites?.[house.spriteKey] : null;
          let sprite = null;
          let baseSpriteScale = 1;
          if (spec && spec.atlas && spec.frame) {
            const origin = Array.isArray(spec.origin) ? spec.origin : null;
            baseSpriteScale = Number.isFinite(Number(spec.scale)) ? Number(spec.scale) : 1;
            sprite = scene.add.sprite(pos.x, pos.y, spec.atlas, spec.frame);
            if (origin && origin.length === 2) sprite.setOrigin(Number(origin[0]), Number(origin[1]));
            else sprite.setOrigin(0.5, 1);
            sprite.setScale(baseSpriteScale);
            sprite.setDepth(pos.y);
            sprite.setInteractive({ useHandCursor: true });
            sprite.on('pointerdown', () => selectHouse(house.houseId, { focusCamera: false }));
            assets.stats.spriteHouses += 1;
          }

          const tint = house.type === 'experience' ? theme.houseExperience : theme.housePlayer;
          const circle = scene.add.circle(pos.x, pos.y, 12, tint, sprite ? 0 : 1);
          circle.setStrokeStyle(2, theme.markerStroke, sprite ? 0.6 : 1);
          circle.setInteractive({ useHandCursor: true });
          circle.on('pointerdown', () => selectHouse(house.houseId, { focusCamera: false }));
          circle.setDepth(pos.y + 1);

          const label = scene.add.text(pos.x + 14, pos.y - 8, house.houseId, {
            fontSize: '12px',
            color: theme.labelCss,
            fontFamily: 'monospace'
          });
          label.setResolution(2);
          label.setDepth(pos.y + 2);

          houseMarkerById.set(house.houseId, { house, circle, label, sprite, baseSpriteScale });
        }

        let drag = null;
        scene.input.on('pointerdown', (pointer, over) => {
          if (over && over.length) return;
          drag = { x: pointer.x, y: pointer.y };
        });
        scene.input.on('pointerup', () => {
          drag = null;
        });
        scene.input.on('pointermove', (pointer) => {
          if (!drag) return;
          const dx = (pointer.x - drag.x) / cam.zoom;
          const dy = (pointer.y - drag.y) / cam.zoom;
          cam.scrollX -= dx;
          cam.scrollY -= dy;
          setCameraCenter(cam.midPoint.x, cam.midPoint.y, 0);
          drag = { x: pointer.x, y: pointer.y };
        });
        scene.input.on('wheel', (_pointer, _over, _dx, dy) => {
          applyCameraZoom(cam.zoom - dy * 0.0012);
          applyCullingAndTelemetry();
        });

        scene.events.on('update', () => {
          applyCullingAndTelemetry();
          syncPlayerMarkers();
        });

        if (selectedHouseId && state.houses.find((house) => house.houseId === selectedHouseId)) {
          selectHouse(selectedHouseId, { focusCamera: false });
          focusCameraOn(selectedHouseId);
        } else if (state.houses.length) {
          selectHouse(state.houses[0].houseId, { focusCamera: false });
        }
        syncPlayerMarkers();
        applyCullingAndTelemetry();
      }
    }
  };

  game = new window.Phaser.Game(config);
}

function renderInteractionTargets() {
  const select = el('worldInteractTarget');
  const current = select.value;
  const houses = (realtime.assignment?.houses || state.houses).filter((house) => house.type === 'experience');
  select.innerHTML = '';
  for (const house of houses) {
    const option = document.createElement('option');
    option.value = house.houseId;
    option.textContent = `${house.houseId} · ${house.name}`;
    select.appendChild(option);
  }
  if (current && select.querySelector(`option[value="${current}"]`)) {
    select.value = current;
  }
}

function renderPlayers() {
  const list = el('worldPlayerList');
  list.innerHTML = '';
  const players = Array.from(realtime.players.values()).sort((a, b) => a.playerId.localeCompare(b.playerId));
  el('worldPlayerCount').textContent = String(players.length);

  for (const player of players) {
    const item = document.createElement('li');
    item.setAttribute('data-testid', `world-player-${safeTestId(player.playerId)}`);
    item.setAttribute('data-player-id', player.playerId);
    item.textContent =
      `${player.playerId === realtime.selfId ? 'You' : player.playerId}` +
      ` (${Math.round(player.x)}, ${Math.round(player.y)})`;
    list.appendChild(item);
  }
}

function pushInteraction(result) {
  realtime.interactions.unshift(result);
  realtime.interactions = realtime.interactions.slice(0, 20);
  const list = el('worldInteractionLog');
  list.innerHTML = '';
  for (let i = 0; i < realtime.interactions.length; i += 1) {
    const row = realtime.interactions[i];
    const item = document.createElement('li');
    item.setAttribute('data-testid', `world-interaction-item-${i}`);
    if (row.ok) {
      item.textContent = `${row.playerId || 'player'} interacted with ${row.targetId}`;
    } else {
      item.textContent = `Interaction failed: ${row.error || 'UNKNOWN'}`;
    }
    list.appendChild(item);
  }
}

function setRealtimeButtons(joined) {
  el('worldJoinBtn').disabled = joined;
  el('worldLeaveBtn').disabled = !joined;
  el('worldMoveLeftBtn').disabled = !joined;
  el('worldMoveRightBtn').disabled = !joined;
  el('worldMoveUpBtn').disabled = !joined;
  el('worldMoveDownBtn').disabled = !joined;
  el('worldInteractBtn').disabled = !joined;
}

function onRealtimeDisconnected(reason = null) {
  realtime.room = null;
  realtime.client = null;
  realtime.instanceId = null;
  realtime.selfId = null;
  realtime.seq = 0;
  realtime.players.clear();
  renderPlayers();
  el('worldRealtimeInstance').textContent = '-';
  setRealtimeButtons(false);
  setRealtimeStatus(reason ? `Disconnected (${reason})` : 'Disconnected');
}

async function joinRealtime() {
  if (!window.Colyseus) throw new Error('COLYSEUS_CLIENT_MISSING');
  if (realtime.room) return;

  const config = await api('/api/world/realtime/config');
  const assignment = await api('/api/world/instance/assign', {
    method: 'POST',
    body: JSON.stringify({})
  });
  realtime.config = config;
  realtime.assignment = assignment;

  const client = new window.Colyseus.Client(config.wsUrl);
  const room = await client.joinOrCreate(config.roomName, {
    instanceId: assignment.instanceId,
    displayName: 'visitor'
  });

  realtime.client = client;
  realtime.room = room;
  realtime.instanceId = assignment.instanceId;
  realtime.players.clear();
  realtime.interactions = [];
  realtime.seq = 0;

  el('worldRealtimeInstance').textContent = assignment.instanceId;
  setRealtimeButtons(true);
  setRealtimeStatus('Connected');
  renderInteractionTargets();

  room.onMessage('room_joined', (msg) => {
    realtime.selfId = msg.playerId;
    setRealtimeStatus(`Connected (${msg.instanceId})`);
  });

  room.onMessage('state_patch', (patch) => {
    realtime.instanceId = patch.instanceId;
    el('worldRealtimeInstance').textContent = patch.instanceId;
    realtime.players.clear();
    for (const player of patch.players || []) {
      realtime.players.set(player.playerId, player);
    }
    renderPlayers();
    syncPlayerMarkers();
  });

  room.onMessage('interaction_result', (result) => {
    pushInteraction(result);
  });

  room.onError((code, message) => {
    setRealtimeStatus(`Error ${code}: ${message}`, { error: true });
  });

  room.onLeave((code) => {
    onRealtimeDisconnected(String(code || 'leave'));
  });
}

async function leaveRealtime() {
  if (!realtime.room) return;
  await realtime.room.leave(true);
  onRealtimeDisconnected();
}

function sendMoveIntent(dirX, dirY) {
  if (!realtime.room) return;
  realtime.seq += 1;
  realtime.room.send('move_intent', { dirX, dirY, seq: realtime.seq });
}

function sendInteractIntent(targetId) {
  if (!realtime.room) return;
  realtime.room.send('interact_intent', { targetType: 'house', targetId });
}

function updateRecordingUi() {
  el('worldRecordBtn').textContent = clip.recording ? 'Stop recording' : 'Start recording';
  el('worldUploadClipBtn').disabled = !(clip.blob && clip.clipId && !clip.recording);
}

function revokeClipUrl() {
  if (clip.blobUrl) {
    URL.revokeObjectURL(clip.blobUrl);
    clip.blobUrl = null;
  }
}

function base64FromBytes(bytes) {
  let out = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    out += String.fromCharCode(...slice);
  }
  return btoa(out);
}

function supportsRecording(canvas) {
  return !!(canvas && typeof canvas.captureStream === 'function' && typeof window.MediaRecorder === 'function');
}

async function createClipRecord() {
  const response = await api('/api/clips', {
    method: 'POST',
    body: JSON.stringify({
      instanceId: realtime.instanceId || state.instance,
      durationSec: clip.durationSec,
      mimeType: clip.blob?.type || 'video/webm',
      sizeBytes: clip.blob?.size || 0
    })
  });
  clip.clipId = response.clipId;
  updateRecordingUi();
}

function clearRecordTimers() {
  if (clip.durationTimer) {
    clearInterval(clip.durationTimer);
    clip.durationTimer = null;
  }
  if (clip.autoStopTimer) {
    clearTimeout(clip.autoStopTimer);
    clip.autoStopTimer = null;
  }
}

async function finalizeRecording() {
  clearRecordTimers();
  clip.recording = false;
  if (clip.stream) {
    for (const track of clip.stream.getTracks()) track.stop();
    clip.stream = null;
  }

  const durationSec = Math.min(60, Math.max(0, (Date.now() - clip.startedAt) / 1000));
  clip.durationSec = Number(durationSec.toFixed(1));
  el('worldClipDuration').textContent = `${clip.durationSec.toFixed(1)}s`;

  const blob = new Blob(clip.chunks, { type: clip.recorder?.mimeType || 'video/webm' });
  clip.chunks = [];
  clip.recorder = null;

  if (!blob.size) {
    el('worldRecordStatus').textContent = 'Recording failed: empty clip.';
    updateRecordingUi();
    return;
  }

  clip.blob = blob;
  clip.clipId = null;
  revokeClipUrl();
  clip.blobUrl = URL.createObjectURL(blob);
  const download = el('worldClipDownload');
  download.href = clip.blobUrl;
  download.classList.remove('is-hidden');

  el('worldRecordStatus').textContent = 'Clip ready (local).';
  setUploadStatus('');
  try {
    await createClipRecord();
  } catch (err) {
    setUploadStatus(`Clip record failed: ${err.message}`, { error: true });
  }
  updateRecordingUi();
}

async function startRecording() {
  const canvas = document.querySelector('#worldCanvas canvas');
  if (!supportsRecording(canvas)) {
    el('worldRecordStatus').textContent = 'Recording not supported in this browser.';
    return;
  }

  revokeClipUrl();
  el('worldClipDownload').classList.add('is-hidden');
  el('worldClipShareLink').classList.add('is-hidden');
  clip.blob = null;
  clip.clipId = null;
  clip.chunks = [];
  clip.durationSec = 0;
  setUploadStatus('');
  el('worldClipDuration').textContent = '0.0s';

  clip.stream = canvas.captureStream(30);
  const mimeType = window.MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  clip.recorder = new window.MediaRecorder(clip.stream, { mimeType });
  clip.recorder.ondataavailable = (event) => {
    if (event?.data && event.data.size > 0) clip.chunks.push(event.data);
  };
  clip.recorder.onstop = () => {
    finalizeRecording().catch((err) => {
      setUploadStatus(`Finalize failed: ${err.message}`, { error: true });
    });
  };

  clip.startedAt = Date.now();
  clip.recording = true;
  clip.recorder.start(250);
  clip.durationTimer = setInterval(() => {
    const sec = (Date.now() - clip.startedAt) / 1000;
    el('worldClipDuration').textContent = `${Math.min(60, sec).toFixed(1)}s`;
  }, 100);
  clip.autoStopTimer = setTimeout(() => {
    if (clip.recording) stopRecording();
  }, 60_000);

  el('worldRecordStatus').textContent = 'Recording…';
  updateRecordingUi();
}

function stopRecording() {
  if (!clip.recording || !clip.recorder) return;
  clip.recorder.stop();
}

async function pollClipReady(clipId) {
  for (let i = 0; i < 200; i += 1) {
    const details = await api(`/api/clips/${encodeURIComponent(clipId)}`);
    if (details.status === 'ready') return details;
    if (details.status === 'failed') return details;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('CLIP_PROCESS_TIMEOUT');
}

async function uploadClip() {
  if (!clip.blob || !clip.clipId) return;
  const buf = new Uint8Array(await clip.blob.arrayBuffer());
  const dataBase64 = base64FromBytes(buf);
  setUploadStatus('Uploading clip…');
  const upload = await api(`/api/clips/${encodeURIComponent(clip.clipId)}/upload-complete`, {
    method: 'POST',
    body: JSON.stringify({
      mimeType: clip.blob.type || 'video/webm',
      sizeBytes: clip.blob.size,
      dataBase64
    })
  });
  setUploadStatus(`Upload accepted (${upload.status}). Processing…`);
  const ready = await pollClipReady(clip.clipId);
  if (ready.status !== 'ready') {
    setUploadStatus(`Clip processing failed (${ready.error || 'UNKNOWN'}).`, { error: true });
    return;
  }
  setUploadStatus('Clip ready for sharing.');
  const shareLink = el('worldClipShareLink');
  shareLink.href = ready.sharePath || ready.shareUrl || '#';
  shareLink.classList.remove('is-hidden');
}

function applySnapshot(snapshot) {
  const nextRevision = snapshot?.world?.revision || null;
  const changed = nextRevision !== state.revision;

  state.instance = snapshot.instance;
  state.world = snapshot.world || null;
  state.houses = Array.isArray(snapshot.houses) ? snapshot.houses : [];
  state.inhabitants = Array.isArray(snapshot.inhabitants) ? snapshot.inhabitants : [];
  state.revision = nextRevision;
  renderSpace = null;
  worldTheme = null;
  assetsLoadedOnce = false;

  renderCounts();
  renderHouseList();
  renderInteractionTargets();

  if (!selectedHouseId || !state.houses.some((house) => house.houseId === selectedHouseId)) {
    selectedHouseId = state.houses[0]?.houseId || null;
  }
  renderDetail(selectedHouseId);

  if (!game || changed) {
    initPhaserWorld();
  } else {
    updateHouseMarkerSelection();
    applyCullingAndTelemetry();
  }
}

async function fetchSnapshot() {
  return api('/api/world/snapshot?instance=public');
}

async function refreshSnapshot() {
  if (polling) return;
  polling = true;
  try {
    const snapshot = await fetchSnapshot();
    const incomingRevision = snapshot?.world?.revision || null;
    if (incomingRevision !== state.revision) {
      applySnapshot(snapshot);
      setStatus(`Loaded ${snapshot.houses.length} houses.`);
    }
  } catch (err) {
    setStatus(`Refresh failed: ${err.message}`, { error: true });
  } finally {
    polling = false;
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refreshSnapshot, 1500);
}

function bindControls() {
  el('worldPanLeftBtn').addEventListener('click', () => {
    const cam = getCamera();
    if (!cam) return;
    setCameraCenter(cam.midPoint.x - 220, cam.midPoint.y, 180);
  });
  el('worldPanRightBtn').addEventListener('click', () => {
    const cam = getCamera();
    if (!cam) return;
    setCameraCenter(cam.midPoint.x + 220, cam.midPoint.y, 180);
  });
  el('worldPanUpBtn').addEventListener('click', () => {
    const cam = getCamera();
    if (!cam) return;
    setCameraCenter(cam.midPoint.x, cam.midPoint.y - 180, 180);
  });
  el('worldPanDownBtn').addEventListener('click', () => {
    const cam = getCamera();
    if (!cam) return;
    setCameraCenter(cam.midPoint.x, cam.midPoint.y + 180, 180);
  });
  el('worldZoomInBtn').addEventListener('click', () => {
    const cam = getCamera();
    if (!cam) return;
    applyCameraZoom(cam.zoom + 0.2);
    applyCullingAndTelemetry();
  });
  el('worldZoomOutBtn').addEventListener('click', () => {
    const cam = getCamera();
    if (!cam) return;
    applyCameraZoom(cam.zoom - 0.2);
    applyCullingAndTelemetry();
  });
  el('worldResetViewBtn').addEventListener('click', () => {
    const dims = worldDimensions();
    applyCameraZoom(1);
    setCameraCenter(dims.width / 2, dims.height / 2, 220);
  });

  el('worldJoinBtn').addEventListener('click', () => {
    joinRealtime().catch((err) => setRealtimeStatus(`Join failed: ${err.message}`, { error: true }));
  });
  el('worldLeaveBtn').addEventListener('click', () => {
    leaveRealtime().catch(() => onRealtimeDisconnected('leave_failed'));
  });
  el('worldMoveLeftBtn').addEventListener('click', () => sendMoveIntent(-1, 0));
  el('worldMoveRightBtn').addEventListener('click', () => sendMoveIntent(1, 0));
  el('worldMoveUpBtn').addEventListener('click', () => sendMoveIntent(0, -1));
  el('worldMoveDownBtn').addEventListener('click', () => sendMoveIntent(0, 1));
  el('worldInteractBtn').addEventListener('click', () => {
    const target = el('worldInteractTarget').value;
    if (!target) return;
    sendInteractIntent(target);
  });

  el('worldRecordBtn').addEventListener('click', () => {
    if (clip.recording) stopRecording();
    else {
      startRecording().catch((err) => {
        setUploadStatus(`Record failed: ${err.message}`, { error: true });
      });
    }
  });
  el('worldUploadClipBtn').addEventListener('click', () => {
    uploadClip().catch((err) => setUploadStatus(`Upload failed: ${err.message}`, { error: true }));
  });
}

async function init() {
  bindControls();
  setRealtimeButtons(false);
  updateRecordingUi();
  const viewNode = el('worldViewMode');
  if (viewNode) viewNode.textContent = viewMode;
  renderCameraReadout({ x: 0, y: 0, zoom: 1 });
  setStatus('Loading snapshot…');

  try {
    await initAssetPack();
    const snapshot = await fetchSnapshot();
    applySnapshot(snapshot);
    setStatus(`Loaded ${snapshot.houses.length} houses.`);
    startPolling();
  } catch (err) {
    console.error(err);
    setStatus(`Load failed: ${err.message}`, { error: true });
  }
}

window.addEventListener('resize', () => {
  if (!game) return;
  initPhaserWorld();
});

window.addEventListener('beforeunload', () => {
  if (pollTimer) clearInterval(pollTimer);
  clearRecordTimers();
  revokeClipUrl();
});

window.__worldDebug = {
  sendRawMoveIntent(payload) {
    if (!realtime.room) return false;
    realtime.room.send('move_intent', payload);
    return true;
  },
  sendRawInteractIntent(payload) {
    if (!realtime.room) return false;
    realtime.room.send('interact_intent', payload);
    return true;
  },
  getRealtimePlayers() {
    return Array.from(realtime.players.values());
  },
  getSelfId() {
    return realtime.selfId;
  },
  getAssets() {
    return {
      mode: assets.mode,
      artPref: assets.artPref,
      texSize: assets.texSize,
      packUrl: assets.packUrl,
      packBaseUrl: assets.packBaseUrl,
      packId: assets.pack?.packId || null,
      error: assets.error ? assets.error.message : null,
      stats: assets.stats
    };
  }
};

init();
