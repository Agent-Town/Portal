import * as THREE from 'three';

const WORLD_WIDTH = 16;
const WORLD_HEIGHT = 9;
const stageRenderers = new WeakMap();
const textureCache = new Map();

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function worldX(x) {
  return (number(x, 0.5) - 0.5) * WORLD_WIDTH;
}

function worldY(y) {
  return (0.5 - number(y, 0.5)) * WORLD_HEIGHT;
}

function depthFor(object = {}, extra = 0) {
  return -1 + ((1 - number(object.y, 0.5)) * 0.6) + (number(object.z, 0) * 0.025) + extra;
}

function roleStyle(role = '') {
  switch (String(role)) {
    case 'builder':
      return { fill: '#c97a3d', stroke: '#5a2f16', cue: '#ffe4a0', mark: 'B' };
    case 'worker':
      return { fill: '#5f8d8e', stroke: '#173f41', cue: '#d6f1ef', mark: 'W' };
    case 'hauler':
      return { fill: '#d7ae50', stroke: '#654716', cue: '#fff0bd', mark: 'H' };
    case 'messenger':
      return { fill: '#c85c75', stroke: '#5a1c2b', cue: '#ffd5de', mark: '!' };
    default:
      return { fill: '#7f9b66', stroke: '#254526', cue: '#daf0cf', mark: 'C' };
  }
}

