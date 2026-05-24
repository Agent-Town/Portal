import * as THREE from 'three';

const WORLD_WIDTH = 16;
const WORLD_HEIGHT = 9;
const stageRenderers = new WeakMap();
const textureCache = new Map();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function worldX(x) {
  return (number(x, 0.5) - 0.5) * WORLD_WIDTH;
}

function worldY(y) {
  return (0.5 - number(y, 0.5)) * WORLD_HEIGHT;
}

function worldWidth(width) {
  return Math.max(0.1, number(width, 0) * WORLD_WIDTH);
}

function worldHeight(height) {
  return Math.max(0.1, number(height, 0) * WORLD_HEIGHT);
}

function createLabelTexture(label = '?', fill = '#d9b77a', ink = '#3b2415') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(30, 48, 196, 150, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 36, 21, 0.35)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = '700 72px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(label || '?').slice(0, 2).toUpperCase(), 128, 124);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createTextTexture(text = '', options = {}) {
  const normalized = String(text || '').trim();
  const fill = String(options.fill || '#fff4d8');
  const ink = String(options.ink || '#3b2415');
  const stroke = String(options.stroke || 'rgba(59, 36, 21, 0.22)');
  const maxWidth = number(options.width, 360);
  const height = number(options.height, 96);
  const fontSize = number(options.fontSize, 34);
  const cacheKey = `text:${maxWidth}:${height}:${fontSize}:${fill}:${ink}:${stroke}:${normalized}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(8, 10, canvas.width - 16, canvas.height - 20, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const clipped = normalized.length > number(options.maxChars, 18)
    ? `${normalized.slice(0, number(options.maxChars, 18) - 1)}…`
    : normalized;
  ctx.fillText(clipped || '?', canvas.width / 2, canvas.height / 2 + 1, canvas.width - 42);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}

function fallbackTextureFor(object = {}) {
  const key = `fallback:${object.worldObjectId || object.kind || object.id || 'object'}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const label = object.worldObjectId === 'lot'
    ? '+'
    : object.worldObjectId === 'clover'
      ? 'C'
      : String(object.label || object.id || '?').slice(0, 2);
  const texture = createLabelTexture(label);
  textureCache.set(key, texture);
  return texture;
}

function loadTexture(src, onLoad) {
  const key = String(src || '').trim();
  if (!key) return null;
  if (textureCache.has(key)) return textureCache.get(key);
  const loader = new THREE.TextureLoader();
  const texture = loader.load(key, () => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    if (typeof onLoad === 'function') onLoad();
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

function resolveAsset(assetMap, assetId) {
  if (!assetMap || typeof assetMap !== 'object') return null;
  return assetMap[String(assetId || '')] || null;
}

function spriteHeightFor(object = {}) {
  const id = String(object.id || '');
  const kind = String(object.kind || '');
  const worldObject = String(object.worldObjectId || '');
  if (worldObject === 'clover') return 1.55;
  if (worldObject === 'hq' || id === 'HQ') return 2.2 * number(object.scale, 1);
  if (kind === 'lot') return 1.08;
  if (kind === 'object') return 1.18;
  return 1.55 * number(object.scale, 1);
}

function objectDepth(object = {}, extra = 0) {
  const y = number(object.y, 0.5);
  const z = number(object.z, 10);
  return 0.1 + (1 - y) * 0.4 + (z * 0.01) + extra;
}

function configureTextureSprite(sprite, texture, object = {}) {
  const image = texture?.image || null;
  const aspect = image && image.width && image.height ? image.width / image.height : 1;
  const height = spriteHeightFor(object);
  sprite.scale.set(height * clamp(aspect, 0.55, 1.8), height, 1);
  sprite.userData.baseScale = sprite.scale.clone();
}

function makeSprite({ texture, object, materialOptions = {} }) {
  const { extraDepth = 0, ...spriteMaterialOptions } = materialOptions;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.04,
    ...spriteMaterialOptions
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(worldX(object.x), worldY(object.y), objectDepth(object, extraDepth));
  configureTextureSprite(sprite, texture, object);
  sprite.userData = {
    ...sprite.userData,
    objectId: String(object.id || ''),
    selectionKey: String(object.selectionKey || ''),
    drawerKey: String(object.drawerKey || ''),
    testId: String(object.testId || ''),
    worldObjectId: String(object.worldObjectId || ''),
    gridCellId: String(object.gridCellId || ''),
    gridCol: object.gridCol,
    gridRow: object.gridRow,
    state: String(object.state || ''),
    baseY: sprite.position.y,
    phase: Math.random() * Math.PI * 2
  };
  return sprite;
}

function makeTextSprite(text, {
  fill = '#fff4d8',
  ink = '#3b2415',
  stroke = 'rgba(59, 36, 21, 0.22)',
  width = 360,
  height = 96,
  fontSize = 34,
  maxChars = 18,
  scaleX = 1.72,
  scaleY = 0.46,
  position = new THREE.Vector3(),
  userData = {}
} = {}) {
  const texture = createTextTexture(text, { fill, ink, stroke, width, height, fontSize, maxChars });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.03
  }));
  sprite.position.copy(position);
  sprite.scale.set(scaleX, scaleY, 1);
  sprite.userData = {
    ...userData,
    textSprite: true
  };
  return sprite;
}

function makeHitTarget(object = {}, sprite) {
  const height = Math.max(1.15, spriteHeightFor(object) * 1.15);
  const width = Math.max(1.15, height * 0.92);
  const target = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.001,
      depthWrite: false
    })
  );
  target.position.copy(sprite.position);
  target.position.z += 0.08;
  target.userData = {
    objectId: String(object.id || ''),
    selectionKey: String(object.selectionKey || ''),
    drawerKey: String(object.drawerKey || ''),
    testId: String(object.testId || ''),
    worldObjectId: String(object.worldObjectId || ''),
    gridCellId: String(object.gridCellId || ''),
    gridCol: object.gridCol,
    gridRow: object.gridRow,
    state: String(object.state || ''),
    hitTarget: true
  };
  return target;
}

