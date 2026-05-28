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
      return { fill: '#c97a3d', stroke: '#5a2f16', cue: '#ffe4a0', mark: 'B', face: '#ffe5bd', accent: '#ffd34f', trim: '#7f3f1c' };
    case 'worker':
      return { fill: '#5f8d8e', stroke: '#173f41', cue: '#d6f1ef', mark: 'W', face: '#ffe0b4', accent: '#9fd3c8', trim: '#31585b' };
    case 'hauler':
      return { fill: '#d7ae50', stroke: '#654716', cue: '#fff0bd', mark: 'H', face: '#f5d29b', accent: '#8bb36d', trim: '#8a5d1f' };
    case 'messenger':
      return { fill: '#c85c75', stroke: '#5a1c2b', cue: '#ffd5de', mark: '!', face: '#ffe1be', accent: '#78a9d6', trim: '#7e2c3c' };
    default:
      return { fill: '#7f9b66', stroke: '#254526', cue: '#daf0cf', mark: 'C', face: '#ffe8c4', accent: '#a7c884', trim: '#446235' };
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

function drawCharacterEyes(ctx, x, y, mood = 'busy') {
  ctx.fillStyle = '#2e1b0e';
  ctx.beginPath();
  ctx.ellipse(x - 17, y, 5, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 17, y, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath();
  ctx.arc(x - 19, y - 3, 2, 0, Math.PI * 2);
  ctx.arc(x + 15, y - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e1b0e';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'alert') {
    ctx.moveTo(x - 26, y - 15);
    ctx.lineTo(x - 12, y - 19);
    ctx.moveTo(x + 12, y - 19);
    ctx.lineTo(x + 27, y - 14);
  } else {
    ctx.moveTo(x - 26, y - 15);
    ctx.lineTo(x - 12, y - 13);
    ctx.moveTo(x + 12, y - 13);
    ctx.lineTo(x + 27, y - 15);
  }
  ctx.stroke();
  ctx.beginPath();
  if (mood === 'happy') ctx.arc(x, y + 13, 14, 0.1, Math.PI - 0.1);
  else {
    ctx.moveTo(x - 8, y + 15);
    ctx.quadraticCurveTo(x, y + 20, x + 10, y + 14);
  }
  ctx.stroke();
}

function drawSmallHand(ctx, x, y, stroke) {
  ctx.fillStyle = '#ffe0b4';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function makeRoleTexture(role = 'worker') {
  const key = `character:${role}:v1`;
  if (textureCache.has(key)) return textureCache.get(key);
  const style = roleStyle(role);
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(46, 27, 14, 0.22)';
  ctx.beginPath();
  ctx.ellipse(112, 222, 62, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  if (role === 'hauler') {
    ctx.fillStyle = '#8bb36d';
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(132, 88, 48, 84, 19);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6d8c55';
    ctx.fillRect(141, 102, 29, 12);
  }

  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (role === 'messenger') {
    ctx.moveTo(151, 126);
    ctx.lineTo(181, 84);
  } else if (role === 'builder') {
    ctx.moveTo(151, 128);
    ctx.lineTo(180, 96);
  } else {
    ctx.moveTo(151, 130);
    ctx.lineTo(174, 147);
  }
  ctx.stroke();
  drawSmallHand(ctx, role === 'messenger' ? 181 : role === 'builder' ? 180 : 174, role === 'messenger' ? 84 : role === 'builder' ? 96 : 147, style.stroke);

  if (role === 'builder') {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(170, 98);
    ctx.lineTo(193, 75);
    ctx.moveTo(183, 71);
    ctx.lineTo(204, 92);
    ctx.stroke();
  } else if (role === 'worker') {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(165, 142);
    ctx.lineTo(190, 126);
    ctx.moveTo(184, 122);
    ctx.lineTo(198, 137);
    ctx.stroke();
  } else if (role === 'messenger') {
    ctx.fillStyle = style.accent;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(182, 72);
    ctx.lineTo(205, 84);
    ctx.lineTo(182, 97);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(73, 128);
  ctx.lineTo(role === 'hauler' ? 50 : 44, role === 'hauler' ? 146 : 116);
  ctx.stroke();
  drawSmallHand(ctx, role === 'hauler' ? 50 : 44, role === 'hauler' ? 146 : 116, style.stroke);

  ctx.fillStyle = style.fill;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(62, 94, 100, 96, 34);
  ctx.fill();
  ctx.stroke();

  if (role === 'worker') {
    ctx.fillStyle = '#fff8e8';
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(84, 116, 56, 57, 13);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = style.trim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(94, 133);
    ctx.lineTo(130, 133);
    ctx.moveTo(94, 149);
    ctx.lineTo(122, 149);
    ctx.stroke();
  } else if (role === 'hauler') {
    ctx.strokeStyle = style.trim;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(78, 107);
    ctx.lineTo(146, 178);
    ctx.moveTo(146, 107);
    ctx.lineTo(78, 178);
    ctx.stroke();
    ctx.fillStyle = '#c4883a';
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(82, 134, 60, 40, 10);
    ctx.fill();
    ctx.stroke();
  } else if (role === 'messenger') {
    ctx.fillStyle = '#6b4631';
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(118, 142, 42, 38, 9);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff0bd';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(79, 110);
    ctx.lineTo(145, 172);
    ctx.stroke();
  }

  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(91, 184);
  ctx.lineTo(82, 213);
  ctx.moveTo(132, 184);
  ctx.lineTo(143, 213);
  ctx.stroke();
  ctx.fillStyle = style.trim;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(61, 207, 38, 17, 8);
  ctx.roundRect(128, 207, 38, 17, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = style.face;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(112, 76, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (role === 'builder') {
    ctx.fillStyle = style.accent;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(112, 70, 48, Math.PI, Math.PI * 2);
    ctx.lineTo(160, 75);
    ctx.lineTo(64, 75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#f4a92f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(112, 27);
    ctx.lineTo(112, 73);
    ctx.moveTo(91, 38);
    ctx.lineTo(91, 73);
    ctx.moveTo(133, 38);
    ctx.lineTo(133, 73);
    ctx.stroke();
  } else {
    ctx.fillStyle = style.trim;
    ctx.beginPath();
    ctx.arc(112, 45, 34, Math.PI, Math.PI * 2);
    ctx.lineTo(146, 63);
    ctx.quadraticCurveTo(112, 53, 78, 63);
    ctx.closePath();
    ctx.fill();
    if (role === 'messenger') {
      ctx.fillStyle = style.accent;
      ctx.beginPath();
      ctx.arc(144, 56, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(200, 92, 117, 0.28)';
  ctx.beginPath();
  ctx.arc(82, 88, 7, 0, Math.PI * 2);
  ctx.arc(142, 88, 7, 0, Math.PI * 2);
  ctx.fill();
  drawCharacterEyes(ctx, 112, 82, role === 'messenger' ? 'alert' : role === 'hauler' ? 'happy' : 'busy');

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
  if (object.kind === 'actor') return object.canonicalRoleId === 'clover' ? 1.35 : 1.22;
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
    baseX: sprite.position.x,
    baseY: sprite.position.y,
    baseScaleX: sprite.scale.x,
    baseScaleY: sprite.scale.y,
    baseRotation: sprite.material.rotation || 0,
    phase: stablePhase(object.actionAnimation?.phaseSeed || object.actorId || object.id)
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
    animationMode: String(object.actionAnimation?.mode || ''),
    animationTempo: number(object.actionAnimation?.tempo, 1),
    animationStepStyle: String(object.actionAnimation?.stepStyle || ''),
    hasWalkOffset: object.actionAnimation?.hasWalkOffset === true,
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
    baseX: badge.position.x,
    baseY: badge.position.y,
    baseScaleX: badge.scale.x,
    baseScaleY: badge.scale.y,
    baseRotation: badge.material.rotation || 0,
    phase: stablePhase(object.actionAnimation?.phaseSeed || object.actorId || object.id)
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
      baseX: progress.position.x,
      baseY: progress.position.y,
      baseScaleX: progress.scale.x,
      baseScaleY: progress.scale.y,
      baseRotation: progress.material.rotation || 0,
      phase: stablePhase(object.actionAnimation?.phaseSeed || object.actorId || object.id)
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
    animationMode: String(data.animationMode || ''),
    animationStepStyle: String(data.animationStepStyle || ''),
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
        actionAnimation: object.actionAnimation || null,
        canvas: this.canvasPointFor(object)
      }))
    };
    return this.info;
  }

  animate(time = 0) {
    if (!this.running) return;
    for (const mesh of this.objectMeshes) {
      const data = mesh.userData || {};
      const baseX = number(data.baseX, mesh.position.x);
      const baseY = number(data.baseY, mesh.position.y);
      const baseScaleX = number(data.baseScaleX, mesh.scale.x);
      const baseScaleY = number(data.baseScaleY, mesh.scale.y);
      const baseRotation = number(data.baseRotation, 0);
      if (data.kind === 'actor') {
        if (this.reducedMotion) {
          mesh.position.x = baseX;
          mesh.position.y = baseY;
          mesh.scale.set(baseScaleX, baseScaleY, 1);
          if (mesh.material) mesh.material.rotation = baseRotation;
          continue;
        }
        const phase = number(data.phase, 0);
        const tempo = number(data.animationTempo, 1);
        const t = (time / 360) * tempo + phase;
        const step = data.hasWalkOffset ? Math.sin((time / 170) + phase) : 0;
        const walkLift = Math.abs(step) * 0.018;
        let x = baseX;
        let y = baseY + (Math.sin(t) * 0.024) + walkLift;
        let scaleX = baseScaleX;
        let scaleY = baseScaleY;
        let rotation = baseRotation;

        if (data.animationMode === 'work_swing') {
          rotation += Math.sin((time / 120) + phase) * 0.075;
          y += Math.max(0, Math.sin((time / 155) + phase)) * 0.035;
          scaleY *= 1 + (Math.sin((time / 155) + phase) * 0.018);
        } else if (data.animationMode === 'busy_work') {
          x += Math.sin((time / 135) + phase) * 0.018;
          y += Math.sin((time / 95) + phase) * 0.012;
          scaleX *= 1 + (Math.sin((time / 135) + phase) * 0.012);
        } else if (data.animationMode === 'carry_wobble') {
          x += Math.sin((time / 210) + phase) * 0.025;
          rotation += Math.sin((time / 180) + phase) * 0.055;
          scaleY *= 1 + (Math.abs(Math.sin((time / 180) + phase)) * 0.018);
        } else if (data.animationMode === 'attention_wave') {
          y += Math.abs(Math.sin((time / 150) + phase)) * 0.050;
          rotation += Math.sin((time / 125) + phase) * 0.045;
          scaleX *= 1 + (Math.sin((time / 150) + phase) * 0.012);
        }

        mesh.position.x = x;
        mesh.position.y = y;
        mesh.scale.set(scaleX, scaleY, 1);
        if (mesh.material) mesh.material.rotation = rotation;
      } else if (data.actionCueSprite && !data.progressSprite) {
        if (this.reducedMotion) {
          mesh.position.x = baseX;
          mesh.position.y = baseY;
          if (mesh.material) mesh.material.rotation = baseRotation;
          continue;
        }
        const phase = number(data.phase, 0);
        mesh.position.y = baseY + (Math.sin((time / 240) + phase) * 0.025);
        if (data.actionCueAccessory === 'hammer' || data.actionCueAccessory === 'wrench') {
          mesh.material.rotation = baseRotation + (Math.sin((time / 135) + phase) * 0.10);
        } else if (data.actionCueAccessory === 'notice' || data.actionCueAccessory === 'approval' || data.actionCueAccessory === 'quest') {
          mesh.material.rotation = baseRotation + (Math.sin((time / 180) + phase) * 0.07);
        }
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