function stablePhase(value = '') {
  const text = String(value || '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash % 628) / 100;
}

function makeRoleTexture(role = 'worker') {
  const key = `role:${role}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const style = roleStyle(role);
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(46, 27, 14, 0.22)';
  ctx.beginPath();
  ctx.ellipse(96, 194, 54, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = style.fill;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(50, 46, 92, 118, 36);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = '800 72px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.mark, 96, 104);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeTextTexture(text = '', tone = 'neutral') {
  const key = `text:${tone}:${text}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const fill = tone === 'ready' ? '#ffe4a0' : tone === 'selected' ? '#d6f1ef' : '#fff8e8';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(10, 12, canvas.width - 20, canvas.height - 24, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2e1b0e';
  ctx.font = '700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = String(text || '').length > 20 ? `${String(text).slice(0, 17)}...` : String(text || '');
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 2, canvas.width - 44);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function drawStar(ctx, cx, cy, outer, inner) {
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outer : inner;
    const angle = (-Math.PI / 2) + (point * Math.PI / 5);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (point === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function makeActionCueTexture(role = 'worker', cue = {}) {
  const accessory = String(cue.accessory || 'tools');
  const actionKind = String(cue.actionKind || '');
  const key = `cue:${role}:${accessory}:${actionKind}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const style = roleStyle(role);
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(46, 27, 14, 0.24)';
  ctx.beginPath();
  ctx.ellipse(84, 126, 46, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = style.cue;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(31, 20, 98, 98, 28);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = style.stroke;
  ctx.fillStyle = style.fill;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 10;

  if (accessory === 'hammer') {
    ctx.beginPath();
    ctx.moveTo(58, 88);
    ctx.lineTo(104, 42);
    ctx.moveTo(85, 37);
    ctx.lineTo(119, 71);
    ctx.stroke();
  } else if (accessory === 'wrench') {
    ctx.beginPath();
    ctx.arc(62, 50, 18, 0.2, Math.PI * 1.55);
    ctx.moveTo(73, 65);
    ctx.lineTo(108, 100);
    ctx.stroke();
  } else if (accessory === 'bundle') {
    ctx.fillStyle = '#c4883a';
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(50, 54, 60, 46, 10);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, 78);
    ctx.lineTo(110, 78);
    ctx.moveTo(80, 54);
    ctx.lineTo(80, 100);
    ctx.stroke();
  } else if (accessory === 'coin') {
    ctx.fillStyle = '#d7ae50';
    for (const y of [92, 77, 62]) {
      ctx.beginPath();
      ctx.ellipse(80, y, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (accessory === 'approval') {
    ctx.font = '900 46px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OK', 80, 74);
  } else if (accessory === 'reward') {
    ctx.fillStyle = '#d7ae50';
    drawStar(ctx, 80, 74, 34, 15);
    ctx.fill();
    ctx.stroke();
  } else if (accessory === 'quest') {
    ctx.beginPath();
    ctx.moveTo(80, 38);
    ctx.lineTo(112, 74);
    ctx.lineTo(80, 110);
    ctx.lineTo(48, 74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (accessory === 'clover') {
    ctx.font = '900 58px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 80, 76);
  } else if (accessory === 'notice') {
    ctx.font = '900 70px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 80, 74);
  } else {
    ctx.beginPath();
    ctx.arc(80, 74, 24, 0, Math.PI * 2);
    ctx.moveTo(48, 74);
    ctx.lineTo(112, 74);
    ctx.moveTo(80, 42);
    ctx.lineTo(80, 106);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeProgressTexture(role = 'worker', progress = 0) {
  const clamped = clamp(number(progress, 0), 0, 1);
  const bucket = Math.round(clamped * 100);
  const key = `progress:${role}:${bucket}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const style = roleStyle(role);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(46, 27, 14, 0.40)';
  ctx.beginPath();
  ctx.roundRect(18, 18, 220, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath();
  ctx.roundRect(24, 23, 208, 18, 9);
  ctx.fill();
  ctx.fillStyle = style.fill;
  ctx.beginPath();
  ctx.roundRect(24, 23, Math.max(12, 208 * clamped), 18, 9);
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(18, 18, 220, 28, 14);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function loadTexture(src, onLoad) {
  const key = String(src || '').trim();
  if (!key) return null;
  if (textureCache.has(key)) return textureCache.get(key);
  const texture = new THREE.TextureLoader().load(key, () => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    if (typeof onLoad === 'function') onLoad();
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

function spriteHeight(object = {}) {
  if (object.kind === 'actor') return object.canonicalRoleId === 'clover' ? 1.35 : 1.05;
  if (object.kind === 'pad') return 1.05;
  if (object.buildingType === 'HQ') return 2.15 * number(object.scale, 1);
  return 1.55 * number(object.scale, 1);
}

function makeSprite(object = {}, texture, extraDepth = 0) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.04
  });
  const sprite = new THREE.Sprite(material);
  const image = texture?.image || null;
  const aspect = image && image.width && image.height ? image.width / image.height : 1;
  const height = spriteHeight(object);
  sprite.position.set(worldX(object.x), worldY(object.y), depthFor(object, extraDepth));
  sprite.scale.set(height * clamp(aspect, 0.62, 1.75), height, 1);
  sprite.userData = userDataForObject(object, {
    sprite: true,
    baseY: sprite.position.y,
    phase: stablePhase(object.actorId || object.id)
  });
  return sprite;
}

function userDataForObject(object = {}, extra = {}) {
  return {
    objectId: String(object.id || ''),
    kind: String(object.kind || ''),
    label: String(object.label || ''),
    selectionKey: String(object.selectionKey || ''),
    drawerKey: String(object.drawerKey || ''),
    testId: String(object.testId || ''),
    state: String(object.state || ''),
    visualOnly: object.visualOnly === true,
    actorId: String(object.actorId || ''),
    canonicalRoleId: String(object.canonicalRoleId || ''),
    generatedOverlayRoleId: String(object.generatedOverlayRoleId || ''),
    sourceDomain: String(object.sourceDomain || ''),
    sourceObjectId: String(object.sourceObjectId || ''),
    sourceStateHash: String(object.sourceStateHash || ''),
    visualState: String(object.visualState || ''),
    actionKind: String(object.actionKind || ''),
    actionCueType: String(object.actionCue?.cueType || ''),
    actionCueAccessory: String(object.actionCue?.accessory || ''),
    progress: number(object.progress, 0),
    validPlacement: object.validPlacement === true,
    x: number(object.x, 0.5),
    y: number(object.y, 0.5),
    ...extra
  };
}

function makeHitTarget(object = {}, sprite) {
  const width = Math.max(1.05, sprite.scale.x * 1.04);
  const height = Math.max(1.05, sprite.scale.y * 1.12);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.001,
      depthWrite: false
    })
  );
  mesh.position.copy(sprite.position);
  mesh.position.z += 0.10;
  mesh.userData = userDataForObject(object, { hitTarget: true });
  return mesh;
}

function makeLabel(object = {}, sprite) {
  if (object.kind === 'actor') return null;
  const state = String(object.state || '');
  const tone = object.selected ? 'selected' : state === 'OUTPUT_READY' ? 'ready' : 'neutral';
  const texture = makeTextTexture(object.label || object.id, tone);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.03
  }));
  label.position.set(sprite.position.x, sprite.position.y - (sprite.scale.y * 0.58), sprite.position.z + 0.18);
  label.scale.set(1.55, 0.39, 1);
  label.userData = userDataForObject(object, { labelSprite: true });
  return label;
}