function makeCoverageHitTarget(anchor = {}, sprite) {
  const width = Math.max(0.8, number(sprite?.scale?.x, 1) * 1.08);
  const height = Math.max(0.32, number(sprite?.scale?.y, 0.35) * 1.34);
  const target = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.001,
      depthWrite: false
    })
  );
  target.position.copy(sprite.position);
  target.position.z += 0.08;
  target.userData = {
    objectId: String(anchor.id || ''),
    targetObjectId: String(anchor.objectId || ''),
    selectionKey: String(anchor.selectionKey || ''),
    drawerKey: String(anchor.drawerKey || ''),
    worldObjectId: 'state_anchor',
    stateAnchorId: String(anchor.id || ''),
    coverageDomainId: String(anchor.domainId || ''),
    coverageTier: String(anchor.tier || ''),
    coverageLabel: String(anchor.label || ''),
    hitTarget: true
  };
  return target;
}

function badgeToneStyle(badge = {}) {
  switch (String(badge.tone || '').trim()) {
    case 'good':
      return { fill: '#e6f3ca', ink: '#254526', stroke: 'rgba(37, 69, 38, 0.28)' };
    case 'warn':
      return { fill: '#ffe0b8', ink: '#65330d', stroke: 'rgba(101, 51, 13, 0.3)' };
    default:
      return { fill: '#f2dfb7', ink: '#3b2415', stroke: 'rgba(59, 36, 21, 0.24)' };
  }
}

function badgeDisplayText(badge = {}) {
  if (badge.iconOnly) {
    if (String(badge.type || '') === 'build') return '+';
    if (String(badge.type || '') === 'approval') return '!';
  }
  return String(badge.displayLabel || badge.label || badge.type || '').trim();
}

function makeBadgeSprite(badge = {}, sprite, index = 0, textProfile = {}) {
  const tone = badgeToneStyle(badge);
  const label = badgeDisplayText(badge);
  const badgeScale = number(textProfile.badgeScale, 1);
  const position = new THREE.Vector3(
    sprite.position.x + sprite.scale.x * 0.34,
    sprite.position.y + sprite.scale.y * (0.16 + index * 0.22),
    sprite.position.z + 0.24 + index * 0.01
  );
  return makeTextSprite(label, {
    ...tone,
    width: badge.iconOnly ? 112 : 290,
    height: 82,
    fontSize: Math.round((badge.iconOnly ? 40 : 28) * badgeScale),
    maxChars: badge.iconOnly ? 2 : 14,
    scaleX: (badge.iconOnly ? 0.45 : 1.24) * badgeScale,
    scaleY: 0.34 * badgeScale,
    position,
    userData: {
      objectId: String(sprite.userData?.objectId || ''),
      badgeType: String(badge.type || ''),
      badgeLabel: String(badge.label || ''),
      badgeSprite: true,
      layer: 'three-badge'
    }
  });
}