function makeActionCues(object = {}, sprite) {
  if (object.kind !== 'actor' || !object.actionCue) return [];
  const role = String(object.canonicalRoleId || 'worker');
  const cue = object.actionCue || {};
  const sprites = [];
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeActionCueTexture(role, cue),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.03
  }));
  const xOffset = role === 'hauler' ? 0.52 : role === 'messenger' ? 0.38 : 0.44;
  const yOffset = role === 'hauler' ? -0.08 : sprite.scale.y * 0.52;
  badge.position.set(sprite.position.x + xOffset, sprite.position.y + yOffset, sprite.position.z + 0.22);
  badge.scale.set(role === 'messenger' ? 0.62 : 0.54, role === 'messenger' ? 0.62 : 0.54, 1);
  badge.userData = userDataForObject(object, {
    actionCueSprite: true,
    actionCueType: String(cue.cueType || ''),
    actionCueAccessory: String(cue.accessory || ''),
    baseY: badge.position.y,
    phase: stablePhase(object.actorId || object.id)
  });
  sprites.push(badge);

  if (role === 'builder' || role === 'worker') {
    const progress = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeProgressTexture(role, cue.progress),
      transparent: true,
      depthTest: true,
      depthWrite: false,
      alphaTest: 0.03
    }));
    progress.position.set(sprite.position.x, sprite.position.y - (sprite.scale.y * 0.62), sprite.position.z + 0.24);
    progress.scale.set(1.15, 0.29, 1);
    progress.userData = userDataForObject(object, {
      actionCueSprite: true,
      progressSprite: true,
      actionCueType: String(cue.cueType || ''),
      actionCueAccessory: 'progress',
      baseY: progress.position.y,
      phase: stablePhase(object.actorId || object.id)
    });
    sprites.push(progress);
  }

  return sprites;
}

function cellColor(cell = {}) {
  if (cell.selected) return 0x5f8d8e;
  if (cell.buildable) return 0x7f9b66;
  if (cell.occupied) return 0xc4883a;
  return 0x9d7558;
}