function makeTimerMeshes(timer = {}, sprite) {
  const progress = clamp(number(timer.progress, 0), 0, 1);
  const radius = Math.max(0.32, Math.min(0.5, sprite.scale.y * 0.26));
  const center = new THREE.Vector3(
    sprite.position.x - sprite.scale.x * 0.32,
    sprite.position.y + sprite.scale.y * 0.12,
    sprite.position.z + 0.25
  );
  const base = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.78, radius * 0.96, 48),
    new THREE.MeshBasicMaterial({
      color: 0x3b2415,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  base.position.copy(center);
  base.userData = {
    objectId: String(sprite.userData?.objectId || ''),
    timerSprite: true,
    timerProgress: progress,
    layer: 'three-timer'
  };

  const arc = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.78, radius * 0.96, 48, 1, Math.PI / 2, -Math.max(0.001, progress * Math.PI * 2)),
    new THREE.MeshBasicMaterial({
      color: 0x5f8d8e,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  arc.position.copy(center);
  arc.position.z += 0.01;
  arc.userData = {
    objectId: String(sprite.userData?.objectId || ''),
    timerSprite: true,
    timerProgress: progress,
    layer: 'three-timer-progress'
  };

  return [base, arc];
}

function cellColor(cell = {}) {
  if (cell.selected) return 0x5f8d8e;
  if (cell.validPlacement) return 0x7f9b66;
  if (cell.locked) return 0x9d7558;
  if (cell.occupied) return 0xc4883a;
  return 0x634832;
}

function cellOpacity(cell = {}) {
  if (cell.selected) return 0.34;
  if (cell.validPlacement) return 0.2;
  if (cell.locked) return 0.12;
  if (cell.occupied) return 0.14;
  return 0.055;
}

function makeGridCell(cell = {}) {
  const width = worldWidth(cell.width);
  const height = worldHeight(cell.height);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.92, height * 0.88),
    new THREE.MeshBasicMaterial({
      color: cellColor(cell),
      transparent: true,
      opacity: cellOpacity(cell),
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  mesh.position.set(worldX(cell.x), worldY(cell.y), -2.74);
  mesh.userData = {
    objectId: String(cell.primaryObjectId || cell.id || ''),
    selectionKey: String(cell.selectionKey || ''),
    drawerKey: String(cell.drawerKey || ''),
    worldObjectId: 'grid_cell',
    gridCellId: String(cell.id || ''),
    gridCol: Number(cell.col),
    gridRow: Number(cell.row),
    buildable: cell.buildable === true,
    validPlacement: cell.validPlacement === true,
    occupied: cell.occupied === true,
    locked: cell.locked === true,
    cellWidth: width,
    cellHeight: height,
    primaryLabel: String(cell.primaryLabel || ''),
    hitTarget: true,
    gridCell: true
  };
  return mesh;
}

function makeGridLines(grid = {}) {
  const cols = Math.max(1, number(grid.cols, 8));
  const rows = Math.max(1, number(grid.rows, 5));
  const points = [];
  for (let col = 0; col <= cols; col += 1) {
    const x = worldX(col / cols);
    points.push(x, worldY(0), -2.68, x, worldY(1), -2.68);
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = worldY(row / rows);
    points.push(worldX(0), y, -2.68, worldX(1), y, -2.68);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0x5f4b36,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    })
  );
}

function detailFromObject(object, source = 'three-raycast') {
  const data = object?.userData || {};
  return {
    objectId: String(data.objectId || ''),
    targetObjectId: String(data.targetObjectId || ''),
    selectionKey: String(data.selectionKey || ''),
    drawerKey: String(data.drawerKey || ''),
    worldObjectId: String(data.worldObjectId || ''),
    testId: String(data.testId || ''),
    gridCellId: String(data.gridCellId || ''),
    gridCol: Number.isFinite(Number(data.gridCol)) ? Number(data.gridCol) : null,
    gridRow: Number.isFinite(Number(data.gridRow)) ? Number(data.gridRow) : null,
    buildable: data.buildable === true,
    validPlacement: data.validPlacement === true,
    occupied: data.occupied === true,
    locked: data.locked === true,
    stateAnchorId: String(data.stateAnchorId || ''),
    coverageDomainId: String(data.coverageDomainId || ''),
    coverageTier: String(data.coverageTier || ''),
    source,
    atMs: Date.now()
  };
}

function disposeSceneObject(object) {
  object.traverse((child) => {
    if (child.material) {
      child.material.dispose();
    }
    if (child.geometry) {
      child.geometry.dispose();
    }
  });
}

class FoundersPlotThreeStage {
  constructor(stageNode) {
    this.stageNode = stageNode;
    this.viewport = null;
    this.assetMap = {};
    this.scenePayload = null;
    this.pickables = [];
    this.gridGroup = new THREE.Group();
    this.objectsGroup = new THREE.Group();
    this.hoverGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.coverageGroup = new THREE.Group();
    this.ownerDocument = stageNode.ownerDocument || document;
    this.startTime = this.now();
    this.lastPick = null;
    this.hoverPick = null;
    this.parityInfo = {
      labels: [],
      badges: [],
      timers: [],
      highlights: [],
      cloverBubbles: [],
      targetLinks: []
    };
    this.renderCount = 0;
    this.running = true;

    this.scene = new THREE.Scene();
    this.scene.add(this.gridGroup);
    this.scene.add(this.objectsGroup);
    this.scene.add(this.hoverGroup);
    this.scene.add(this.fxGroup);
    this.scene.add(this.coverageGroup);

    this.camera = new THREE.OrthographicCamera(
      WORLD_WIDTH / -2,
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_HEIGHT / -2,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 12);
    this.camera.lookAt(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setClearColor(0xf3d8a6, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.className = 'at-fp-threeCanvas';
    this.renderer.domElement.dataset.testid = 'founders-three-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.handleScenePointer = this.handleScenePointer.bind(this);
    this.handleSceneHover = this.handleSceneHover.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);

    this.stageNode.addEventListener('click', this.handleScenePointer, true);
    this.stageNode.addEventListener('pointermove', this.handleSceneHover, true);
    this.stageNode.addEventListener('pointerleave', this.handleSceneHover, true);
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.stageNode);
    requestAnimationFrame(this.animate);
  }

  attach(viewport) {
    if (!(viewport instanceof HTMLElement)) return;
    this.viewport = viewport;
    if (this.renderer.domElement.parentElement !== viewport) {
      viewport.appendChild(this.renderer.domElement);
    }
    this.handleResize();
  }

  isFullscreenMode() {
    return this.ownerDocument?.documentElement?.classList?.contains('founders-plot-fullscreen') === true;
  }

  textProfile() {
    const rect = (this.viewport || this.stageNode).getBoundingClientRect();
    const width = Math.max(1, Number(rect.width || 0));
    const height = Math.max(1, Number(rect.height || 0));
    const fullscreen = this.isFullscreenMode();
    const roomy = width >= 900 && height >= 520;
    const compact = width <= 560 || height <= 420;
    const baseScale = fullscreen
      ? compact ? 1.25 : roomy ? 1.55 : 1.4
      : 1;
    return {
      fullscreen,
      width,
      height,
      labelScale: baseScale,
      badgeScale: fullscreen ? Math.max(1.18, baseScale * 0.95) : 1,
      anchorScale: fullscreen ? Math.max(1.28, baseScale * 1.05) : 1,
      detailScale: fullscreen ? Math.max(1.3, baseScale) : 1,
      hudCollapsed: fullscreen
    };
  }

  dispose() {
    this.running = false;
    this.stageNode.removeEventListener('click', this.handleScenePointer, true);
    this.stageNode.removeEventListener('pointermove', this.handleSceneHover, true);
    this.stageNode.removeEventListener('pointerleave', this.handleSceneHover, true);
    this.resizeObserver?.disconnect?.();
    this.gridGroup.children.slice().forEach((child) => {
      this.gridGroup.remove(child);
      disposeSceneObject(child);
    });
    this.objectsGroup.children.slice().forEach((child) => {
      this.objectsGroup.remove(child);
      disposeSceneObject(child);
    });
    this.hoverGroup.children.slice().forEach((child) => {
      this.hoverGroup.remove(child);
      disposeSceneObject(child);
    });
    this.fxGroup.children.slice().forEach((child) => {
      this.fxGroup.remove(child);
      disposeSceneObject(child);
    });
    this.coverageGroup.children.slice().forEach((child) => {
      this.coverageGroup.remove(child);
      disposeSceneObject(child);
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  handleResize() {
    const rect = (this.viewport || this.stageNode).getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const targetAspect = WORLD_WIDTH / WORLD_HEIGHT;
    if (this.isFullscreenMode()) {
      if (aspect >= targetAspect) {
        const visibleHeight = clamp(WORLD_WIDTH / aspect, 7.2, WORLD_HEIGHT);
        const visibleWidth = visibleHeight * aspect;
        this.camera.left = visibleWidth / -2;
        this.camera.right = visibleWidth / 2;
        this.camera.top = visibleHeight / 2;
        this.camera.bottom = visibleHeight / -2;
      } else {
        const visibleWidth = clamp(WORLD_HEIGHT * aspect, 10.5, WORLD_WIDTH);
        const visibleHeight = visibleWidth / aspect;
        this.camera.left = visibleWidth / -2;
        this.camera.right = visibleWidth / 2;
        this.camera.top = visibleHeight / 2;
        this.camera.bottom = visibleHeight / -2;
      }
    } else if (aspect >= targetAspect) {
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

  sync(scenePayload, options = {}) {
    this.scenePayload = scenePayload || null;
    this.assetMap = options.assetMap || {};
    this.rebuildScene();
    this.render();
  }

  rebuildScene() {
    this.gridGroup.children.slice().forEach((child) => {
      this.gridGroup.remove(child);
      disposeSceneObject(child);
    });
    this.objectsGroup.children.slice().forEach((child) => {
      this.objectsGroup.remove(child);
      disposeSceneObject(child);
    });
    this.hoverGroup.children.slice().forEach((child) => {
      this.hoverGroup.remove(child);
      disposeSceneObject(child);
    });
    this.coverageGroup.children.slice().forEach((child) => {
      this.coverageGroup.remove(child);
      disposeSceneObject(child);
    });
    this.hoverPick = null;
    this.parityInfo = {
      labels: [],
      badges: [],
      timers: [],
      highlights: [],
      cloverBubbles: [],
      targetLinks: []
    };
    this.coverageInfo = {
      domainIds: [],
      hud: [],
      anchors: [],
      selectedDetail: null
    };
    this.pickables = [];

    const scenePayload = this.scenePayload || {};
    const textProfile = this.textProfile();
    const backgroundSrc = scenePayload.stageBackgrounds?.desktop || scenePayload.stageBackgrounds?.mobile || '';
    const backgroundTexture = loadTexture(backgroundSrc, () => this.render()) || createLabelTexture('FP', '#efd197');
    const bgMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT), bgMaterial);
    bg.position.set(0, 0, -4);
    bg.userData.layer = 'scene-base';
    this.objectsGroup.add(bg);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(7.4, 96),
      new THREE.MeshBasicMaterial({
        color: 0x7f9b66,
        transparent: true,
        opacity: 0.18,
        depthWrite: false
      })
    );
    ground.scale.set(1.14, 0.42, 1);
    ground.position.set(0.4, -2.1, -3.5);
    this.objectsGroup.add(ground);

    const grid = scenePayload.grid || {};
    if (Array.isArray(grid.cells) && grid.cells.length > 0) {
      this.gridGroup.add(makeGridLines(grid));
      grid.cells.forEach((cell) => {
        const tile = makeGridCell(cell);
        this.gridGroup.add(tile);
        this.pickables.push(tile);
      });
    }

    const objects = Array.isArray(scenePayload.objects) ? scenePayload.objects : [];
    const objectSpritesById = new Map();
    objects.forEach((object) => {
      const asset = resolveAsset(this.assetMap, object.assetId);
      const texture = asset?.src
        ? loadTexture(asset.src, () => {
          configureTextureSprite(sprite, texture, object);
          this.render();
        })
        : fallbackTextureFor(object);
      const materialOptions = {};
      if (object.goalTarget) materialOptions.color = 0xfff2c2;
      if (String(object.state || '') === 'LOCKED') materialOptions.opacity = 0.74;
      const sprite = makeSprite({ texture: texture || fallbackTextureFor(object), object, materialOptions });
      this.objectsGroup.add(sprite);
      objectSpritesById.set(String(object.id || ''), sprite);
      this.pickables.push(sprite);
      const hitTarget = makeHitTarget(object, sprite);
      this.objectsGroup.add(hitTarget);
      this.pickables.push(hitTarget);

      const actionLinked = String(scenePayload?.clover?.state || '').toUpperCase() === 'ACTING'
        && String(scenePayload?.clover?.targetObjectId || '') === String(object.id || '');
      if (object.goalTarget || object.selected || object.cloverTarget || actionLinked || String(object.attention || '') === 'recommended') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.62, 0.76, 48),
          new THREE.MeshBasicMaterial({
            color: actionLinked ? 0x7fbf8f : object.goalTarget ? 0xc4883a : object.cloverTarget ? 0x6ca6a8 : 0x5f8d8e,
            transparent: true,
            opacity: actionLinked ? 0.76 : object.goalTarget ? 0.72 : 0.46,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        ring.position.set(sprite.position.x, sprite.position.y - 0.44, sprite.position.z - 0.02);
        ring.scale.set(1.4, 0.42, 1);
        ring.userData.baseScale = ring.scale.clone();
        ring.userData.pulse = true;
        ring.userData.highlightSprite = true;
        ring.userData.objectId = String(object.id || '');
        ring.userData.highlightRole = actionLinked ? 'action-linked' : object.goalTarget ? 'goal' : object.selected ? 'selected' : object.cloverTarget ? 'clover-target' : 'attention';
        this.objectsGroup.add(ring);
        this.parityInfo.highlights.push({
          objectId: String(object.id || ''),
          role: ring.userData.highlightRole
        });
      }

      if (object.labelVisible === true || object.selected || object.goalTarget || object.cloverTarget || actionLinked) {
        const labelText = String(object.label || object.id || '');
        const labelScale = textProfile.labelScale;
        const label = makeTextSprite(object.label || object.id, {
          fill: object.goalTarget ? '#fff0c8' : object.selected ? '#dff1ef' : '#fff4d8',
          ink: '#3b2415',
          width: textProfile.fullscreen ? 390 : 350,
          height: textProfile.fullscreen ? 96 : 86,
          fontSize: Math.round(28 * labelScale),
          maxChars: textProfile.fullscreen ? 20 : 18,
          scaleX: Math.max(1.18, Math.min(1.78, labelText.length * 0.11)) * labelScale,
          scaleY: 0.34 * labelScale,
          position: new THREE.Vector3(sprite.position.x, sprite.position.y + sprite.scale.y * 0.58, sprite.position.z + 0.32),
          userData: {
            objectId: String(object.id || ''),
            labelSprite: true,
            labelRole: String(object.labelRole || object.overlayRole || ''),
            layer: 'three-label'
          }
        });
        this.objectsGroup.add(label);
        this.parityInfo.labels.push({
          objectId: String(object.id || ''),
          text: String(object.label || object.id || ''),
          role: String(object.labelRole || object.overlayRole || '')
        });
      }

      const badges = Array.isArray(object.badges) ? object.badges : [];
      badges.forEach((badge, index) => {
        const badgeSprite = makeBadgeSprite(badge, sprite, index, textProfile);
        this.objectsGroup.add(badgeSprite);
        this.parityInfo.badges.push({
          objectId: String(object.id || ''),
          type: String(badge.type || ''),
          label: String(badge.displayLabel || badge.label || badge.type || '')
        });
      });

      if (object.timer) {
        makeTimerMeshes(object.timer, sprite).forEach((mesh) => this.objectsGroup.add(mesh));
        this.parityInfo.timers.push({
          objectId: String(object.id || ''),
          progress: clamp(number(object.timer.progress, 0), 0, 1)
        });
      }
    });

    const clover = scenePayload.clover || {};
    if (clover && typeof clover === 'object') {
      const cloverObject = {
        ...clover,
        id: 'CLOVER',
        label: 'Clover',
        worldObjectId: 'clover',
        kind: 'character',
        drawerKey: 'foreman',
        x: number(clover.x, 0.76),
        y: number(clover.y, 0.64),
        z: 88
      };
      const cloverAsset = resolveAsset(this.assetMap, clover.assetId);
      const cloverTexture = cloverAsset?.src
        ? loadTexture(cloverAsset.src, () => this.render())
        : fallbackTextureFor(cloverObject);
      const sprite = makeSprite({
        texture: cloverTexture || fallbackTextureFor(cloverObject),
        object: cloverObject,
        materialOptions: { extraDepth: 2 }
      });
      sprite.userData.state = String(clover.state || 'NOT_STARTED');
      sprite.userData.gridCellId = String(clover.gridCellId || '');
      sprite.userData.gridCol = clover.gridCol;
      sprite.userData.gridRow = clover.gridRow;
      this.objectsGroup.add(sprite);
      this.pickables.push(sprite);
      const hitTarget = makeHitTarget(cloverObject, sprite);
      this.objectsGroup.add(hitTarget);
      this.pickables.push(hitTarget);

      if (String(clover.bubbleText || '').trim()) {
        const bubbleScale = textProfile.labelScale;
        const bubble = makeTextSprite(clover.bubbleText, {
          fill: '#f8ead0',
          ink: '#3b2415',
          width: textProfile.fullscreen ? 480 : 430,
          height: textProfile.fullscreen ? 104 : 92,
          fontSize: Math.round(27 * bubbleScale),
          maxChars: textProfile.fullscreen ? 32 : 28,
          scaleX: 1.86 * bubbleScale,
          scaleY: 0.38 * bubbleScale,
          position: new THREE.Vector3(sprite.position.x + 0.52, sprite.position.y + sprite.scale.y * 0.78, sprite.position.z + 0.36),
          userData: {
            objectId: 'CLOVER',
            cloverBubbleSprite: true,
            layer: 'three-clover-bubble'
          }
        });
        this.objectsGroup.add(bubble);
        this.parityInfo.cloverBubbles.push({
          objectId: 'CLOVER',
          text: String(clover.bubbleText || '')
        });
      }

      const targetSprite = objectSpritesById.get(String(clover.targetObjectId || ''));
      if (targetSprite && String(clover.targetObjectId || '') !== 'CLOVER') {
        const points = [
          sprite.position.x,
          sprite.position.y - sprite.scale.y * 0.2,
          sprite.position.z - 0.08,
          targetSprite.position.x,
          targetSprite.position.y - targetSprite.scale.y * 0.36,
          targetSprite.position.z - 0.08
        ];
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const line = new THREE.LineSegments(
          geometry,
          new THREE.LineBasicMaterial({
            color: 0x5f8d8e,
            transparent: true,
            opacity: 0.34,
            depthWrite: false
          })
        );
        line.userData = {
          objectId: 'CLOVER',
          targetObjectId: String(clover.targetObjectId || ''),
          targetLinkSprite: true,
          layer: 'three-target-link'
        };
        this.objectsGroup.add(line);
        this.parityInfo.targetLinks.push({
          objectId: 'CLOVER',
          targetObjectId: String(clover.targetObjectId || '')
        });
      }
    }
    this.addCoverageLayer(scenePayload, objectSpritesById);
  }

  addCoverageLayer(scenePayload = {}, objectSpritesById = new Map()) {
    const coverage = scenePayload.stateCoverage || {};
    const domains = Array.isArray(coverage.domains) ? coverage.domains : [];
    const hud = Array.isArray(coverage.hud) ? coverage.hud : [];
    const anchors = Array.isArray(coverage.anchors) ? coverage.anchors : [];
    this.coverageInfo.domainIds = domains.map((domain) => String(domain.id || '')).filter(Boolean);
    this.coverageInfo.hud = [];
    this.coverageInfo.anchors = [];
    this.coverageInfo.selectedDetail = coverage.selectedDetail || null;

    const left = number(this.camera.left, WORLD_WIDTH / -2);
    const top = number(this.camera.top, WORLD_HEIGHT / 2);
    const bottom = number(this.camera.bottom, WORLD_HEIGHT / -2);
    const textProfile = this.textProfile();
    const hudRows = hud.slice(0, 3);
    hudRows.forEach((entry, index) => {
      const label = String(entry.label || entry.id || '').trim();
      const value = String(entry.value || '').trim();
      const text = value ? `${label}: ${value}` : label;
      if (textProfile.hudCollapsed) {
        this.coverageInfo.hud.push({
          id: String(entry.id || ''),
          domainId: String(entry.domainId || ''),
          label,
          text,
          canvas: null,
          collapsed: true
        });
        return;
      }
      const sprite = makeTextSprite(text, {
        fill: index === 2 ? '#fff0c8' : '#f9ead0',
        ink: '#3b2415',
        stroke: 'rgba(59, 36, 21, 0.22)',
        width: 620,
        height: 74,
        fontSize: 23,
        maxChars: index === 0 ? 58 : 46,
        scaleX: 3.3,
        scaleY: 0.28,
        position: new THREE.Vector3(left + 1.95, top - 0.36 - index * 0.36, 8.2),
        userData: {
          objectId: String(entry.id || ''),
          coverageDomainId: String(entry.domainId || ''),
          coverageTier: String(entry.tier || ''),
          coverageHudSprite: true,
          layer: 'three-state-hud'
        }
      });
      this.coverageGroup.add(sprite);
      this.coverageInfo.hud.push({
        id: String(entry.id || ''),
        domainId: String(entry.domainId || ''),
        label,
        text,
        canvas: this.canvasPointFor(sprite)
      });
    });

    const anchorText = (anchor = {}) => {
      const label = String(anchor.label || anchor.id || '').trim();
      const status = String(anchor.status || '').replace(/_/g, ' ').toLowerCase();
      const count = number(anchor.count);
      if (anchor.id === 'STATE:scheduler') return status === 'enabled' ? 'Auto on' : 'Auto off';
      if (anchor.id === 'STATE:standing-order') return String(anchor.value || 'Careful');
      if (anchor.id === 'STATE:policy') return 'Policy';
      if (count > 0 && !['RAISED', 'OPEN', 'ACTIVE', 'AVAILABLE'].includes(String(anchor.status || ''))) return `${label} ${count}`;
      if (count > 0 && anchor.id === 'STATE:unlocks') return `${label} ${count}`;
      return label;
    };
    const anchorStyle = (anchor = {}) => {
      const status = String(anchor.status || '').toUpperCase();
      if (['WAITING', 'PAUSED', 'LOCKED', 'BLOCKED'].includes(status)) {
        return { fill: '#ffe0b8', ink: '#65330d', stroke: 'rgba(101, 51, 13, 0.28)' };
      }
      if (['READY', 'RAISED', 'AVAILABLE', 'ENABLED'].includes(status)) {
        return { fill: '#e6f3ca', ink: '#254526', stroke: 'rgba(37, 69, 38, 0.26)' };
      }
      return { fill: '#f2dfb7', ink: '#3b2415', stroke: 'rgba(59, 36, 21, 0.22)' };
    };
    const stackByObject = new Map();
    anchors.forEach((anchor, index) => {
      const targetId = String(anchor.objectId || '');
      const targetSprite = objectSpritesById.get(targetId) || null;
      const stackIndex = stackByObject.get(targetId) || 0;
      stackByObject.set(targetId, stackIndex + 1);
      const fallbackX = number(this.camera.right, WORLD_WIDTH / 2) - 1.2;
      const fallbackY = top - 1.0 - index * 0.36;
      const position = targetSprite
        ? new THREE.Vector3(
          targetSprite.position.x - targetSprite.scale.x * 0.12 + Math.min(stackIndex, 1) * 0.58,
          targetSprite.position.y - targetSprite.scale.y * (0.46 + Math.floor(stackIndex / 2) * 0.18),
          targetSprite.position.z + 0.54 + index * 0.002
        )
        : new THREE.Vector3(fallbackX, fallbackY, 8.1);
      const style = anchorStyle(anchor);
      const text = anchorText(anchor);
      const anchorScale = textProfile.anchorScale;
      const sprite = makeTextSprite(text, {
        ...style,
        width: textProfile.fullscreen ? 300 : 260,
        height: textProfile.fullscreen ? 84 : 74,
        fontSize: Math.round(25 * anchorScale),
        maxChars: textProfile.fullscreen ? 15 : 13,
        scaleX: Math.max(0.74, Math.min(1.32, text.length * 0.095)) * anchorScale,
        scaleY: 0.3 * anchorScale,
        position,
        userData: {
          objectId: String(anchor.id || ''),
          targetObjectId: targetId,
          stateAnchorId: String(anchor.id || ''),
          coverageDomainId: String(anchor.domainId || ''),
          coverageTier: String(anchor.tier || ''),
          coverageAnchorSprite: true,
          drawerKey: String(anchor.drawerKey || ''),
          selectionKey: String(anchor.selectionKey || ''),
          worldObjectId: 'state_anchor',
          layer: 'three-state-anchor'
        }
      });
      this.coverageGroup.add(sprite);
      const hitTarget = makeCoverageHitTarget(anchor, sprite);
      this.coverageGroup.add(hitTarget);
      this.pickables.push(hitTarget);
      this.coverageInfo.anchors.push({
        id: String(anchor.id || ''),
        domainId: String(anchor.domainId || ''),
        targetObjectId: targetId,
        drawerKey: String(anchor.drawerKey || ''),
        selectionKey: String(anchor.selectionKey || ''),
        label: String(anchor.label || ''),
        status: String(anchor.status || ''),
        count: number(anchor.count),
        text,
        canvas: this.canvasPointFor(sprite)
      });
    });

    const detail = coverage.selectedDetail || null;
    const detailRows = Array.isArray(detail?.rows) ? detail.rows : [];
    if (detail && String(detail.mode || '') !== 'none' && detailRows.length > 0) {
      const text = [
        String(detail.title || 'Object detail'),
        ...detailRows.slice(0, 3).map((row) => `${String(row.label || '').trim()}: ${String(row.value || '').trim()}`)
      ].filter(Boolean).join(' | ');
      const detailScale = textProfile.detailScale;
      const sprite = makeTextSprite(text, {
        fill: '#dff1ef',
        ink: '#183b3c',
        stroke: 'rgba(24, 59, 60, 0.22)',
        width: textProfile.fullscreen ? 720 : 650,
        height: textProfile.fullscreen ? 92 : 82,
        fontSize: Math.round(23 * detailScale),
        maxChars: textProfile.fullscreen ? 68 : 62,
        scaleX: 3.36 * detailScale,
        scaleY: 0.32 * detailScale,
        position: new THREE.Vector3(left + 2.05, bottom + 0.48, 8.15),
        userData: {
          objectId: String(detail.id || ''),
          targetObjectId: String(detail.objectId || ''),
          coverageDomainId: 'selected-object',
          coverageTier: 'selected-object-detail',
          coverageDetailSprite: true,
          layer: 'three-state-detail'
        }
      });
      this.coverageGroup.add(sprite);
      this.coverageInfo.selectedDetail = {
        ...detail,
        text,
        canvas: this.canvasPointFor(sprite)
      };
    }
  }

  pickFromClientPoint(clientX, clientY) {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return null;
    this.pointer.x = (localX / rect.width) * 2 - 1;
    this.pointer.y = -((localY / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    const hit = hits.find((entry) => entry?.object?.userData?.objectId);
    if (!hit) return null;
    return detailFromObject(hit.object, 'three-raycast');
  }

  pickFromDomTarget(target) {
    const element = target instanceof Element ? target : null;
    const objectNode = element?.closest?.('[data-scene-object-id]');
    if (!objectNode || !this.stageNode.contains(objectNode)) return null;
    return {
      objectId: String(objectNode.getAttribute('data-scene-object-id') || ''),
      selectionKey: String(objectNode.getAttribute('data-selection-key') || ''),
      drawerKey: String(objectNode.getAttribute('data-drawer-key') || ''),
      worldObjectId: String(objectNode.getAttribute('data-world-object') || ''),
      testId: String(objectNode.getAttribute('data-testid') || ''),
      source: 'scene-dom-hook',
      atMs: Date.now()
    };
  }

  handleScenePointer(event) {
    const targetElement = event.target instanceof Element ? event.target : null;
    if (targetElement?.closest?.('[data-scene-action-id], .at-fp-sceneActions')) return;
    if (event.target !== this.renderer.domElement && !this.stageNode.contains(event.target)) return;
    const pick = this.pickFromClientPoint(event.clientX, event.clientY) || this.pickFromDomTarget(event.target);
    if (!pick) return;
    pick.eventType = String(event.type || '');
    pick.activation = true;
    this.lastPick = pick;
    this.stageNode.dataset.threeLastPick = pick.objectId;
    this.stageNode.dispatchEvent(new CustomEvent('founders:three-pick', {
      bubbles: true,
      detail: pick
    }));
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
  }

  handleSceneHover(event) {
    if (event.type === 'pointerleave') {
      this.setHoverPick(null);
      return;
    }
    const targetElement = event.target instanceof Element ? event.target : null;
    if (targetElement?.closest?.('[data-scene-action-id], .at-fp-sceneActions')) return;
    if (event.target !== this.renderer.domElement && !this.stageNode.contains(event.target)) return;
    const pick = this.pickFromClientPoint(event.clientX, event.clientY);
    this.setHoverPick(pick);
  }

  setHoverPick(pick) {
    const nextKey = pick?.gridCellId || pick?.objectId || '';
    const currentKey = this.hoverPick?.gridCellId || this.hoverPick?.objectId || '';
    if (nextKey === currentKey) return;
    this.hoverPick = pick || null;
    this.hoverGroup.children.slice().forEach((child) => {
      this.hoverGroup.remove(child);
      disposeSceneObject(child);
    });
    if (pick?.gridCellId && Number.isFinite(Number(pick.gridCol)) && Number.isFinite(Number(pick.gridRow))) {
      const grid = this.scenePayload?.grid || {};
      const cols = Math.max(1, number(grid.cols, 8));
      const rows = Math.max(1, number(grid.rows, 5));
      const cell = {
        id: pick.gridCellId,
        col: Number(pick.gridCol),
        row: Number(pick.gridRow),
        x: (Number(pick.gridCol) + 0.5) / cols,
        y: (Number(pick.gridRow) + 0.5) / rows,
        width: 1 / cols,
        height: 1 / rows,
        selected: true,
        validPlacement: pick.validPlacement === true,
        locked: pick.locked === true,
        occupied: pick.occupied === true
      };
      const hover = makeGridCell(cell);
      hover.material.opacity = pick.validPlacement ? 0.42 : 0.28;
      hover.material.color.setHex(pick.validPlacement ? 0x8fbf72 : pick.locked ? 0xb06e58 : 0x5f8d8e);
      hover.position.z = -2.5;
      hover.userData.hover = true;
      this.hoverGroup.add(hover);
    }
    this.render();
  }

  animate() {
    if (!this.running) return;
    const elapsed = (this.now() - this.startTime) / 1000;
    this.objectsGroup.children.forEach((child) => {
      if (child.userData?.objectId === 'CLOVER') {
        child.position.y = child.userData.baseY + Math.sin(elapsed * 2.4) * 0.08;
      }
      if (child.userData?.baseY !== undefined && !child.userData?.hitTarget && !child.userData?.textSprite) {
        const state = String(child.userData?.state || '').toUpperCase();
        if (state === 'READY') {
          child.position.y = child.userData.baseY + Math.abs(Math.sin(elapsed * 3.2)) * 0.08;
        } else if (state === 'PRODUCING' || state === 'UNDER_CONSTRUCTION') {
          child.position.y = child.userData.baseY + Math.sin(elapsed * 1.8 + child.userData.phase) * 0.04;
        }
        if (child.userData?.baseScale && (state === 'BUILDABLE' || state === 'UPGRADE_READY')) {
          const amount = 1 + Math.sin(elapsed * 2.1 + child.userData.phase) * 0.035;
          child.scale.copy(child.userData.baseScale).multiplyScalar(amount);
        }
      }
      if (child.userData?.pulse && child.userData?.baseScale) {
        const amount = 1 + Math.sin(elapsed * 2.1) * 0.05;
        child.scale.copy(child.userData.baseScale).multiplyScalar(amount);
      }
    });
    this.render();
    requestAnimationFrame(this.animate);
  }

  render() {
    this.renderCount += 1;
    this.renderer.render(this.scene, this.camera);
  }

  now() {
    return this.ownerDocument.defaultView?.performance?.now?.() || Date.now();
  }

  canvasPointFor(object) {
    const canvas = this.renderer.domElement;
    const position = object?.position ? object.position.clone() : new THREE.Vector3();
    const projected = position.project(this.camera);
    return {
      x: ((projected.x + 1) / 2) * canvas.clientWidth,
      y: ((1 - projected.y) / 2) * canvas.clientHeight
    };
  }

  info() {
    const canvas = this.renderer.domElement;
    const targetMap = new Map();
    this.pickables.forEach((object) => {
      const data = object.userData || {};
      const objectId = String(data.objectId || '');
      const key = data.gridCell === true
        ? String(data.gridCellId || objectId || '')
        : String(objectId || data.gridCellId || '');
      if (!key || targetMap.has(key)) return;
      targetMap.set(key, {
        objectId,
        targetObjectId: String(data.targetObjectId || ''),
        selectionKey: String(data.selectionKey || ''),
        drawerKey: String(data.drawerKey || ''),
        worldObjectId: String(data.worldObjectId || ''),
        gridCellId: String(data.gridCellId || ''),
        gridCol: Number.isFinite(Number(data.gridCol)) ? Number(data.gridCol) : null,
        gridRow: Number.isFinite(Number(data.gridRow)) ? Number(data.gridRow) : null,
        buildable: data.buildable === true,
        validPlacement: data.validPlacement === true,
        occupied: data.occupied === true,
        locked: data.locked === true,
        stateAnchorId: String(data.stateAnchorId || ''),
        coverageDomainId: String(data.coverageDomainId || ''),
        coverageTier: String(data.coverageTier || ''),
        canvas: this.canvasPointFor(object)
      });
    });
    const grid = this.scenePayload?.grid || {};
    return {
      renderer: 'three.js',
      objectCount: this.pickables.length,
      objectIds: [...new Set(this.pickables.map((object) => String(object.userData?.objectId || '')).filter(Boolean))],
      grid: {
        version: String(grid.version || ''),
        cols: Number(grid.cols || 0),
        rows: Number(grid.rows || 0),
        cellCount: Array.isArray(grid.cells) ? grid.cells.length : 0
      },
      gridCellIds: Array.isArray(grid.cells) ? grid.cells.map((cell) => String(cell.id || '')).filter(Boolean) : [],
      pickTargets: [...targetMap.values()],
      parity: {
        labels: this.parityInfo.labels.slice(),
        badges: this.parityInfo.badges.slice(),
        timers: this.parityInfo.timers.slice(),
        highlights: this.parityInfo.highlights.slice(),
        cloverBubbles: this.parityInfo.cloverBubbles.slice(),
        targetLinks: this.parityInfo.targetLinks.slice()
      },
      coverage: {
        domainIds: this.coverageInfo.domainIds.slice(),
        hud: this.coverageInfo.hud.slice(),
        anchors: this.coverageInfo.anchors.slice(),
        selectedDetail: this.coverageInfo.selectedDetail
      },
      renderCount: this.renderCount,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      readability: {
        fullscreen: this.isFullscreenMode(),
        hudCollapsed: this.textProfile().hudCollapsed,
        textProfile: this.textProfile()
      },
      lastPick: this.lastPick,
      hoverPick: this.hoverPick,
      sceneHash: String(this.scenePayload?.sceneHash || this.stageNode?.dataset?.sceneAssetId || '')
    };
  }
}

function rendererFor(stageNode) {
  if (!(stageNode instanceof HTMLElement)) return null;
  let renderer = stageRenderers.get(stageNode);
  if (!renderer) {
    renderer = new FoundersPlotThreeStage(stageNode);
    stageRenderers.set(stageNode, renderer);
  }
  return renderer;
}

function renderPlotScene(stageNode, viewport, scenePayload, options = {}) {
  const renderer = rendererFor(stageNode);
  if (!renderer) return null;
  renderer.attach(viewport);
  renderer.sync(scenePayload, options);
  return renderer.info();
}

function getStageInfo(stageNode) {
  const renderer = stageRenderers.get(stageNode);
  return renderer ? renderer.info() : null;
}

function disposeStage(stageNode) {
  const renderer = stageRenderers.get(stageNode);
  if (!renderer) return;
  renderer.dispose();
  stageRenderers.delete(stageNode);
}

window.FoundersPlotThreeRenderer = {
  disposeStage,
  getStageInfo,
  renderPlotScene,
  version: 'founders-plot-threejs-slice-v0'
};