function makeGridCell(cell = {}) {
  const pos = {
    x: clamp((number(cell.x) + 0.5) / 3, 0.08, 0.92),
    y: clamp((number(cell.y) + 0.5) / 3, 0.10, 0.90)
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.55, 1.78),
    new THREE.MeshBasicMaterial({
      color: cellColor(cell),
      transparent: true,
      opacity: cell.selected ? 0.34 : cell.buildable ? 0.18 : 0.10,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  mesh.position.set(worldX(pos.x), worldY(pos.y), -2.1);
  mesh.userData = {
    objectId: String(cell.id || ''),
    kind: 'grid_cell',
    selectionKey: String(cell.selectionKey || ''),
    buildable: cell.buildable === true,
    occupied: cell.occupied === true,
    hitTarget: true
  };
  return mesh;
}

function detailFromObject(object, source = 'three-raycast') {
  const data = object?.userData || {};
  return {
    objectId: String(data.objectId || ''),
    kind: String(data.kind || ''),
    label: String(data.label || ''),
    selectionKey: String(data.selectionKey || ''),
    drawerKey: String(data.drawerKey || ''),
    testId: String(data.testId || ''),
    visualOnly: data.visualOnly === true,
    actorId: String(data.actorId || ''),
    canonicalRoleId: String(data.canonicalRoleId || ''),
    generatedOverlayRoleId: String(data.generatedOverlayRoleId || ''),
    sourceDomain: String(data.sourceDomain || ''),
    sourceObjectId: String(data.sourceObjectId || ''),
    sourceStateHash: String(data.sourceStateHash || ''),
    visualState: String(data.visualState || ''),
    actionKind: String(data.actionKind || ''),
    actionCueType: String(data.actionCueType || ''),
    actionCueAccessory: String(data.actionCueAccessory || ''),
    progress: number(data.progress, 0),
    validPlacement: data.validPlacement === true,
    source,
    atMs: Date.now()
  };
}

class FoundersPlotThreeStage {
  constructor(stageNode) {
    this.stageNode = stageNode;
    this.viewport = null;
    this.scenePayload = null;
    this.pickables = [];
    this.objectMeshes = [];
    this.info = {};
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(WORLD_WIDTH / -2, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT / -2, 0.1, 100);
    this.camera.position.set(0, 0, 12);
    this.camera.lookAt(0, 0, 0);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setClearColor(0xf4d8a8, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.className = 'fp-three-canvas';
    this.renderer.domElement.dataset.testid = 'founders-three-canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Founders Plot Three.js scene');
    this.onClick = this.onClick.bind(this);
    this.onResize = this.onResize.bind(this);
    this.animate = this.animate.bind(this);
    this.running = true;
    this.reducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    this.resizeObserver = new ResizeObserver(this.onResize);
    requestAnimationFrame(this.animate);
  }

  attach(viewport) {
    if (!(viewport instanceof HTMLElement)) return;
    this.viewport = viewport;
    if (this.renderer.domElement.parentElement !== viewport) viewport.appendChild(this.renderer.domElement);
    this.stageNode.addEventListener('click', this.onClick, true);
    this.resizeObserver.observe(viewport);
    this.onResize();
  }

  dispose() {
    this.running = false;
    this.stageNode.removeEventListener('click', this.onClick, true);
    this.resizeObserver.disconnect();
    this.clearScene();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  clearScene() {
    const children = this.scene.children.slice();
    children.forEach((child) => {
      this.scene.remove(child);
      child.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
    });
    this.pickables = [];
    this.objectMeshes = [];
  }

  onResize() {
    const rect = (this.viewport || this.stageNode).getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const target = WORLD_WIDTH / WORLD_HEIGHT;
    if (aspect >= target) {
      const visibleWidth = WORLD_HEIGHT * aspect;
      this.camera.left = visibleWidth / -2;
      this.camera.right = visibleWidth / 2;
      this.camera.top = WORLD_HEIGHT / 2;
      this.camera.bottom = WORLD_HEIGHT / -2;
    } else {
      const visibleHeight = WORLD_WIDTH / aspect;
      this.camera.left = WORLD_WIDTH / -2;
      this.camera.right = WORLD_WIDTH / 2;
      this.camera.top = visibleHeight / 2;
      this.camera.bottom = visibleHeight / -2;
    }
    this.camera.updateProjectionMatrix();
    this.render();
  }

  sync(scenePayload = {}) {
    this.scenePayload = scenePayload;
    this.rebuild();
    this.render();
  }

  rebuild() {
    this.clearScene();
    const payload = this.scenePayload || {};
    const bgSrc = window.innerWidth <= 560 ? payload.stageBackgrounds?.mobile : payload.stageBackgrounds?.desktop;
    const bgTexture = loadTexture(bgSrc, () => this.render());
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT),
      new THREE.MeshBasicMaterial({ map: bgTexture || makeTextTexture('Founders Plot') })
    );
    bg.position.set(0, 0, -4);
    this.scene.add(bg);

    for (const cell of payload.grid?.cells || []) {
      const mesh = makeGridCell(cell);
      this.scene.add(mesh);
      this.pickables.push(mesh);
    }

    for (const object of payload.objects || []) {
      const texture = object.assetSrc ? loadTexture(object.assetSrc, () => this.render()) : makeRoleTexture(object.canonicalRoleId || object.kind);
      const sprite = makeSprite(object, texture || makeRoleTexture(object.canonicalRoleId || 'worker'), object.kind === 'actor' ? 0.8 : 0);
      this.scene.add(sprite);
      this.objectMeshes.push(sprite);
      const hit = makeHitTarget(object, sprite);
      this.scene.add(hit);
      this.pickables.push(hit);
      const label = makeLabel(object, sprite);
      if (label) this.scene.add(label);
      for (const cue of makeActionCues(object, sprite)) {
        this.scene.add(cue);
        this.objectMeshes.push(cue);
      }
    }
    this.updateInfo();
  }

  pickFromEvent(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    return hits[0]?.object || null;
  }

  onClick(event) {
    const hit = this.pickFromEvent(event);
    if (!hit) return;
    const detail = detailFromObject(hit);
    if (detail.visualOnly) {
      event.preventDefault();
      event.stopPropagation();
    }
    window.dispatchEvent(new CustomEvent('founders-plot-scene-pick', { detail }));
  }

  canvasPointFor(object) {
    const vector = new THREE.Vector3(worldX(object.x), worldY(object.y), depthFor(object, object.kind === 'actor' ? 0.8 : 0));
    vector.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: ((vector.x + 1) / 2) * rect.width,
      y: ((-vector.y + 1) / 2) * rect.height
    };
  }

  updateInfo() {
    const payload = this.scenePayload || {};
    const canvas = this.renderer.domElement;
    const objects = Array.isArray(payload.objects) ? payload.objects : [];
    this.info = {
      renderer: 'three.js',
      stateHash: String(payload.stateHash || ''),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      objectCount: objects.length,
      objectIds: objects.map((object) => object.id),
      actorIds: (payload.actors || []).map((actor) => actor.actorId),
      actors: (payload.actors || []).map((actor) => ({
        ...actor,
        canvas: this.canvasPointFor(objects.find((object) => object.actorId === actor.actorId || object.id === actor.id) || {})
      })),
      actionCues: (payload.actors || []).map((actor) => ({
        actorId: actor.actorId,
        canonicalRoleId: actor.canonicalRoleId,
        sourceDomain: actor.sourceDomain,
        sourceObjectId: actor.sourceObjectId,
        actionKind: actor.actionKind || '',
        cueType: actor.actionCue?.cueType || '',
        accessory: actor.actionCue?.accessory || '',
        progress: number(actor.actionCue?.progress, actor.progress || 0)
      })),
      roles: (payload.actors || []).map((actor) => actor.canonicalRoleId),
      pickTargets: objects.map((object) => ({
        objectId: object.id,
        kind: object.kind,
        label: object.label,
        selectionKey: object.selectionKey,
        drawerKey: object.drawerKey,
        testId: object.testId,
        visualOnly: object.visualOnly === true,
        actorId: object.actorId || '',
        canonicalRoleId: object.canonicalRoleId || '',
        sourceDomain: object.sourceDomain || '',
        sourceObjectId: object.sourceObjectId || '',
        sourceStateHash: object.sourceStateHash || '',
        visualState: object.visualState || '',
        actionKind: object.actionKind || '',
        actionCue: object.actionCue || null,
        canvas: this.canvasPointFor(object)
      }))
    };
    return this.info;
  }

  animate(time = 0) {
    if (!this.running) return;
    for (const mesh of this.objectMeshes) {
      if (mesh.userData?.kind === 'actor') {
        const baseY = number(mesh.userData.baseY, mesh.position.y);
        if (this.reducedMotion) {
          mesh.position.y = baseY;
          continue;
        }
        const phase = number(mesh.userData.phase, 0);
        mesh.position.y = baseY + (Math.sin((time / 260) + phase) * 0.025);
      }
    }
    this.render();
    requestAnimationFrame(this.animate);
  }

  render() {
    this.updateInfo();
    this.renderer.render(this.scene, this.camera);
  }
}

function renderPlotScene(stageNode, viewport, scenePayload) {
  let stage = stageRenderers.get(stageNode);
  if (!stage) {
    stage = new FoundersPlotThreeStage(stageNode);
    stageRenderers.set(stageNode, stage);
  }
  stage.attach(viewport);
  stage.sync(scenePayload || {});
  return stage.info;
}

function getPlotSceneInfo(stageNode) {
  const stage = stageRenderers.get(stageNode);
  return stage ? stage.updateInfo() : null;
}

window.FoundersPlotThreeRenderer = {
  renderPlotScene,
  getPlotSceneInfo
};
