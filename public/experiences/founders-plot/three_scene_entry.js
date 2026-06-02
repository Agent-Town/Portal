import * as THREE from 'three';

const WORLD_WIDTH = 16;
const WORLD_HEIGHT = 9;
const stageRenderers = new WeakMap();
const expeditionMapRenderers = new WeakMap();
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

function worldPoint(point = {}, z = -1.65) {
  return new THREE.Vector3(worldX(point.x), worldY(point.y), z);
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

function makeEncounterTexture(encounter = {}) {
  const cueType = String(encounter.cueType || 'crossing_greeting');
  const roles = Array.isArray(encounter.roles) ? encounter.roles : [];
  const key = `encounter:${cueType}:${roles.join('+')}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(46, 27, 14, 0.22)';
  ctx.beginPath();
  ctx.ellipse(96, 126, 52, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cueType === 'handoff' ? '#fff0bd' : '#d6f1ef';
  ctx.strokeStyle = '#3b2513';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.roundRect(36, 22, 120, 84, 28);
  ctx.fill();
  ctx.stroke();

  const left = roleStyle(roles[0] || 'worker');
  const right = roleStyle(roles[1] || 'messenger');
  ctx.fillStyle = left.fill;
  ctx.strokeStyle = left.stroke;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(78, 64, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = right.fill;
  ctx.strokeStyle = right.stroke;
  ctx.beginPath();
  ctx.arc(116, 64, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#3b2513';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(91, 82);
  ctx.lineTo(103, 82);
  ctx.stroke();

  ctx.fillStyle = cueType === 'handoff' ? '#c4883a' : '#c85c75';
  drawStar(ctx, 97, 38, 13, 6);
  ctx.fill();
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function textureHasImageData(texture) {
  const image = texture?.image || null;
  return !!image && image.complete !== false;
}

function loadTexture(src, onLoad, onError) {
  const key = String(src || '').trim();
  if (!key) return null;
  if (textureCache.has(key)) {
    const cached = textureCache.get(key);
    if (typeof onLoad === 'function') {
      if (textureHasImageData(cached)) queueMicrotask(() => onLoad(cached));
      else cached.userData.pendingOnLoad = [...(cached.userData.pendingOnLoad || []), onLoad];
    }
    if (typeof onError === 'function' && !textureHasImageData(cached)) {
      cached.userData.pendingOnError = [...(cached.userData.pendingOnError || []), onError];
    }
    return cached;
  }
  const texture = new THREE.TextureLoader().load(key, () => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const callbacks = texture.userData.pendingOnLoad || [];
    texture.userData.pendingOnLoad = [];
    texture.userData.pendingOnError = [];
    for (const callback of callbacks) callback(texture);
  }, undefined, () => {
    const callbacks = texture.userData.pendingOnError || [];
    textureCache.delete(key);
    for (const callback of callbacks) callback();
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.pendingOnLoad = typeof onLoad === 'function' ? [onLoad] : [];
  texture.userData.pendingOnError = typeof onError === 'function' ? [onError] : [];
  textureCache.set(key, texture);
  return texture;
}

function spriteSheetConfig(assetSprite = null) {
  if (!assetSprite || typeof assetSprite !== 'object') return null;
  const columns = clamp(Math.round(number(assetSprite.columns, 1)), 1, 32);
  const rows = clamp(Math.round(number(assetSprite.rows, 1)), 1, 32);
  const row = clamp(Math.round(number(assetSprite.row, 0)), 0, rows - 1);
  const rawFrames = Array.isArray(assetSprite.frames) ? assetSprite.frames : [0];
  const frames = rawFrames
    .map((frame) => clamp(Math.round(number(frame, 0)), 0, columns - 1))
    .filter((frame, index, list) => list.indexOf(frame) === index);
  return {
    id: String(assetSprite.id || ''),
    metadataSrc: String(assetSprite.metadataSrc || ''),
    action: String(assetSprite.action || ''),
    columns,
    rows,
    row,
    frames: frames.length > 0 ? frames : [0],
    fps: clamp(number(assetSprite.fps, 4), 1, 12),
    frameWidth: number(assetSprite.frameWidth, 1),
    frameHeight: number(assetSprite.frameHeight, 1)
  };
}

function setSpriteSheetFrame(texture, sheet, frame) {
  if (!texture || !sheet) return;
  const column = clamp(Math.round(number(frame, 0)), 0, sheet.columns - 1);
  texture.repeat.set(1 / sheet.columns, 1 / sheet.rows);
  texture.offset.set(column / sheet.columns, 1 - ((sheet.row + 1) / sheet.rows));
  if (textureHasImageData(texture)) texture.needsUpdate = true;
}

function makePendingSpriteSheetTexture(texture) {
  const spriteTexture = new THREE.Texture();
  spriteTexture.source = texture.source;
  spriteTexture.mapping = texture.mapping;
  spriteTexture.channel = texture.channel;
  spriteTexture.wrapS = texture.wrapS;
  spriteTexture.wrapT = texture.wrapT;
  spriteTexture.generateMipmaps = texture.generateMipmaps;
  spriteTexture.premultiplyAlpha = texture.premultiplyAlpha;
  spriteTexture.flipY = texture.flipY;
  spriteTexture.unpackAlignment = texture.unpackAlignment;
  return spriteTexture;
}

function spriteTextureForObject(object = {}, texture) {
  const sheet = spriteSheetConfig(object.assetSprite);
  if (!sheet || !texture) return { texture, sheet: null };
  const spriteTexture = textureHasImageData(texture)
    ? texture.clone()
    : makePendingSpriteSheetTexture(texture);
  spriteTexture.colorSpace = THREE.SRGBColorSpace;
  spriteTexture.minFilter = THREE.LinearMipmapLinearFilter;
  spriteTexture.magFilter = THREE.LinearFilter;
  spriteTexture.userData = { spriteSheetClone: true };
  setSpriteSheetFrame(spriteTexture, sheet, sheet.frames[0]);
  return { texture: spriteTexture, sheet };
}

function spriteHeight(object = {}) {
  if (object.kind === 'actor') return object.canonicalRoleId === 'clover' ? 1.35 : 1.22;
  if (object.kind === 'pad') return 1.05;
  if (object.buildingType === 'HQ') return 2.15 * number(object.scale, 1);
  return 1.55 * number(object.scale, 1);
}

function makeSprite(object = {}, texture, extraDepth = 0) {
  const spriteTexture = spriteTextureForObject(object, texture);
  const sheet = spriteTexture.sheet;
  const material = new THREE.SpriteMaterial({
    map: spriteTexture.texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.04
  });
  const sprite = new THREE.Sprite(material);
  const image = sheet?.frameWidth && sheet?.frameHeight
    ? { width: sheet.frameWidth, height: sheet.frameHeight }
    : spriteTexture.texture?.image || null;
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
    phase: stablePhase(object.actionAnimation?.phaseSeed || object.actorId || object.id),
    spriteSheet: !!sheet,
    spriteSheetId: sheet?.id || '',
    spriteSheetAction: sheet?.action || '',
    spriteSheetMetadataSrc: sheet?.metadataSrc || '',
    spriteSheetColumns: sheet?.columns || 0,
    spriteSheetRows: sheet?.rows || 0,
    spriteSheetRow: sheet?.row ?? -1,
    spriteSheetFrames: sheet?.frames || [],
    spriteSheetFps: sheet?.fps || 0
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
    assetSrc: String(object.assetSrc || ''),
    assetSprite: object.assetSprite || null,
    actionKind: String(object.actionKind || ''),
    actionCueType: String(object.actionCue?.cueType || ''),
    actionCueAccessory: String(object.actionCue?.accessory || ''),
    animationMode: String(object.actionAnimation?.mode || ''),
    animationTempo: number(object.actionAnimation?.tempo, 1),
    animationStepStyle: String(object.actionAnimation?.stepStyle || ''),
    hasWalkOffset: object.actionAnimation?.hasWalkOffset === true,
    progress: number(object.progress, 0),
    routeId: String(object.route?.routeId || ''),
    wayId: String(object.route?.wayId || ''),
    routeMode: String(object.route?.mode || ''),
    routeProgress: number(object.route?.progress, 0),
    routeTargetId: String(object.route?.targetId || ''),
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

function makeWayMesh(way = {}) {
  const rawPoints = Array.isArray(way.points) ? way.points : [];
  const points = rawPoints.length >= 2
    ? rawPoints.map((point) => worldPoint(point, -1.72))
    : [worldPoint({ x: 0.5, y: 0.5 }, -1.72), worldPoint({ x: 0.55, y: 0.55 }, -1.72)];
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.4);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 18, 0.055, 7, false),
    new THREE.MeshBasicMaterial({
      color: 0x6d4825,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    })
  );
  mesh.userData = {
    kind: 'way',
    wayLine: true,
    wayId: String(way.wayId || ''),
    label: String(way.label || ''),
    targetId: String(way.targetId || ''),
    visualOnly: way.visualOnly === true,
    points: rawPoints
  };
  return mesh;
}

function makeEncounterCue(encounter = {}) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeEncounterTexture(encounter),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.03
  }));
  sprite.position.set(worldX(encounter.x), worldY(encounter.y) + 0.46, 2.25);
  sprite.scale.set(0.68, 0.56, 1);
  sprite.userData = {
    kind: 'encounter',
    encounterSprite: true,
    encounterId: String(encounter.encounterId || ''),
    targetId: String(encounter.targetId || ''),
    cueType: String(encounter.cueType || ''),
    label: String(encounter.label || ''),
    roles: Array.isArray(encounter.roles) ? encounter.roles : [],
    actorIds: Array.isArray(encounter.actorIds) ? encounter.actorIds : [],
    visualOnly: encounter.visualOnly === true,
    baseX: sprite.position.x,
    baseY: sprite.position.y,
    baseScaleX: sprite.scale.x,
    baseScaleY: sprite.scale.y,
    phase: stablePhase(encounter.encounterId || encounter.targetId || '')
  };
  return sprite;
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
    routeId: String(data.routeId || ''),
    wayId: String(data.wayId || ''),
    routeMode: String(data.routeMode || ''),
    routeProgress: number(data.routeProgress, 0),
    routeTargetId: String(data.routeTargetId || ''),
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
        if (node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of materials) {
            if (material.map?.userData?.spriteSheetClone) material.map.dispose();
            material.dispose();
          }
        }
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

    for (const way of payload.ways || []) {
      const mesh = makeWayMesh(way);
      this.scene.add(mesh);
      this.objectMeshes.push(mesh);
    }

    for (const object of payload.objects || []) {
      const role = object.canonicalRoleId || object.kind;
      const fallbackTexture = makeRoleTexture(role || 'worker');
      let sprite = null;
      const texture = object.assetSrc
        ? loadTexture(object.assetSrc, () => this.render(), () => {
          if (!sprite?.material) return;
          if (sprite.material.map?.userData?.spriteSheetClone) sprite.material.map.dispose();
          sprite.material.map = fallbackTexture;
          sprite.material.needsUpdate = true;
          sprite.userData.assetFallback = true;
          sprite.userData.spriteSheet = false;
          this.render();
        })
        : fallbackTexture;
      sprite = makeSprite(object, texture || fallbackTexture, object.kind === 'actor' ? 0.8 : 0);
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

    for (const encounter of payload.encounters || []) {
      const cue = makeEncounterCue(encounter);
      this.scene.add(cue);
      this.objectMeshes.push(cue);
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
    if (event.target instanceof Element && event.target.closest('.fp-tile')) return;
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
      ways: (payload.ways || []).map((way) => ({
        wayId: way.wayId || '',
        targetId: way.targetId || '',
        label: way.label || '',
        points: way.points || [],
        visualOnly: way.visualOnly === true
      })),
      encounters: (payload.encounters || []).map((encounter) => ({
        encounterId: encounter.encounterId || '',
        targetId: encounter.targetId || '',
        roles: encounter.roles || [],
        actorIds: encounter.actorIds || [],
        cueType: encounter.cueType || '',
        visualOnly: encounter.visualOnly === true,
        canvas: this.canvasPointFor({ x: encounter.x, y: encounter.y, z: 0, kind: 'encounter' })
      })),
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
      renderedActors: this.objectMeshes
        .filter((mesh) => mesh.userData?.kind === 'actor' && mesh.userData?.sprite === true)
        .map((mesh) => ({
          actorId: mesh.userData.actorId || '',
          canonicalRoleId: mesh.userData.canonicalRoleId || '',
          assetSrc: mesh.userData.assetSrc || '',
          spriteSheet: mesh.userData.spriteSheet === true,
          spriteSheetId: mesh.userData.spriteSheetId || '',
          spriteSheetAction: mesh.userData.spriteSheetAction || '',
          routeId: mesh.userData.routeId || '',
          wayId: mesh.userData.wayId || '',
          routeProgress: number(mesh.userData.routeProgress, 0),
          assetFallback: mesh.userData.assetFallback === true
        })),
      renderedWays: this.objectMeshes
        .filter((mesh) => mesh.userData?.wayLine === true)
        .map((mesh) => ({
          wayId: mesh.userData.wayId || '',
          targetId: mesh.userData.targetId || '',
          visualOnly: mesh.userData.visualOnly === true
        })),
      renderedEncounters: this.objectMeshes
        .filter((mesh) => mesh.userData?.encounterSprite === true)
        .map((mesh) => ({
          encounterId: mesh.userData.encounterId || '',
          targetId: mesh.userData.targetId || '',
          cueType: mesh.userData.cueType || '',
          roles: mesh.userData.roles || [],
          visualOnly: mesh.userData.visualOnly === true
        })),
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
        assetSrc: object.assetSrc || '',
        assetSprite: object.assetSprite || null,
        actionKind: object.actionKind || '',
        route: object.route || null,
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
        if (data.spriteSheet && mesh.material?.map) {
          const frames = Array.isArray(data.spriteSheetFrames) && data.spriteSheetFrames.length > 0
            ? data.spriteSheetFrames
            : [0];
          const fps = number(data.spriteSheetFps, 4);
          const frame = frames[Math.floor((time / 1000) * fps + number(data.phase, 0)) % frames.length];
          setSpriteSheetFrame(mesh.material.map, {
            columns: number(data.spriteSheetColumns, 1),
            rows: number(data.spriteSheetRows, 1),
            row: number(data.spriteSheetRow, 0)
          }, frame);
        }
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

const EXPEDITION_WORLD_WIDTH = 13.6;
const EXPEDITION_WORLD_HEIGHT = 8.2;
const EXPEDITION_CELL_RADIUS = 0.86;
const EXPEDITION_REGION_RADIUS = EXPEDITION_CELL_RADIUS * 1.64;
const EXPEDITION_VISUAL_SHELL_VERSION = 'hq14t_server_bound_terrain_underlay_v1';
const EXPEDITION_REGION_ASSET_PACK_VERSION = 'hq14s_public_terrain_underlay_v1';
const EXPEDITION_REGION_ASSET_BASE = '/experiences/founders-plot/assets/expedition-map';
const EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE = `${EXPEDITION_REGION_ASSET_BASE}/hq14s-public-terrain-underlay-v1`;
const EXPEDITION_SPRITE_ASSET_PACK_VERSION = 'hq15e_expedition_unit_marker_sprites_v1';
const EXPEDITION_SPRITE_ASSET_BASE = `${EXPEDITION_REGION_ASSET_BASE}/hq15e-expedition-unit-marker-sprites-v1`;
const EXPEDITION_PUBLIC_TERRAIN_CONTRACT_VERSION = 'agenttown_public_terrain_asset_slots_v1';
const EXPEDITION_PUBLIC_TERRAIN_SLOT_SOURCE = 'server_read_model_v1';
const EXPEDITION_ALLOWED_PUBLIC_TERRAIN_SLOTS = Object.freeze(['field', 'forest', 'ridge', 'settled']);
const EXPEDITION_PROMOTED_UNDERLAY_ASSET = Object.freeze({
  slot: 'public_terrain_underlay',
  path: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/public-terrain-underlay-candidate-01-v1.png`,
  assetKind: 'visual_underlay'
});
const EXPEDITION_REGION_TILE_ASSETS = Object.freeze({
  field: {
    slot: 'field',
    path: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/field-v1.png`,
    assetKind: 'concrete_public_terrain'
  },
  settled: {
    slot: 'settled',
    path: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/settled-v1.png`,
    assetKind: 'concrete_public_terrain'
  },
  forest: {
    slot: 'forest',
    path: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/forest-v1.png`,
    assetKind: 'concrete_public_terrain'
  },
  ridge: {
    slot: 'ridge',
    path: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/ridge-v1.png`,
    assetKind: 'concrete_public_terrain'
  },
  hinted: {
    slot: 'hinted_frontier_fog',
    path: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/hinted-frontier-fog-v1.png`,
    assetKind: 'fog_only',
    fogOnly: true
  },
  locked_unknown: {
    slot: 'locked_unknown_fog',
    path: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/locked-unknown-fog-v1.png`,
    assetKind: 'fog_only',
    fogOnly: true
  }
});
const EXPEDITION_UNIT_SPRITE_ASSETS = Object.freeze({
  scout: { slot: 'scout', path: `${EXPEDITION_SPRITE_ASSET_BASE}/scout-pathfinder-v1.png`, assetKind: 'generated_unit_sprite' },
  settler_convoy: { slot: 'settler_convoy', path: `${EXPEDITION_SPRITE_ASSET_BASE}/settler-convoy-v1.png`, assetKind: 'generated_unit_sprite' },
  surveyor: { slot: 'surveyor', path: `${EXPEDITION_SPRITE_ASSET_BASE}/surveyor-beacon-v1.png`, assetKind: 'generated_unit_sprite' },
  courier: { slot: 'courier', path: `${EXPEDITION_SPRITE_ASSET_BASE}/courier-signal-runner-v1.png`, assetKind: 'generated_unit_sprite' },
  outpost_crew: { slot: 'outpost_crew', path: `${EXPEDITION_SPRITE_ASSET_BASE}/outpost-crew-v1.png`, assetKind: 'generated_unit_sprite' },
  field_support: { slot: 'surveyor', path: `${EXPEDITION_SPRITE_ASSET_BASE}/surveyor-beacon-v1.png`, assetKind: 'generated_unit_sprite' }
});
const EXPEDITION_MARKER_SPRITE_ASSETS = Object.freeze({
  objective_beacon: { slot: 'objective_beacon', path: `${EXPEDITION_SPRITE_ASSET_BASE}/objective-beacon-v1.png`, assetKind: 'generated_marker_sprite' },
  event_packet: { slot: 'event_packet', path: `${EXPEDITION_SPRITE_ASSET_BASE}/event-packet-v1.png`, assetKind: 'generated_marker_sprite' },
  receipt_ledger: { slot: 'receipt_ledger', path: `${EXPEDITION_SPRITE_ASSET_BASE}/receipt-ledger-v1.png`, assetKind: 'generated_marker_sprite' }
});
const expeditionRegionTileImages = new Map();
const expeditionRegionTileListeners = new Set();

function hexCss(color, alpha = 1) {
  const value = Number(color || 0);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function stableHash(value = '') {
  const text = String(value || '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableUnit(value = '') {
  return (stableHash(value) % 10000) / 10000;
}

function axialPoint(cell = {}) {
  const q = number(cell.q, 0);
  const r = number(cell.r, 0);
  return {
    x: q + (r * 0.5),
    y: -r * 0.86
  };
}

function expeditionLayout(cells = []) {
  const points = cells.map((cell) => axialPoint(cell));
  if (!points.length) points.push({ x: 0, y: 0 });
  const minRawX = Math.min(...points.map((point) => point.x), 0);
  const maxRawX = Math.max(...points.map((point) => point.x), 0);
  const minRawY = Math.min(...points.map((point) => point.y), 0);
  const maxRawY = Math.max(...points.map((point) => point.y), 0);
  const rawWidth = Math.max(1, maxRawX - minRawX);
  const rawHeight = Math.max(1, maxRawY - minRawY);
  const scale = Math.min((EXPEDITION_WORLD_WIDTH - 2.4) / rawWidth, (EXPEDITION_WORLD_HEIGHT - 1.8) / rawHeight, 1.62);
  const centerX = (minRawX + maxRawX) / 2;
  const centerY = (minRawY + maxRawY) / 2;
  const positions = new Map();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const cell of cells) {
    const raw = axialPoint(cell);
    const position = {
      x: (raw.x - centerX) * scale,
      y: (raw.y - centerY) * scale
    };
    positions.set(String(cell.cellId || ''), position);
    minX = Math.min(minX, position.x - EXPEDITION_REGION_RADIUS);
    maxX = Math.max(maxX, position.x + EXPEDITION_REGION_RADIUS);
    minY = Math.min(minY, position.y - EXPEDITION_REGION_RADIUS);
    maxY = Math.max(maxY, position.y + EXPEDITION_REGION_RADIUS);
  }
  if (!Number.isFinite(minX)) {
    minX = -1;
    maxX = 1;
    minY = -1;
    maxY = 1;
  }
  return {
    positions,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    }
  };
}

function expeditionFogStyle(cell = {}, selected = false) {
  const fogState = String(cell.fogState || 'locked_unknown');
  if (selected) {
    return {
      fill: 0xdff1e4,
      line: 0x164f4c,
      rim: 0xf5d484,
      shadow: 0x163c39,
      opacity: 0.98,
      lineOpacity: 0.98,
      labelTone: 'selected',
      fogOverlay: 0xeff9f4
    };
  }
  if (fogState === 'discovered') {
    return {
      fill: 0xaac98e,
      line: 0x2d6a46,
      rim: 0xf0d992,
      shadow: 0x2d4f2f,
      opacity: 0.98,
      lineOpacity: 0.9,
      labelTone: 'ready',
      fogOverlay: 0xe5f6d4
    };
  }
  if (fogState === 'known') {
    return {
      fill: 0x3d9f9b,
      line: 0x155a55,
      rim: 0xbaf0ed,
      shadow: 0x123b38,
      opacity: 0.96,
      lineOpacity: 0.86,
      labelTone: 'selected',
      fogOverlay: 0xb5f1ed
    };
  }
  if (fogState === 'hinted') {
    return {
      fill: 0xe59b35,
      line: 0x6d3f16,
      rim: 0xffd878,
      shadow: 0x7b4513,
      opacity: 0.92,
      lineOpacity: 0.84,
      labelTone: 'neutral',
      fogOverlay: 0xf3b448
    };
  }
  return {
    fill: 0x9a9484,
    line: 0x5d564a,
    rim: 0xd7c7a8,
    shadow: 0x524b42,
    opacity: 0.54,
    lineOpacity: 0.46,
    labelTone: 'neutral',
    fogOverlay: 0xc8bcaa
  };
}

function expeditionHexPoints(radius = EXPEDITION_CELL_RADIUS) {
  const points = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 6) + (index * Math.PI / 3);
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }
  points.push(points[0].clone());
  return points;
}

function expeditionHexGeometry(radius = EXPEDITION_CELL_RADIUS) {
  const shape = new THREE.Shape();
  expeditionHexPoints(radius).forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  return new THREE.ShapeGeometry(shape);
}

function expeditionHexTexturedGeometry(radius = EXPEDITION_CELL_RADIUS) {
  const points = expeditionHexPoints(radius).slice(0, 6);
  const vertices = [0, 0, 0];
  const uvs = [0.5, 0.5];
  for (const point of points) {
    vertices.push(point.x, point.y, 0);
    uvs.push(0.5 + (point.x / (radius * 2)), 0.5 - (point.y / (radius * 2)));
  }
  const indices = [];
  for (let index = 1; index <= points.length; index += 1) {
    indices.push(0, index, index === points.length ? 1 : index + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function expeditionCellLabel(cell = {}) {
  const status = String(cell.status || '');
  const kind = String(cell.kind || '');
  const fogState = String(cell.fogState || '');
  if (status.includes('OUTPOST') || kind.includes('outpost')) return 'OUT';
  if (kind === 'origin_plot') return 'HQ';
  if (status.includes('SITE_PLAN')) return 'PLAN';
  if (status.includes('SCOUT')) return 'SITE';
  if (fogState === 'hinted') return '...';
  if (fogState === 'locked_unknown') return '?';
  return 'MAP';
}

function expeditionRegionPlateOpacity(fogState = '', selected = false, hovered = false) {
  if (selected) return 0.72;
  if (hovered) return 0.62;
  if (fogState === 'locked_unknown') return 0.26;
  if (fogState === 'hinted') return 0.46;
  return 0.58;
}

function expeditionCorePlateOpacity(style = {}, fogState = '', selected = false, hovered = false) {
  const base = number(style.opacity, 0.72);
  if (selected) return Math.min(0.82, base * 0.88);
  if (hovered) return Math.min(0.72, base * 0.76);
  if (fogState === 'locked_unknown') return Math.min(0.34, base * 0.58);
  if (fogState === 'hinted') return Math.min(0.52, base * 0.62);
  return Math.min(0.58, base * 0.66);
}

function expeditionRegionLineOpacity(fogState = '', selected = false, hovered = false) {
  if (selected) return 0.70;
  if (hovered) return 0.42;
  if (fogState === 'locked_unknown') return 0.08;
  if (fogState === 'hinted') return 0.16;
  return 0.18;
}

function expeditionCoreLineOpacity(style = {}, fogState = '', selected = false, hovered = false) {
  if (selected) return Math.max(0.58, number(style.lineOpacity, 0.58));
  if (hovered) return 0.38;
  if (fogState === 'locked_unknown') return 0.14;
  if (fogState === 'hinted') return 0.20;
  return 0.22;
}

function expeditionPublicTerrainText(cell = {}) {
  const siteType = String(cell.siteType || '').toLowerCase();
  const traits = Array.isArray(cell.traits) ? cell.traits.map((trait) => String(trait || '').toLowerCase()) : [];
  const kind = String(cell.kind || '').toLowerCase();
  const status = String(cell.status || '').toLowerCase();
  return `${siteType} ${kind} ${status} ${traits.join(' ')}`;
}

function cellExposesRegionTruth(cell = {}) {
  return ['discovered', 'known'].includes(String(cell.fogState || 'locked_unknown'));
}

function isServerOwnedWaterTerrain(cell = {}) {
  return cellExposesRegionTruth(cell) && String(cell.publicTerrainAssetSlot || '') === 'water';
}

function isServerOwnedRuinSignalTerrain(cell = {}) {
  return cellExposesRegionTruth(cell) && String(cell.publicTerrainAssetSlot || '') === 'ridge'
    && /(^|[_\s-])(ruin|signal)([_\s-]|$)/.test(expeditionPublicTerrainText(cell));
}

function serverPublicTerrainSlot(cell = {}) {
  if (!cellExposesRegionTruth(cell)) return null;
  const slot = String(cell.publicTerrainAssetSlot || '');
  return EXPEDITION_ALLOWED_PUBLIC_TERRAIN_SLOTS.includes(slot) ? slot : null;
}

function serverFogAssetSlot(cell = {}) {
  const fogState = String(cell.fogState || 'locked_unknown');
  const slot = String(cell.fogAssetSlot || '');
  if (fogState === 'hinted' && slot === 'hinted_frontier_fog') return slot;
  if (fogState === 'locked_unknown' && slot === 'locked_unknown_fog') return slot;
  return fogState === 'hinted' ? 'hinted_frontier_fog' : 'locked_unknown_fog';
}

function expeditionCellTerrain(cell = {}) {
  const fogState = String(cell.fogState || 'locked_unknown');
  if (!cellExposesRegionTruth(cell)) return fogState;
  return serverPublicTerrainSlot(cell) || 'field';
}

function expeditionPublicTerrainAllows(cell = {}, asset = null) {
  if (!cellExposesRegionTruth(cell) || !asset?.slot) return false;
  return asset.slot === serverPublicTerrainSlot(cell);
}

function expeditionRegionTileAssetForCell(cell = {}, terrain = expeditionCellTerrain(cell)) {
  const fogState = String(cell.fogState || 'locked_unknown');
  if (!cellExposesRegionTruth(cell)) {
    const fogAsset = EXPEDITION_REGION_TILE_ASSETS[fogState] || null;
    return fogAsset && fogAsset.slot === serverFogAssetSlot(cell) ? fogAsset : null;
  }
  const asset = EXPEDITION_REGION_TILE_ASSETS[serverPublicTerrainSlot(cell) || terrain] || null;
  if (!asset) return null;
  return expeditionPublicTerrainAllows(cell, asset) ? asset : null;
}

function expeditionRegionTileAssetAllowed(cell = {}, terrain = expeditionCellTerrain(cell), asset = expeditionRegionTileAssetForCell(cell, terrain)) {
  const fogState = String(cell.fogState || 'locked_unknown');
  if (!asset) return terrain === 'field';
  if (!cellExposesRegionTruth(cell)) {
    return asset.fogOnly === true && asset.assetKind === 'fog_only' && asset.slot === serverFogAssetSlot(cell);
  }
  return asset.fogOnly !== true
    && asset.assetKind === 'concrete_public_terrain'
    && asset.slot === serverPublicTerrainSlot(cell)
    && String(cell.terrainAssetContractVersion || '') === EXPEDITION_PUBLIC_TERRAIN_CONTRACT_VERSION
    && String(cell.publicTerrainAssetSlotSource || '') === EXPEDITION_PUBLIC_TERRAIN_SLOT_SOURCE;
}

function notifyExpeditionRegionTileLoaded() {
  for (const listener of expeditionRegionTileListeners) {
    listener();
  }
}

function onExpeditionRegionTileAssetChange(listener) {
  if (typeof listener !== 'function') return () => {};
  expeditionRegionTileListeners.add(listener);
  return () => expeditionRegionTileListeners.delete(listener);
}

function expeditionRegionTileReady(asset = null) {
  if (!asset?.path) return null;
  const image = expeditionRegionTileImages.get(asset.path);
  if (!image || image.dataset?.loadFailed === 'true') return null;
  return image.complete && image.naturalWidth > 0 ? image : null;
}

function ensureExpeditionRegionTileImage(asset = null) {
  if (!asset?.path || typeof Image === 'undefined') return null;
  const existing = expeditionRegionTileImages.get(asset.path);
  if (existing) return expeditionRegionTileReady(asset);
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => notifyExpeditionRegionTileLoaded();
  image.onerror = () => {
    image.dataset.loadFailed = 'true';
    notifyExpeditionRegionTileLoaded();
  };
  expeditionRegionTileImages.set(asset.path, image);
  image.src = asset.path;
  return expeditionRegionTileReady(asset);
}

function expeditionUnitSpriteAsset(unit = {}) {
  return EXPEDITION_UNIT_SPRITE_ASSETS[String(unit.unitType || '')] || null;
}

function drawExpeditionGeneratedSprite(ctx, asset = null, x = 0, y = 0, width = 128, height = 128, radius = 22) {
  const image = ensureExpeditionRegionTileImage(asset);
  if (!image) return false;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
  return true;
}

function drawHexClip(ctx, radius = 120, center = 128) {
  ctx.beginPath();
  expeditionHexPoints(radius).forEach((point, index) => {
    const x = center + point.x;
    const y = center + point.y;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawMiniTree(ctx, x, y, scale = 1, canopy = 'rgba(35, 104, 68, 0.62)') {
  ctx.fillStyle = 'rgba(46, 27, 14, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + (7 * scale), y + (12 * scale), 13 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(80, 55, 29, 0.58)';
  ctx.fillRect(x - (2 * scale), y + (4 * scale), 4 * scale, 14 * scale);
  ctx.fillStyle = canopy;
  for (let layer = 0; layer < 3; layer += 1) {
    const top = y - (18 * scale) + (layer * 12 * scale);
    const width = (18 - (layer * 2)) * scale;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x - width, top + (24 * scale));
    ctx.lineTo(x + width, top + (24 * scale));
    ctx.closePath();
    ctx.fill();
  }
}

function drawMiniHouse(ctx, x, y, scale = 1, fill = 'rgba(255, 248, 232, 0.78)') {
  ctx.fillStyle = 'rgba(46, 27, 14, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + (8 * scale), y + (24 * scale), 24 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.38)';
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.roundRect(x - (18 * scale), y, 36 * scale, 26 * scale, 5 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(151, 86, 44, 0.82)';
  ctx.beginPath();
  ctx.moveTo(x - (22 * scale), y + (4 * scale));
  ctx.lineTo(x, y - (17 * scale));
  ctx.lineTo(x + (23 * scale), y + (4 * scale));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawSignalMast(ctx, x, y, scale = 1, color = 'rgba(27, 106, 100, 0.72)') {
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.42)';
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + (22 * scale));
  ctx.lineTo(x, y - (28 * scale));
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + (3 * scale), y - (25 * scale));
  ctx.lineTo(x + (30 * scale), y - (17 * scale));
  ctx.lineTo(x + (3 * scale), y - (6 * scale));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.52)';
  ctx.lineWidth = 2 * scale;
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.arc(x, y - (21 * scale), (15 + (index * 12)) * scale, -0.72, 0.34);
    ctx.stroke();
  }
}

function drawLedgerTick(ctx, x, y, width = 92, alpha = 0.22) {
  ctx.save();
  ctx.strokeStyle = `rgba(46, 27, 14, ${alpha})`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + (width * 0.25), y - 7, x + (width * 0.62), y + 8, x + width, y - 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255, 248, 232, ${alpha + 0.10})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 4);
  ctx.bezierCurveTo(x + (width * 0.28), y - 9, x + (width * 0.64), y + 5, x + width - 6, y - 6);
  ctx.stroke();
  ctx.restore();
}

function drawPlanWagonCue(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255, 248, 232, 0.30)';
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.34)';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.roundRect(-34 * scale, -17 * scale, 68 * scale, 34 * scale, 8 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(27, 106, 100, 0.35)';
  ctx.beginPath();
  ctx.moveTo(-27 * scale, -17 * scale);
  ctx.lineTo(0, -39 * scale);
  ctx.lineTo(29 * scale, -17 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(101, 74, 28, 0.45)';
  ctx.beginPath();
  ctx.arc(-23 * scale, 21 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.arc(24 * scale, 21 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawRuinCue(ctx, x, y, scale = 1) {
  ctx.fillStyle = 'rgba(255, 248, 232, 0.14)';
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.22)';
  ctx.lineWidth = 4 * scale;
  for (let index = 0; index < 3; index += 1) {
    const px = x + ((index - 1) * 18 * scale);
    const height = (26 + (index % 2) * 14) * scale;
    ctx.beginPath();
    ctx.roundRect(px - (7 * scale), y - height, 14 * scale, height, 3 * scale);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x - (30 * scale), y + (3 * scale));
  ctx.lineTo(x + (32 * scale), y - (2 * scale));
  ctx.stroke();
}

function drawExpeditionMiniTerrain(ctx, cell, style, terrain) {
  const seed = stableUnit(`${cell.cellId}:${terrain}`);
  ctx.save();
  drawHexClip(ctx);
  ctx.clip();

  const base = ctx.createLinearGradient(0, 18, 256, 238);
  base.addColorStop(0, hexCss(style.rim, 0.92));
  base.addColorStop(0.46, hexCss(style.fill, 0.96));
  base.addColorStop(1, hexCss(style.shadow, 0.72));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(46, 27, 14, 0.08)';
  ctx.lineWidth = 3;
  for (let index = 0; index < 7; index += 1) {
    const y = 28 + (index * 31);
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.bezierCurveTo(66, y - 12, 121, y + 14, 182, y - 3);
    ctx.bezierCurveTo(210, y - 10, 231, y + 3, 248, y - 8);
    ctx.stroke();
  }

  if (terrain === 'water') {
    ctx.strokeStyle = 'rgba(39, 126, 167, 0.26)';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, 172 - (seed * 30));
    ctx.bezierCurveTo(62, 139 - (seed * 16), 118, 191 + (seed * 12), 266, 132 - (seed * 20));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(224, 248, 255, 0.28)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (terrain === 'forest') {
    if (String(cell.fogState || '') === 'known') {
      ctx.fillStyle = 'rgba(24, 137, 132, 0.24)';
      ctx.fillRect(0, 0, 256, 256);
    }
    for (let index = 0; index < 34; index += 1) {
      const x = 38 + ((index * 37 + seed * 93) % 178);
      const y = 50 + ((index * 53 + seed * 71) % 150);
      drawMiniTree(ctx, x, y, 0.46 + ((index % 3) * 0.07), String(cell.fogState || '') === 'known'
        ? (index % 4 === 0 ? 'rgba(18, 101, 103, 0.72)' : 'rgba(38, 139, 119, 0.64)')
        : (index % 4 === 0 ? 'rgba(29, 84, 61, 0.70)' : 'rgba(42, 119, 72, 0.62)'));
    }
    ctx.strokeStyle = 'rgba(255, 248, 232, 0.22)';
    ctx.lineWidth = 5;
  } else if (terrain === 'ridge') {
    ctx.strokeStyle = 'rgba(80, 68, 55, 0.48)';
    ctx.lineWidth = 9;
    for (let index = 0; index < 5; index += 1) {
      const y = 62 + (index * 30);
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.bezierCurveTo(74, y - 26, 126, y + 24, 232, y - 12);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 248, 232, 0.18)';
    for (let index = 0; index < 12; index += 1) {
      const x = 30 + ((index * 43) % 180);
      const y = 58 + ((index * 29) % 122);
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x - 12, y + 14);
      ctx.lineTo(x + 15, y + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255, 248, 232, 0.26)';
    ctx.lineWidth = 4;
  } else if (terrain === 'settled') {
    ctx.fillStyle = 'rgba(255, 248, 232, 0.28)';
    ctx.beginPath();
    ctx.ellipse(128, 132, 78, 48, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(101, 74, 28, 0.22)';
    ctx.lineWidth = 4;
    for (let index = 0; index < 4; index += 1) {
      drawLedgerTick(ctx, 56, 86 + (index * 23), 128, 0.18);
    }
    drawMiniHouse(ctx, 112, 118, 1.05);
    drawMiniHouse(ctx, 152, 137, 0.72, 'rgba(232, 244, 222, 0.78)');
    drawMiniHouse(ctx, 82, 146, 0.62, 'rgba(255, 228, 160, 0.58)');
    drawSignalMast(ctx, 160, 96, 0.56, 'rgba(47, 125, 101, 0.74)');
    drawPlanWagonCue(ctx, 90, 86, 0.42);
    ctx.strokeStyle = 'rgba(27, 106, 100, 0.34)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(128, 132, 90, 58, -0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 248, 232, 0.34)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(58, 162);
    ctx.bezierCurveTo(112, 142, 152, 167, 206, 141);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(27, 106, 100, 0.34)';
    ctx.lineWidth = 5;
  } else if (terrain === 'water') {
    ctx.strokeStyle = 'rgba(46, 122, 152, 0.44)';
    ctx.lineWidth = 10;
    for (let index = 0; index < 6; index += 1) {
      const y = 58 + (index * 25);
      ctx.beginPath();
      ctx.moveTo(22, y);
      ctx.bezierCurveTo(76, y + 18, 112, y - 18, 166, y + 3);
      ctx.bezierCurveTo(194, y + 14, 218, y - 6, 236, y + 4);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255, 248, 232, 0.28)';
    ctx.lineWidth = 4;
  } else if (terrain === 'ruin_signal') {
    ctx.fillStyle = 'rgba(255, 248, 232, 0.18)';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(80, 68, 55, 0.36)';
    ctx.lineWidth = 7;
    for (let index = 0; index < 4; index += 1) {
      const y = 70 + (index * 29);
      ctx.beginPath();
      ctx.moveTo(34, y);
      ctx.bezierCurveTo(76, y - 16, 128, y + 14, 212, y - 8);
      ctx.stroke();
    }
    drawRuinCue(ctx, 105, 154, 0.72);
    drawSignalMast(ctx, 160, 116, 0.48, 'rgba(101, 74, 28, 0.56)');
    ctx.strokeStyle = 'rgba(101, 74, 28, 0.32)';
    ctx.lineWidth = 4;
  } else if (terrain === 'hinted') {
    ctx.fillStyle = 'rgba(226, 134, 40, 0.18)';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(255, 248, 232, 0.16)';
    for (let index = 0; index < 10; index += 1) {
      const y = 28 + (index * 22);
      ctx.beginPath();
      ctx.ellipse(128 + (((index % 3) - 1) * 22), y, 112 - ((index % 2) * 18), 12, 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.setLineDash([10, 9]);
    ctx.strokeStyle = 'rgba(255, 248, 232, 0.32)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(128, 130, 72, 48, -0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(46, 27, 14, 0.12)';
    ctx.beginPath();
    ctx.ellipse(128, 136, 52, 31, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(138, 109, 65, 0.34)';
    ctx.lineWidth = 5;
  } else if (terrain === 'locked_unknown') {
    ctx.fillStyle = 'rgba(255, 248, 232, 0.10)';
    for (let index = -2; index < 11; index += 1) {
      ctx.fillRect(index * 31, 20, 13, 220);
    }
    ctx.fillStyle = 'rgba(255, 248, 232, 0.12)';
    for (let index = 0; index < 7; index += 1) {
      ctx.beginPath();
      ctx.ellipse(128, 42 + (index * 26), 116 - ((index % 2) * 18), 11, -0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(68, 58, 48, 0.16)';
    ctx.beginPath();
    ctx.ellipse(128, 145, 60, 36, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 248, 232, 0.20)';
    ctx.lineWidth = 5;
  } else {
    drawPlanWagonCue(ctx, 88 + (seed * 64), 86 + (seed * 42), 0.32);
    ctx.strokeStyle = 'rgba(69, 112, 68, 0.30)';
    ctx.lineWidth = 5;
    for (let index = 0; index < 7; index += 1) {
      const y = 48 + (index * 24);
      ctx.beginPath();
      ctx.moveTo(26, y);
      ctx.bezierCurveTo(84, y - 12, 144, y + 10, 230, y - 7);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = terrain === 'locked_unknown' ? 'rgba(255, 248, 232, 0.10)' : ctx.strokeStyle;
  for (let index = 0; index < 4; index += 1) {
    const y = 60 + (index * 38) + (seed * 12);
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.bezierCurveTo(82, y - 18, 152, y + 15, 238, y - 9);
    ctx.stroke();
  }

  ctx.restore();
}

function makeExpeditionCellTexture(cell = {}, selected = false) {
  const fogState = String(cell.fogState || 'locked_unknown');
  const terrain = expeditionCellTerrain(cell);
  const regionAsset = expeditionRegionTileAssetForCell(cell, terrain);
  const regionAssetImage = ensureExpeditionRegionTileImage(regionAsset);
  const assetState = regionAssetImage ? 'asset-ready' : regionAsset?.slot || 'procedural';
  const key = `expedition-cell:${EXPEDITION_VISUAL_SHELL_VERSION}:${cell.cellId}:${fogState}:${terrain}:${assetState}:${selected ? 'selected' : 'idle'}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const style = expeditionFogStyle(cell, selected);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.shadowColor = hexCss(style.shadow, selected ? 0.34 : 0.24);
  ctx.shadowBlur = selected ? 22 : 13;
  ctx.shadowOffsetY = selected ? 9 : 6;
  drawExpeditionMiniTerrain(ctx, cell, style, terrain);
  if (regionAssetImage) {
    ctx.save();
    drawHexClip(ctx, 120, 128);
    ctx.clip();
    ctx.globalAlpha = fogState === 'locked_unknown' ? 0.74 : fogState === 'hinted' ? 0.72 : 0.92;
    ctx.drawImage(regionAssetImage, 0, 0, 256, 256);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = fogState === 'locked_unknown' ? 0.16 : 0.10;
    ctx.fillStyle = fogState === 'locked_unknown' ? '#3b3228' : '#fff8e8';
    ctx.fillRect(0, 0, 256, 256);
    ctx.restore();
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const fog = ctx.createRadialGradient(82, 62, 12, 128, 128, 130);
  fog.addColorStop(0, 'rgba(255, 248, 232, 0.20)');
  fog.addColorStop(0.64, hexCss(style.fogOverlay, fogState === 'locked_unknown' ? 0.22 : 0.10));
  fog.addColorStop(1, hexCss(style.shadow, fogState === 'locked_unknown' ? 0.18 : 0.12));
  ctx.fillStyle = fog;
  ctx.beginPath();
  expeditionHexPoints(120).forEach((point, index) => {
    const x = 128 + point.x;
    const y = 128 + point.y;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = hexCss(selected ? style.rim : style.line, selected ? 0.98 : 0.76);
  ctx.lineWidth = selected ? 13 : 8;
  ctx.beginPath();
  expeditionHexPoints(116).forEach((point, index) => {
    const x = 128 + point.x;
    const y = 128 + point.y;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();

  if (fogState === 'hinted') {
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = 'rgba(46, 27, 14, 0.36)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeExpeditionMarkerTexture(cell = {}, selected = false) {
  const label = expeditionCellLabel(cell);
  const fogState = String(cell.fogState || 'locked_unknown');
  const key = `expedition-marker:${EXPEDITION_VISUAL_SHELL_VERSION}:${label}:${fogState}:${selected ? 'selected' : 'idle'}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const style = expeditionFogStyle(cell, selected);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(22, 18, 13, 0.22)';
  ctx.beginPath();
  ctx.ellipse(96, 154, 54, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  const kind = String(cell.kind || '');
  const status = String(cell.status || '');
  ctx.fillStyle = fogState === 'locked_unknown'
    ? 'rgba(46, 39, 32, 0.92)'
    : fogState === 'hinted'
      ? 'rgba(209, 154, 72, 0.94)'
      : kind === 'origin_plot'
        ? 'rgba(255, 226, 128, 0.98)'
        : status.includes('SITE_PLAN')
          ? 'rgba(154, 225, 216, 0.96)'
          : hexCss(style.rim, 0.94);
  ctx.strokeStyle = hexCss(style.line, 0.92);
  ctx.lineWidth = selected ? 10 : 7;
  ctx.beginPath();
  ctx.arc(96, 84, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(96, 138);
  ctx.lineTo(75, 112);
  ctx.lineTo(117, 112);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fogState === 'locked_unknown' ? '#fff8e8' : fogState === 'hinted' ? '#fff8e8' : '#2e1b0e';
  ctx.font = '800 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.length > 3 ? label.slice(0, 3) : label, 96, 84);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function expeditionPacketCellId(packet = {}) {
  return String(packet.cellId || packet.receiptLink?.cellId || packet.sourceIds?.cellId || '').trim();
}

function expeditionEventPacketsForMarkers(model = {}) {
  return (Array.isArray(model?.eventPackets) ? model.eventPackets : [])
    .filter((packet) => packet && typeof packet === 'object' && packet.packetId && expeditionPacketCellId(packet));
}

function makeExpeditionEventPacketMarkerTexture(packet = {}, selected = false) {
  const packetId = String(packet.packetId || 'packet');
  const template = String(packet.templateId || packet.kind || 'event_packet');
  const key = `expedition-event-marker:${EXPEDITION_VISUAL_SHELL_VERSION}:${packetId}:${template}:${selected ? 'selected' : 'idle'}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(46, 27, 14, 0.22)';
  ctx.beginPath();
  ctx.ellipse(96, 150, 48, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = selected ? 'rgba(255, 248, 232, 0.94)' : 'rgba(255, 248, 232, 0.84)';
  ctx.strokeStyle = selected ? '#f5d484' : '#8a6d41';
  ctx.lineWidth = selected ? 8 : 6;
  ctx.beginPath();
  ctx.roundRect(52, 48, 88, 78, 12);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#1b6a64';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(56, 60);
  ctx.lineTo(96, 92);
  ctx.lineTo(136, 60);
  ctx.stroke();

  ctx.fillStyle = '#d19a48';
  ctx.strokeStyle = '#5a3418';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(122, 116, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#82d6d0';
  ctx.globalAlpha = selected ? 0.82 : 0.58;
  ctx.beginPath();
  ctx.arc(62, 42, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawExpeditionGeneratedSprite(ctx, EXPEDITION_MARKER_SPRITE_ASSETS.event_packet, 42, 34, 108, 108, 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeExpeditionObjectiveMarkerTexture(objective = {}, selected = false) {
  const mode = String(objective.mode || 'inspect');
  const key = `expedition-objective-marker:${EXPEDITION_VISUAL_SHELL_VERSION}:${mode}:${objective.targetCellId || ''}:${selected ? 'selected' : 'idle'}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const glowColor = mode === 'scout' ? 'rgba(245, 212, 132, 0.40)' : mode === 'packet' ? 'rgba(130, 214, 208, 0.38)' : 'rgba(255, 248, 232, 0.30)';
  const fillColor = mode === 'scout' ? '#d19a48' : mode === 'packet' ? '#1b6a64' : '#8a6d41';
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.arc(96, 88, selected ? 68 : 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(46, 27, 14, 0.22)';
  ctx.beginPath();
  ctx.ellipse(96, 150, 52, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = selected ? '#fff8e8' : '#5a3418';
  ctx.lineWidth = selected ? 9 : 6;
  ctx.beginPath();
  ctx.arc(96, 82, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#fff8e8';
  ctx.fillStyle = '#fff8e8';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (mode === 'scout') {
    ctx.beginPath();
    ctx.arc(96, 82, 20, 0, Math.PI * 2);
    ctx.moveTo(96, 48);
    ctx.lineTo(96, 61);
    ctx.moveTo(96, 103);
    ctx.lineTo(96, 118);
    ctx.moveTo(62, 82);
    ctx.lineTo(75, 82);
    ctx.moveTo(117, 82);
    ctx.lineTo(130, 82);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(96, 58);
    ctx.lineTo(108, 86);
    ctx.lineTo(84, 106);
    ctx.closePath();
    ctx.fill();
  } else if (mode === 'packet') {
    ctx.beginPath();
    ctx.roundRect(72, 60, 48, 44, 7);
    ctx.moveTo(76, 69);
    ctx.lineTo(96, 86);
    ctx.lineTo(116, 69);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(72, 116);
    ctx.lineTo(96, 52);
    ctx.lineTo(120, 116);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(96, 56, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  drawExpeditionGeneratedSprite(
    ctx,
    mode === 'packet' ? EXPEDITION_MARKER_SPRITE_ASSETS.event_packet : EXPEDITION_MARKER_SPRITE_ASSETS.objective_beacon,
    42,
    28,
    108,
    108,
    18
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeExpeditionFogTexture(kind = 'edge') {
  const key = `expedition-fog:${EXPEDITION_VISUAL_SHELL_VERSION}:${kind}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(242, 238, 38, 256, 256, 250);
  gradient.addColorStop(0, kind === 'locked' ? 'rgba(135, 129, 112, 0.34)' : 'rgba(228, 133, 38, 0.46)');
  gradient.addColorStop(0.50, kind === 'locked' ? 'rgba(116, 108, 92, 0.38)' : 'rgba(238, 184, 86, 0.42)');
  gradient.addColorStop(0.80, kind === 'locked' ? 'rgba(78, 70, 58, 0.22)' : 'rgba(255, 230, 158, 0.22)');
  gradient.addColorStop(1, 'rgba(255, 248, 232, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = kind === 'locked' ? 'rgba(255, 248, 232, 0.18)' : 'rgba(255, 248, 232, 0.26)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  for (let index = 0; index < 7; index += 1) {
    const y = 104 + (index * 42);
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.bezierCurveTo(130, y - 28, 262, y + 36, 480, y - 20);
    ctx.stroke();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = kind === 'locked' ? 'rgba(57, 49, 40, 0.18)' : 'rgba(124, 91, 48, 0.18)';
  ctx.lineWidth = 3;
  for (let index = 0; index < 5; index += 1) {
    ctx.beginPath();
    ctx.ellipse(254, 242 + (index * 5), 188 - (index * 22), 122 - (index * 13), -0.14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if (kind !== 'locked') {
    ctx.setLineDash([18, 16]);
    ctx.strokeStyle = 'rgba(101, 74, 28, 0.24)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(256, 256, 164, 112, -0.16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function drawExpeditionAmbientContourField(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.07)';
  ctx.lineWidth = 3;
  for (let index = -1; index < 11; index += 1) {
    const y = 62 + (index * 58);
    ctx.beginPath();
    ctx.moveTo(-70, y);
    ctx.bezierCurveTo(124, y - 54, 282, y + 48, 474, y - 18);
    ctx.bezierCurveTo(650, y - 78, 814, y + 40, width + 80, y - 36);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(27, 106, 100, 0.08)';
  ctx.lineWidth = 2;
  for (let index = -2; index < 9; index += 1) {
    const x = 112 + (index * 128);
    ctx.beginPath();
    ctx.moveTo(x, -50);
    ctx.bezierCurveTo(x + 88, 92, x - 78, 222, x + 74, 362);
    ctx.bezierCurveTo(x + 202, 480, x - 62, 546, x + 138, height + 52);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.26)';
  ctx.lineWidth = 2;
  for (let index = 0; index < 5; index += 1) {
    const x = 610 + (index * 80);
    const y = 118 + ((index % 2) * 74);
    ctx.beginPath();
    ctx.ellipse(x, y, 84 + (index * 10), 38 + (index * 4), -0.18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function makeExpeditionEdgeFogTexture(kind = 'soft') {
  const key = `expedition-edge-fog:${EXPEDITION_VISUAL_SHELL_VERSION}:${kind}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, 'rgba(255, 248, 232, 0)');
  gradient.addColorStop(0.28, kind === 'locked' ? 'rgba(43, 35, 27, 0.30)' : 'rgba(234, 219, 184, 0.24)');
  gradient.addColorStop(0.52, kind === 'locked' ? 'rgba(43, 35, 27, 0.54)' : 'rgba(255, 248, 232, 0.50)');
  gradient.addColorStop(0.76, kind === 'locked' ? 'rgba(43, 35, 27, 0.30)' : 'rgba(27, 106, 100, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 248, 232, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = kind === 'locked' ? 'rgba(255, 248, 232, 0.14)' : 'rgba(255, 248, 232, 0.32)';
  ctx.lineWidth = 2;
  for (let index = 0; index < 12; index += 1) {
    const y = 28 + index * 17;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(240, y - 30, 510, y + 36, 1024, y - 18);
    ctx.stroke();
  }
  ctx.save();
  ctx.setLineDash([20, 14]);
  ctx.strokeStyle = kind === 'locked' ? 'rgba(255, 248, 232, 0.10)' : 'rgba(101, 74, 28, 0.22)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(34, 132);
  ctx.bezierCurveTo(254, 74, 534, 182, 990, 112);
  ctx.stroke();
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeExpeditionMapTexture() {
  const key = `expedition-map-base:${EXPEDITION_VISUAL_SHELL_VERSION}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f3e4bf');
  gradient.addColorStop(0.32, '#d8dfbd');
  gradient.addColorStop(0.64, '#b9cfa5');
  gradient.addColorStop(1, '#6aa39b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawExpeditionAmbientContourField(ctx, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(72, 152, 124, 0.11)';
  for (let index = 0; index < 9; index += 1) {
    const x = -60 + index * 140;
    ctx.beginPath();
    ctx.ellipse(x, 470 + ((index % 3) * 18), 148, 45, -0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(101, 74, 28, 0.12)';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-70, 452);
  ctx.bezierCurveTo(112, 385, 247, 507, 399, 423);
  ctx.bezierCurveTo(552, 339, 709, 440, 1094, 305);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.20)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = 'rgba(33, 113, 80, 0.13)';
  for (let index = 0; index < 68; index += 1) {
    const x = (index * 83) % canvas.width;
    const y = (index * 131) % canvas.height;
    const r = 28 + ((index * 17) % 74);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.4, r, (index % 5) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(68, 57, 46, 0.20)';
  ctx.lineWidth = 6;
  for (let index = 0; index < 7; index += 1) {
    const y = 102 + index * 48;
    ctx.beginPath();
    ctx.moveTo(554, y);
    ctx.bezierCurveTo(615, y - 42, 706, y + 34, 804, y - 22);
    ctx.bezierCurveTo(873, y - 60, 946, y + 11, 1070, y - 44);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(46, 27, 14, 0.13)';
  ctx.lineWidth = 2.5;
  for (let y = 54; y < canvas.height; y += 56) {
    ctx.beginPath();
    ctx.moveTo(-30, y);
    ctx.bezierCurveTo(150, y - 36, 280, y + 42, 470, y - 8);
    ctx.bezierCurveTo(650, y - 56, 780, y + 34, canvas.width + 40, y - 22);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(27, 106, 100, 0.12)';
  ctx.lineWidth = 2;
  for (let x = -70; x < canvas.width + 90; x += 78) {
    ctx.beginPath();
    ctx.moveTo(x, -20);
    ctx.bezierCurveTo(x + 120, 160, x - 90, 350, x + 140, canvas.height + 30);
    ctx.stroke();
  }

  ctx.save();
  ctx.setLineDash([18, 13]);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(101, 74, 28, 0.20)';
  ctx.lineWidth = 5;
  [
    [[-24, 248], [122, 197, 236, 277, 366, 217], [506, 154, 612, 232, 714, 184], [810, 138, 916, 174, 1048, 120]],
    [[424, -20], [500, 92, 444, 198, 548, 292], [646, 382, 586, 478, 742, 676]],
    [[138, 636], [226, 512, 336, 564, 430, 452], [526, 336, 636, 408, 760, 314], [862, 236, 930, 284, 1050, 226]]
  ].forEach((path) => {
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let index = 1; index < path.length; index += 1) {
      const segment = path[index];
      ctx.bezierCurveTo(segment[0], segment[1], segment[2], segment[3], segment[4], segment[5]);
    }
    ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.50)';
  ctx.lineWidth = 3;
  [
    [[-24, 248], [122, 197, 236, 277, 366, 217], [506, 154, 612, 232, 714, 184], [810, 138, 916, 174, 1048, 120]],
    [[424, -20], [500, 92, 444, 198, 548, 292], [646, 382, 586, 478, 742, 676]],
    [[138, 636], [226, 512, 336, 564, 430, 452], [526, 336, 636, 408, 760, 314], [862, 236, 930, 284, 1050, 226]]
  ].forEach((path) => {
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let index = 1; index < path.length; index += 1) {
      const segment = path[index];
      ctx.bezierCurveTo(segment[0], segment[1], segment[2], segment[3], segment[4], segment[5]);
    }
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.08)';
  ctx.lineWidth = 2;
  for (let y = 34; y < canvas.height; y += 34) {
    drawLedgerTick(ctx, 42, y, 270, 0.11);
    drawLedgerTick(ctx, 676, y + 10, 250, 0.09);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.72;
  drawPlanWagonCue(ctx, 170, 436, 0.86);
  drawSignalMast(ctx, 780, 180, 0.84, 'rgba(27, 106, 100, 0.58)');
  drawSignalMast(ctx, 332, 222, 0.58, 'rgba(101, 74, 28, 0.52)');
  ctx.restore();

  ctx.strokeStyle = 'rgba(101, 74, 28, 0.18)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
  ctx.setLineDash([]);

  const vignette = ctx.createRadialGradient(canvas.width * 0.48, canvas.height * 0.46, 80, canvas.width * 0.48, canvas.height * 0.46, 590);
  vignette.addColorStop(0, 'rgba(255, 248, 232, 0.12)');
  vignette.addColorStop(0.74, 'rgba(255, 248, 232, 0)');
  vignette.addColorStop(1, 'rgba(46, 27, 14, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function expeditionContinuousUnderlayFrame(layout = {}) {
  const bounds = layout.bounds || { minX: -1, maxX: 1, minY: -1, maxY: 1, centerX: 0, centerY: 0, width: 2, height: 2 };
  const pad = EXPEDITION_REGION_RADIUS * 1.72;
  const minX = bounds.minX - pad;
  const maxX = bounds.maxX + pad;
  const minY = bounds.minY - pad;
  const maxY = bounds.maxY + pad;
  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: Math.max(0.01, maxX - minX),
    height: Math.max(0.01, maxY - minY)
  };
}

function expeditionContinuousUnderlayPoint(position = { x: 0, y: 0 }, frame, canvas) {
  return {
    x: ((position.x - frame.minX) / Math.max(0.01, frame.width)) * canvas.width,
    y: canvas.height - (((position.y - frame.minY) / Math.max(0.01, frame.height)) * canvas.height)
  };
}

function expeditionContinuousUnderlayStyle(cell = {}, terrain = expeditionCellTerrain(cell)) {
  const fogState = String(cell.fogState || 'locked_unknown');
  if (!cellExposesRegionTruth(cell)) {
    return fogState === 'hinted'
      ? {
          terrain: 'hinted',
          fill: 'rgba(224, 150, 52, 0.46)',
          mid: 'rgba(245, 212, 132, 0.32)',
          edge: 'rgba(255, 248, 232, 0)',
          contour: 'rgba(101, 74, 28, 0.18)',
          bridge: 'rgba(214, 148, 58, 0.20)',
          fogOnly: true
        }
      : {
          terrain: 'locked_unknown',
          fill: 'rgba(157, 150, 132, 0.30)',
          mid: 'rgba(104, 96, 82, 0.20)',
          edge: 'rgba(255, 248, 232, 0)',
          contour: 'rgba(255, 248, 232, 0.13)',
          bridge: 'rgba(134, 126, 111, 0.14)',
          fogOnly: true
        };
  }
  if (terrain === 'forest') {
    return {
      terrain,
      fill: 'rgba(42, 126, 86, 0.46)',
      mid: 'rgba(35, 145, 123, 0.26)',
      edge: 'rgba(255, 248, 232, 0)',
      contour: 'rgba(23, 80, 64, 0.20)',
      bridge: 'rgba(43, 126, 91, 0.24)',
      fogOnly: false
    };
  }
  if (terrain === 'ridge' || terrain === 'ruin_signal') {
    return {
      terrain,
      fill: 'rgba(118, 104, 85, 0.42)',
      mid: 'rgba(194, 176, 128, 0.24)',
      edge: 'rgba(255, 248, 232, 0)',
      contour: 'rgba(68, 57, 46, 0.20)',
      bridge: 'rgba(129, 111, 82, 0.22)',
      fogOnly: false
    };
  }
  if (terrain === 'water') {
    return {
      terrain,
      fill: 'rgba(63, 143, 166, 0.42)',
      mid: 'rgba(123, 196, 207, 0.26)',
      edge: 'rgba(255, 248, 232, 0)',
      contour: 'rgba(35, 95, 126, 0.18)',
      bridge: 'rgba(67, 148, 169, 0.22)',
      fogOnly: false
    };
  }
  if (terrain === 'settled') {
    return {
      terrain,
      fill: 'rgba(214, 181, 102, 0.44)',
      mid: 'rgba(73, 143, 128, 0.24)',
      edge: 'rgba(255, 248, 232, 0)',
      contour: 'rgba(101, 74, 28, 0.18)',
      bridge: 'rgba(196, 165, 94, 0.22)',
      fogOnly: false
    };
  }
  return {
    terrain,
    fill: 'rgba(121, 158, 90, 0.38)',
    mid: 'rgba(216, 209, 151, 0.22)',
    edge: 'rgba(255, 248, 232, 0)',
    contour: 'rgba(68, 91, 63, 0.17)',
    bridge: 'rgba(124, 156, 97, 0.20)',
    fogOnly: false
  };
}

function drawExpeditionContinuousUnderlayBridge(ctx, start, end, style, seed = 0) {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const lift = 22 + (seed * 26);
  ctx.save();
  ctx.filter = 'blur(13px)';
  ctx.lineCap = 'round';
  ctx.strokeStyle = style.bridge;
  ctx.lineWidth = 104;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(midX, midY - lift, end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

function drawExpeditionContinuousUnderlayBlob(ctx, point, radius, style, seed = 0) {
  ctx.save();
  const gradient = ctx.createRadialGradient(point.x - radius * 0.22, point.y - radius * 0.24, radius * 0.08, point.x, point.y, radius);
  gradient.addColorStop(0, style.fill);
  gradient.addColorStop(0.54, style.mid);
  gradient.addColorStop(1, style.edge);
  ctx.filter = 'blur(9px)';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate((seed - 0.5) * 0.26);
  ctx.scale(1.28, 0.82);
  ctx.strokeStyle = style.contour;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let index = -2; index <= 2; index += 1) {
    const y = index * radius * 0.18;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.78, y);
    ctx.bezierCurveTo(-radius * 0.34, y - (radius * 0.17), radius * 0.18, y + (radius * 0.16), radius * 0.76, y - (radius * 0.08));
    ctx.stroke();
  }
  if (style.fogOnly) {
    ctx.setLineDash([15, 13]);
    ctx.strokeStyle = style.terrain === 'locked_unknown' ? 'rgba(255, 248, 232, 0.14)' : 'rgba(101, 74, 28, 0.22)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.58, radius * 0.34, -0.08, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function makeExpeditionContinuousUnderlayTexture(cells = [], layout = expeditionLayout(cells)) {
  const promotedUnderlayImage = ensureExpeditionRegionTileImage(EXPEDITION_PROMOTED_UNDERLAY_ASSET);
  const terrainKey = cells.map((cell) => `${cell.cellId}:${cell.fogState}:${expeditionCellTerrain(cell)}:${cell.publicTerrainAssetSlot || ''}:${cell.fogAssetSlot || ''}`).join('|');
  const key = `expedition-continuous-underlay:${EXPEDITION_VISUAL_SHELL_VERSION}:${terrainKey}:${promotedUnderlayImage ? 'promoted-underlay-ready' : 'promoted-underlay-pending'}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  const frame = expeditionContinuousUnderlayFrame(layout);
  const points = new Map();
  for (const cell of cells) {
    const position = layout.positions.get(String(cell.cellId || ''));
    if (!position) continue;
    points.set(String(cell.cellId || ''), expeditionContinuousUnderlayPoint(position, frame, canvas));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 248, 232, 0.04)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (promotedUnderlayImage) {
    ctx.save();
    ctx.globalAlpha = 0.68;
    ctx.drawImage(promotedUnderlayImage, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = 'rgba(255, 248, 232, 0.70)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  for (let index = 0; index < cells.length; index += 1) {
    for (let next = index + 1; next < cells.length; next += 1) {
      const a = cells[index];
      const b = cells[next];
      if (!cellsAreAdjacent(a, b)) continue;
      const start = points.get(String(a.cellId || ''));
      const end = points.get(String(b.cellId || ''));
      if (!start || !end) continue;
      const aStyle = expeditionContinuousUnderlayStyle(a);
      const bStyle = expeditionContinuousUnderlayStyle(b);
      const bridgeStyle = (aStyle.terrain === 'locked_unknown' || bStyle.terrain === 'locked_unknown')
        ? { bridge: 'rgba(134, 126, 111, 0.12)' }
        : { bridge: aStyle.fogOnly ? aStyle.bridge : bStyle.fogOnly ? bStyle.bridge : 'rgba(75, 132, 105, 0.20)' };
      drawExpeditionContinuousUnderlayBridge(ctx, start, end, bridgeStyle, stableUnit(`${a.cellId}:${b.cellId}:underlay`));
    }
  }

  const radiusScale = Math.min(canvas.width / frame.width, canvas.height / frame.height);
  for (const cell of cells) {
    const point = points.get(String(cell.cellId || ''));
    if (!point) continue;
    const terrain = expeditionCellTerrain(cell);
    const style = expeditionContinuousUnderlayStyle(cell, terrain);
    const radius = radiusScale * EXPEDITION_REGION_RADIUS * (style.fogOnly ? 1.28 : 1.38);
    drawExpeditionContinuousUnderlayBlob(ctx, point, radius, style, stableUnit(`${cell.cellId}:${terrain}:underlay`));
  }

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.06)';
  ctx.lineWidth = 2;
  for (let y = 42; y < canvas.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(-40, y);
    ctx.bezierCurveTo(150, y - 24, 298, y + 28, 482, y - 8);
    ctx.bezierCurveTo(648, y - 42, 818, y + 22, canvas.width + 40, y - 16);
    ctx.stroke();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeExpeditionCivicBeaconTexture() {
  const key = `expedition-civic-beacon:${EXPEDITION_VISUAL_SHELL_VERSION}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(128, 126, 16, 128, 126, 116);
  glow.addColorStop(0, 'rgba(245, 212, 132, 0.48)');
  glow.addColorStop(0.48, 'rgba(27, 106, 100, 0.18)');
  glow.addColorStop(1, 'rgba(255, 248, 232, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(46, 27, 14, 0.42)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 174);
  ctx.lineTo(128, 80);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(27, 106, 100, 0.42)';
  ctx.lineWidth = 5;
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.arc(128, 83, 30 + (index * 22), -0.78, 0.78);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(245, 212, 132, 0.86)';
  ctx.strokeStyle = 'rgba(46, 27, 14, 0.44)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(136, 76);
  ctx.lineTo(188, 94);
  ctx.lineTo(136, 116);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 248, 232, 0.54)';
  ctx.beginPath();
  ctx.roundRect(91, 174, 74, 25, 8);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function makeExpeditionCellGroup(cell = {}, position = { x: 0, y: 0 }, selected = false, hovered = false) {
  const style = expeditionFogStyle(cell, selected);
  const fogState = String(cell.fogState || '');
  const terrain = expeditionCellTerrain(cell);
  const group = new THREE.Group();
  group.position.set(position.x, position.y, 0);
  const regionRadius = EXPEDITION_REGION_RADIUS * (selected ? 1.04 : hovered ? 1.02 : 1);
  const regionPlate = new THREE.Mesh(
    expeditionHexTexturedGeometry(regionRadius),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: makeExpeditionCellTexture(cell, selected),
      transparent: true,
      opacity: expeditionRegionPlateOpacity(fogState, selected, hovered),
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  regionPlate.position.z = -0.10;
  regionPlate.userData = {
    kind: 'expedition_cell',
    cellId: String(cell.cellId || ''),
    fogState: String(cell.fogState || ''),
    terrain,
    regionPlate: true,
    waterCue: terrain === 'water',
    status: String(cell.status || ''),
    title: String(cell.title || ''),
    selected,
    hovered
  };
  group.add(regionPlate);

  const regionLine = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(expeditionHexPoints(regionRadius * 1.01)),
    new THREE.LineBasicMaterial({
      color: selected ? style.rim : style.line,
      transparent: true,
      opacity: expeditionRegionLineOpacity(fogState, selected, hovered)
    })
  );
  regionLine.position.z = -0.04;
  group.add(regionLine);

  const shadow = new THREE.Mesh(
    expeditionHexGeometry(EXPEDITION_CELL_RADIUS * 1.16),
    new THREE.MeshBasicMaterial({
      color: style.shadow,
      transparent: true,
      opacity: selected ? 0.18 : 0.08,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  shadow.position.set(0.08, -0.09, -0.01);
  group.add(shadow);

  const fill = new THREE.Mesh(
    expeditionHexTexturedGeometry(EXPEDITION_CELL_RADIUS),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: makeExpeditionCellTexture(cell, selected),
      transparent: true,
      opacity: expeditionCorePlateOpacity(style, fogState, selected, hovered),
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  fill.position.z = 0.02;
  fill.userData = {
    kind: 'expedition_cell',
    cellId: String(cell.cellId || ''),
    fogState: String(cell.fogState || ''),
    terrain,
    waterCue: terrain === 'water',
    status: String(cell.status || ''),
    title: String(cell.title || ''),
    selected,
    hovered
  };
  group.add(fill);

  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(expeditionHexPoints(EXPEDITION_CELL_RADIUS * (selected ? 1.08 : 1))),
    new THREE.LineBasicMaterial({
      color: style.line,
      transparent: true,
      opacity: expeditionCoreLineOpacity(style, fogState, selected, hovered)
    })
  );
  line.position.z = 0.08;
  group.add(line);

  if (selected) {
    const halo = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(expeditionHexPoints(regionRadius * 1.08)),
      new THREE.LineBasicMaterial({ color: style.rim, transparent: true, opacity: 0.82 })
    );
    halo.position.z = 0.16;
    group.add(halo);
  }

  if (hovered && !selected) {
    const hoverRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(expeditionHexPoints(regionRadius * 1.04)),
      new THREE.LineBasicMaterial({ color: 0xfff8e8, transparent: true, opacity: 0.70 })
    );
    hoverRing.position.z = 0.15;
    group.add(hoverRing);
  }

  if (fogState === 'discovered' && terrain === 'settled') {
    const homeRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(expeditionHexPoints(regionRadius * 1.14)),
      new THREE.LineBasicMaterial({ color: 0xfff4c4, transparent: true, opacity: 0.44 })
    );
    homeRing.position.z = 0.14;
    group.add(homeRing);
    const homeGlow = new THREE.Mesh(
      expeditionHexGeometry(regionRadius * 1.02),
      new THREE.MeshBasicMaterial({ color: 0xfff4c4, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })
    );
    homeGlow.position.z = 0.07;
    group.add(homeGlow);
  }

  if (fogState === 'locked_unknown') {
    const stripe = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.32, -0.30, 0.10), new THREE.Vector3(0.32, 0.30, 0.10),
        new THREE.Vector3(-0.34, 0.02, 0.10), new THREE.Vector3(0.12, 0.46, 0.10),
        new THREE.Vector3(-0.10, -0.46, 0.10), new THREE.Vector3(0.34, -0.02, 0.10)
      ]),
      new THREE.LineBasicMaterial({ color: 0xfff8e8, transparent: true, opacity: 0.16 })
    );
    group.add(stripe);
  }

  if (fogState === 'hinted' && String(cell.kind || '') === 'frontier_hint') {
    const scoutLine = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(expeditionHexPoints(regionRadius * 1.03)),
      new THREE.LineBasicMaterial({ color: 0x1b6a64, transparent: true, opacity: 0.64 })
    );
    scoutLine.position.z = 0.12;
    group.add(scoutLine);
  }

  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeExpeditionMarkerTexture(cell, selected),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    alphaTest: 0.03
  }));
  marker.position.set(0, selected ? 0.03 : -0.01, 0.20);
  marker.scale.set(selected ? 0.72 : 0.54, selected ? 0.72 : 0.54, 1);
  group.add(marker);
  return group;
}

function cellsAreAdjacent(a = {}, b = {}) {
  const aq = number(a.q, 0);
  const ar = number(a.r, 0);
  const bq = number(b.q, 0);
  const br = number(b.r, 0);
  const dq = aq - bq;
  const dr = ar - br;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === 1;
}

function expeditionSurveyStrokeStyle(a = {}, b = {}) {
  const states = [String(a.fogState || ''), String(b.fogState || '')];
  if (states.includes('locked_unknown')) return null;
  if (states.includes('hinted')) return { color: 0x8a6d41, glow: 0xf5d484, opacity: 0.34, dash: [0.16, 0.16] };
  return { color: 0x1b6a64, glow: 0xf5d484, opacity: 0.50, dash: [0.18, 0.13] };
}

function makeExpeditionSurveyStroke(a, b, layout) {
  const style = expeditionSurveyStrokeStyle(a, b);
  if (!style) return null;
  const start = layout.positions.get(String(a.cellId || ''));
  const end = layout.positions.get(String(b.cellId || ''));
  if (!start || !end) return null;
  const mid = new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2, -0.20);
  const lift = 0.08 + stableUnit(`${a.cellId}:${b.cellId}`) * 0.10;
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(start.x, start.y, -0.20),
    new THREE.Vector3(mid.x, mid.y + lift, -0.20),
    new THREE.Vector3(end.x, end.y, -0.20)
  );
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
  const line = new THREE.Line(
    geometry,
    new THREE.LineDashedMaterial({
      color: style.color,
      transparent: true,
      opacity: style.opacity,
      dashSize: style.dash[0],
      gapSize: style.dash[1]
    })
  );
  line.computeLineDistances();
  line.userData = { kind: 'expedition_receipt_trace', routeAuthority: false, visualOnly: true };
  const glow = new THREE.Line(
    geometry.clone(),
    new THREE.LineBasicMaterial({ color: style.glow, transparent: true, opacity: 0.14 })
  );
  glow.position.z = -0.02;
  glow.userData = { kind: 'expedition_receipt_trace_glow', routeAuthority: false, visualOnly: true };
  const group = new THREE.Group();
  group.add(glow, line);
  group.userData = { kind: 'expedition_receipt_trace_group', routeAuthority: false, visualOnly: true };
  return group;
}

function expeditionUnitStyle(unit = {}) {
  switch (String(unit.unitType || unit.role || '').toLowerCase()) {
    case 'scout':
      return { fill: '#1f756e', stroke: '#102f2f', accent: '#d6f1ef', glow: '#f5d484', glyph: 'compass' };
    case 'courier':
      return { fill: '#b95368', stroke: '#4f202b', accent: '#fff0bd', glow: '#78a9d6', glyph: 'flag' };
    case 'surveyor':
      return { fill: '#7a6540', stroke: '#342719', accent: '#d6f1ef', glow: '#82d6d0', glyph: 'tripod' };
    case 'settler_convoy':
      return { fill: '#c4883a', stroke: '#5a3418', accent: '#fff8e8', glow: '#f5d484', glyph: 'wagon' };
    case 'outpost_crew':
      return { fill: '#637f58', stroke: '#223a25', accent: '#ffe4a0', glow: '#82d6d0', glyph: 'beacon' };
    default:
      return { fill: '#8a6d41', stroke: '#3b2513', accent: '#fff8e8', glow: '#82d6d0', glyph: 'ledger' };
  }
}

function makeExpeditionUnitTexture(unit = {}, selected = false) {
  const key = `expedition-unit:${EXPEDITION_VISUAL_SHELL_VERSION}:${unit.unitType}:${unit.unitId}:${selected ? 'selected' : 'idle'}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const style = expeditionUnitStyle(unit);
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(46, 27, 14, 0.24)';
  ctx.beginPath();
  ctx.ellipse(96, 146, 55, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = selected ? 'rgba(245, 212, 132, 0.34)' : 'rgba(255, 248, 232, 0.20)';
  ctx.strokeStyle = selected ? '#f5d484' : 'rgba(59, 37, 19, 0.55)';
  ctx.lineWidth = selected ? 9 : 6;
  ctx.beginPath();
  ctx.roundRect(38, 30, 116, 116, 34);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = style.fill;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(96, 88, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = style.accent;
  ctx.fillStyle = style.accent;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (style.glyph === 'compass') {
    ctx.beginPath();
    ctx.arc(96, 88, 24, 0, Math.PI * 2);
    ctx.moveTo(96, 52);
    ctx.lineTo(96, 66);
    ctx.moveTo(96, 110);
    ctx.lineTo(96, 124);
    ctx.moveTo(60, 88);
    ctx.lineTo(74, 88);
    ctx.moveTo(118, 88);
    ctx.lineTo(132, 88);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(96, 58);
    ctx.lineTo(108, 92);
    ctx.lineTo(84, 118);
    ctx.closePath();
    ctx.fill();
  } else if (style.glyph === 'flag') {
    ctx.beginPath();
    ctx.moveTo(80, 122);
    ctx.lineTo(80, 56);
    ctx.lineTo(124, 68);
    ctx.lineTo(80, 84);
    ctx.stroke();
  } else if (style.glyph === 'wagon') {
    ctx.beginPath();
    ctx.roundRect(66, 80, 60, 34, 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(78, 124, 9, 0, Math.PI * 2);
    ctx.arc(116, 124, 9, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style.glyph === 'beacon') {
    ctx.beginPath();
    ctx.moveTo(72, 124);
    ctx.lineTo(96, 58);
    ctx.lineTo(120, 124);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(96, 62, 15, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.glyph === 'tripod') {
    ctx.beginPath();
    ctx.moveTo(96, 58);
    ctx.lineTo(96, 92);
    ctx.moveTo(96, 92);
    ctx.lineTo(70, 126);
    ctx.moveTo(96, 92);
    ctx.lineTo(122, 126);
    ctx.moveTo(76, 70);
    ctx.lineTo(116, 70);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(96, 56, 13, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(68, 62, 56, 60, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(80, 82);
    ctx.lineTo(112, 82);
    ctx.moveTo(80, 100);
    ctx.lineTo(106, 100);
    ctx.stroke();
  }

  drawExpeditionGeneratedSprite(ctx, expeditionUnitSpriteAsset(unit), 28, 22, 136, 136, 34);

  ctx.fillStyle = style.glow;
  ctx.globalAlpha = selected ? 0.80 : 0.46;
  ctx.beginPath();
  ctx.arc(136, 47, selected ? 8 : 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function detailFromExpeditionUnit(object, source = 'expedition-three-raycast') {
  const data = object?.userData || {};
  return {
    unitId: String(data.unitId || ''),
    unitType: String(data.unitType || ''),
    displayName: String(data.displayName || ''),
    cellId: String(data.cellId || ''),
    source,
    atMs: Date.now()
  };
}

function detailFromExpeditionMarker(object, source = 'expedition-three-raycast') {
  const data = object?.userData || {};
  return {
    markerKind: String(data.kind || ''),
    packetId: String(data.packetId || ''),
    mode: String(data.mode || ''),
    cellId: String(data.cellId || data.targetCellId || ''),
    targetCellId: String(data.targetCellId || data.cellId || ''),
    visualOnly: data.visualOnly === true,
    readOnly: data.readOnly === true,
    source,
    atMs: Date.now()
  };
}

function detailFromExpeditionCommandTarget(object, source = 'expedition-three-raycast') {
  const data = object?.userData || {};
  return {
    unitId: String(data.unitId || ''),
    unitType: String(data.unitType || ''),
    commandId: String(data.commandId || ''),
    cellId: String(data.cellId || ''),
    targetCellId: String(data.cellId || ''),
    fogState: String(data.fogState || ''),
    serverMutationImplemented: data.serverMutationImplemented === true,
    movementMutation: data.movementMutation === true,
    visualOnly: data.visualOnly === true,
    readOnly: data.readOnly === true,
    previewOnly: data.previewOnly === true,
    source,
    atMs: Date.now()
  };
}

function expeditionCommandTargetStyle(commandId = '') {
  switch (String(commandId || '')) {
    case 'move_unit':
      return { stroke: '#1b6a64', fill: 'rgba(130, 214, 208, 0.18)', glyph: 'move' };
    case 'scout_sector':
      return { stroke: '#d19a48', fill: 'rgba(245, 212, 132, 0.20)', glyph: 'scout' };
    case 'prepare_settler_convoy':
      return { stroke: '#c4883a', fill: 'rgba(255, 226, 128, 0.18)', glyph: 'convoy' };
    case 'found_settlement':
      return { stroke: '#637f58', fill: 'rgba(130, 214, 208, 0.16)', glyph: 'outpost' };
    default:
      return { stroke: '#8a6d41', fill: 'rgba(255, 248, 232, 0.16)', glyph: 'inspect' };
  }
}

function makeExpeditionCommandTargetTexture(target = {}) {
  const commandId = String(target.commandId || 'inspect');
  const fogState = String(target.fogState || '');
  const key = `expedition-command-target:${EXPEDITION_VISUAL_SHELL_VERSION}:${commandId}:${fogState}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const style = expeditionCommandTargetStyle(commandId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = style.fill;
  ctx.beginPath();
  ctx.arc(128, 128, 106, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = commandId === 'scout_sector' ? 10 : 8;
  if (commandId === 'scout_sector') ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.arc(128, 128, 98, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(255, 248, 232, 0.72)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 128, 80, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(46, 27, 14, 0.24)';
  ctx.beginPath();
  ctx.ellipse(128, 210, 54, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = style.stroke;
  ctx.fillStyle = '#fff8e8';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (style.glyph === 'move') {
    ctx.beginPath();
    ctx.moveTo(86, 128);
    ctx.lineTo(164, 128);
    ctx.moveTo(140, 104);
    ctx.lineTo(164, 128);
    ctx.lineTo(140, 152);
    ctx.stroke();
  } else if (style.glyph === 'scout') {
    ctx.beginPath();
    ctx.arc(128, 128, 30, 0, Math.PI * 2);
    ctx.moveTo(128, 78);
    ctx.lineTo(128, 98);
    ctx.moveTo(128, 158);
    ctx.lineTo(128, 178);
    ctx.moveTo(78, 128);
    ctx.lineTo(98, 128);
    ctx.moveTo(158, 128);
    ctx.lineTo(178, 128);
    ctx.stroke();
  } else if (style.glyph === 'convoy') {
    ctx.beginPath();
    ctx.roundRect(88, 112, 80, 38, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(104, 164, 10, 0, Math.PI * 2);
    ctx.arc(152, 164, 10, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style.glyph === 'outpost') {
    ctx.beginPath();
    ctx.moveTo(96, 174);
    ctx.lineTo(128, 82);
    ctx.lineTo(160, 174);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(128, 84, 18, 0, Math.PI * 2);
    ctx.fillStyle = style.stroke;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(96, 88, 64, 78, 10);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
}

function expeditionCommandTargetsForUnit(unit = {}, cellsById = new Map()) {
  if (!unit?.unitId) return [];
  const targets = new Map();
  const addTarget = (command = {}, cellId = '', source = '') => {
    const commandId = String(command.commandId || source || '');
    const safeCellId = String(cellId || '').trim();
    if (!commandId || !safeCellId) return;
    const cell = cellsById.get(safeCellId);
    if (!cell) return;
    const fogState = String(cell.fogState || '');
    if (commandId === 'scout_sector') {
      if (!(fogState === 'hinted' && String(cell.kind || '') === 'frontier_hint')) return;
    } else if (!['discovered', 'known'].includes(fogState)) {
      return;
    }
    const key = `${commandId}:${safeCellId}`;
    if (targets.has(key)) return;
    targets.set(key, {
      unitId: String(unit.unitId || ''),
      unitType: String(unit.unitType || ''),
      commandId,
      cellId: safeCellId,
      fogState,
      serverMutationImplemented: command.serverMutationImplemented === true || (commandId === 'move_unit' && unit.movement?.movementMutationImplemented === true),
      movementMutation: commandId === 'move_unit',
      routeAuthority: false,
      actionAuthority: false,
      visualOnly: true,
      readOnly: true,
      source
    });
  };

  const commandHints = Array.isArray(unit.commandHints) ? unit.commandHints : [];
  commandHints
    .filter((command) => command && command.enabled !== false)
    .forEach((command) => {
      const commandId = String(command.commandId || '');
      const targetCellIds = Array.isArray(command.targetCellIds)
        ? command.targetCellIds.map((cellId) => String(cellId || '')).filter(Boolean)
        : [];
      if (commandId === 'move_unit') {
        const movementTargets = Array.isArray(unit.movement?.allowedTargetCellIds)
          ? unit.movement.allowedTargetCellIds.map((cellId) => String(cellId || '')).filter(Boolean)
          : [];
        [...new Set([...targetCellIds, ...movementTargets])].forEach((cellId) => addTarget(command, cellId, 'movement'));
        return;
      }
      targetCellIds.forEach((cellId) => addTarget(command, cellId, 'command_hint'));
    });
  return Array.from(targets.values());
}

function detailFromExpeditionCell(object, source = 'expedition-three-raycast') {
  const data = object?.userData || {};
  return {
    cellId: String(data.cellId || ''),
    fogState: String(data.fogState || ''),
    status: String(data.status || ''),
    title: String(data.title || ''),
    source,
    atMs: Date.now()
  };
}

class ExpeditionMapThreeStage {
  constructor(hostNode) {
    this.hostNode = hostNode;
    this.model = {};
    this.cells = [];
    this.info = {};
    this.pickables = [];
    this.cellMeshes = [];
    this.unitSprites = [];
    this.commandTargetSprites = [];
    this.eventMarkerSprites = [];
    this.objectiveMarkerSprites = [];
    this.hoverCellId = '';
    this.terrainUnderlayCount = 0;
    this.surveyStrokeCount = 0;
    this.markerCount = 0;
    this.unitTokenCount = 0;
    this.commandTargetCount = 0;
    this.eventMarkerCount = 0;
    this.objectiveMarkerCount = 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-EXPEDITION_WORLD_WIDTH / 2, EXPEDITION_WORLD_WIDTH / 2, EXPEDITION_WORLD_HEIGHT / 2, -EXPEDITION_WORLD_HEIGHT / 2, 0.1, 100);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setClearColor(0xd7eddf, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.className = 'fp-expedition-three-canvas';
    this.renderer.domElement.dataset.testid = 'fp-expedition-three-canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Zoomable private Expedition Map');
    this.dragging = false;
    this.dragMoved = false;
    this.lastPointer = null;
    this.activePointers = new Map();
    this.pinchDistance = 0;
    this.pinchZoom = 1;
    this.mapBounds = { minX: -1, maxX: 1, minY: -1, maxY: 1, centerX: 0, centerY: 0, width: 2, height: 2 };
    this.onResize = this.onResize.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onRegionTileAssetLoaded = () => {
      textureCache.clear();
      this.rebuild();
      this.render();
    };
    this.disposeRegionTileAssetListener = onExpeditionRegionTileAssetChange(this.onRegionTileAssetLoaded);
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.attach();
  }

  attach() {
    if (this.renderer.domElement.parentElement !== this.hostNode) {
      this.hostNode.appendChild(this.renderer.domElement);
    }
    this.hostNode.addEventListener('wheel', this.onWheel, { passive: false });
    this.hostNode.addEventListener('pointerdown', this.onPointerDown);
    this.hostNode.addEventListener('pointermove', this.onPointerMove);
    this.hostNode.addEventListener('pointerup', this.onPointerUp);
    this.hostNode.addEventListener('pointercancel', this.onPointerUp);
    this.hostNode.addEventListener('pointerleave', this.onPointerLeave);
    this.resizeObserver.observe(this.hostNode);
    this.onResize();
  }

  dispose() {
    this.hostNode.removeEventListener('wheel', this.onWheel);
    this.hostNode.removeEventListener('pointerdown', this.onPointerDown);
    this.hostNode.removeEventListener('pointermove', this.onPointerMove);
    this.hostNode.removeEventListener('pointerup', this.onPointerUp);
    this.hostNode.removeEventListener('pointercancel', this.onPointerUp);
    this.hostNode.removeEventListener('pointerleave', this.onPointerLeave);
    if (this.disposeRegionTileAssetListener) this.disposeRegionTileAssetListener();
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
        if (node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of materials) {
            material.dispose();
          }
        }
      });
    });
    this.pickables = [];
    this.cellMeshes = [];
    this.unitSprites = [];
    this.commandTargetSprites = [];
    this.eventMarkerSprites = [];
    this.objectiveMarkerSprites = [];
    this.terrainUnderlayCount = 0;
    this.surveyStrokeCount = 0;
    this.markerCount = 0;
    this.unitTokenCount = 0;
    this.commandTargetCount = 0;
    this.eventMarkerCount = 0;
    this.objectiveMarkerCount = 0;
    this.edgeFogCount = 0;
    this.civicBeaconCount = 0;
  }

  onResize() {
    const rect = this.hostNode.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const target = EXPEDITION_WORLD_WIDTH / EXPEDITION_WORLD_HEIGHT;
    if (aspect >= target) {
      const visibleWidth = EXPEDITION_WORLD_HEIGHT * aspect;
      this.camera.left = visibleWidth / -2;
      this.camera.right = visibleWidth / 2;
      this.camera.top = EXPEDITION_WORLD_HEIGHT / 2;
      this.camera.bottom = EXPEDITION_WORLD_HEIGHT / -2;
    } else {
      const visibleHeight = EXPEDITION_WORLD_WIDTH / aspect;
      this.camera.left = EXPEDITION_WORLD_WIDTH / -2;
      this.camera.right = EXPEDITION_WORLD_WIDTH / 2;
      this.camera.top = visibleHeight / 2;
      this.camera.bottom = visibleHeight / -2;
    }
    this.applyCameraBounds();
    this.render();
  }

  sync(model = {}, selectedCellId = '', selectedUnitId = '') {
    this.model = model && typeof model === 'object' ? model : {};
    this.cells = Array.isArray(this.model.cells) ? this.model.cells.filter((cell) => cell?.cellId) : [];
    this.selectedCellId = String(selectedCellId || this.selectedCellId || this.cells[0]?.cellId || '');
    const units = Array.isArray(this.model.units?.items) ? this.model.units.items.filter((unit) => unit?.unitId) : [];
    this.selectedUnitId = String(selectedUnitId || this.selectedUnitId || units[0]?.unitId || '');
    this.rebuild();
    this.applyCameraBounds();
    this.render();
    return this.info;
  }

  rebuild() {
    this.clearScene();
    const layout = expeditionLayout(this.cells);
    this.mapBounds = layout.bounds;

    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(EXPEDITION_WORLD_WIDTH * 1.35, EXPEDITION_WORLD_HEIGHT * 1.35),
      new THREE.MeshBasicMaterial({ map: makeExpeditionMapTexture(), transparent: false })
    );
    bg.position.set(0, 0, -0.8);
    this.scene.add(bg);

    this.terrainUnderlayCount = 0;
    const underlayFrame = expeditionContinuousUnderlayFrame(layout);
    const terrainUnderlay = new THREE.Mesh(
      new THREE.PlaneGeometry(underlayFrame.width, underlayFrame.height),
      new THREE.MeshBasicMaterial({
        map: makeExpeditionContinuousUnderlayTexture(this.cells, layout),
        transparent: true,
        opacity: 0.94,
        depthWrite: false
      })
    );
    terrainUnderlay.position.set(underlayFrame.centerX, underlayFrame.centerY, -0.62);
    terrainUnderlay.userData = {
      kind: 'expedition_continuous_terrain_underlay',
      visualOnly: true,
      serverOwnedCellsOnly: true,
      hiddenTruthLeakage: false
    };
    this.terrainUnderlayCount = 1;
    this.scene.add(terrainUnderlay);

    const extent = Math.max(EXPEDITION_WORLD_WIDTH, EXPEDITION_WORLD_HEIGHT);
    const gridPoints = [];
    for (let index = -6; index <= 6; index += 1) {
      const offset = index * 0.9;
      gridPoints.push(new THREE.Vector3(-extent, offset, -0.42), new THREE.Vector3(extent, offset, -0.42));
      gridPoints.push(new THREE.Vector3(offset, -extent, -0.42), new THREE.Vector3(offset, extent, -0.42));
    }
    const grid = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(gridPoints),
      new THREE.LineBasicMaterial({ color: 0x1b6a64, transparent: true, opacity: 0.10 })
    );
    this.scene.add(grid);

    this.edgeFogCount = 0;
    const edgeFogSpecs = [
      { x: this.mapBounds.centerX, y: this.mapBounds.maxY + 0.52, rotation: 0, width: this.mapBounds.width + 2.9, kind: 'soft' },
      { x: this.mapBounds.centerX, y: this.mapBounds.minY - 0.54, rotation: Math.PI, width: this.mapBounds.width + 2.7, kind: 'soft' },
      { x: this.mapBounds.minX - 0.56, y: this.mapBounds.centerY, rotation: Math.PI / 2, width: this.mapBounds.height + 2.5, kind: 'locked' },
      { x: this.mapBounds.maxX + 0.62, y: this.mapBounds.centerY, rotation: -Math.PI / 2, width: this.mapBounds.height + 2.5, kind: 'soft' }
    ];
    for (const spec of edgeFogSpecs) {
      const fog = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.width, 0.64),
        new THREE.MeshBasicMaterial({
          map: makeExpeditionEdgeFogTexture(spec.kind),
          transparent: true,
          opacity: spec.kind === 'locked' ? 0.54 : 0.42,
          depthWrite: false
        })
      );
      fog.position.set(spec.x, spec.y, -0.26);
      fog.rotation.z = spec.rotation;
      this.edgeFogCount += 1;
      this.scene.add(fog);
    }

    this.civicBeaconCount = 0;
    const beaconCells = this.cells
      .filter((cell) => ['discovered', 'known'].includes(String(cell.fogState || '')))
      .slice(0, 4);
    for (const cell of beaconCells) {
      const position = layout.positions.get(String(cell.cellId || ''));
      if (!position) continue;
      const beacon = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeExpeditionCivicBeaconTexture(),
        transparent: true,
        opacity: String(cell.kind || '') === 'origin_plot' ? 0.82 : 0.56,
        depthWrite: false
      }));
      beacon.position.set(position.x + 0.36, position.y + 0.28, 0.10);
      beacon.scale.set(0.62, 0.62, 1);
      beacon.userData = {
        kind: 'expedition_civic_beacon_cue',
        visualOnly: true,
        routeAuthority: false,
        cellId: String(cell.cellId || '')
      };
      this.civicBeaconCount += 1;
      this.scene.add(beacon);
    }

    this.surveyStrokeCount = 0;
    for (let index = 0; index < this.cells.length; index += 1) {
      for (let next = index + 1; next < this.cells.length; next += 1) {
        const a = this.cells[index];
        const b = this.cells[next];
        if (!cellsAreAdjacent(a, b)) continue;
        const stroke = makeExpeditionSurveyStroke(a, b, layout);
        if (!stroke) continue;
        this.surveyStrokeCount += 1;
        this.scene.add(stroke);
      }
    }

    const hiddenCells = this.cells.filter((cell) => !['discovered', 'known'].includes(String(cell.fogState || '')));
    for (const cell of hiddenCells) {
      const position = layout.positions.get(String(cell.cellId || ''));
      if (!position) continue;
      const fogState = String(cell.fogState || 'locked_unknown');
      const fog = new THREE.Mesh(
        new THREE.PlaneGeometry(
          fogState === 'locked_unknown' ? EXPEDITION_REGION_RADIUS * 2.06 : EXPEDITION_REGION_RADIUS * 1.86,
          fogState === 'locked_unknown' ? EXPEDITION_REGION_RADIUS * 2.06 : EXPEDITION_REGION_RADIUS * 1.86
        ),
        new THREE.MeshBasicMaterial({
          map: makeExpeditionFogTexture(fogState === 'locked_unknown' ? 'locked' : 'hinted'),
          transparent: true,
          opacity: fogState === 'locked_unknown' ? 0.34 : 0.42,
          depthWrite: false
        })
      );
      fog.position.set(position.x, position.y, 0.24);
      this.scene.add(fog);
    }

    this.markerCount = 0;
    for (const cell of this.cells) {
      const position = layout.positions.get(String(cell.cellId || '')) || { x: 0, y: 0 };
      const selected = String(cell.cellId || '') === this.selectedCellId;
      const hovered = String(cell.cellId || '') === this.hoverCellId;
      const group = makeExpeditionCellGroup(cell, position, selected, hovered);
      this.scene.add(group);
      group.traverse((node) => {
        if (node.userData?.kind === 'expedition_cell') {
          this.pickables.push(node);
          this.cellMeshes.push(node);
        }
      });
      this.markerCount += 1;
    }

    const cellsById = new Map(this.cells.map((cell) => [String(cell.cellId || ''), cell]));
    const objective = this.model.objective && typeof this.model.objective === 'object' ? this.model.objective : null;
    this.eventMarkerCount = 0;
    for (const packet of expeditionEventPacketsForMarkers(this.model)) {
      const cellId = expeditionPacketCellId(packet);
      const cell = cellsById.get(cellId);
      const fogState = String(cell?.fogState || '');
      if (!cell || !['discovered', 'known'].includes(fogState)) continue;
      const position = layout.positions.get(cellId);
      if (!position) continue;
      const selected = String(packet.packetId || '') === String(objective?.packetId || '')
        || String(cellId) === String(this.selectedCellId || '');
      const spriteAsset = EXPEDITION_MARKER_SPRITE_ASSETS.event_packet;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeExpeditionEventPacketMarkerTexture(packet, selected),
        transparent: true,
        depthWrite: false,
        depthTest: true,
        alphaTest: 0.03
      }));
      sprite.position.set(position.x - 0.36, position.y + 0.35, 0.47);
      sprite.scale.set(selected ? 0.48 : 0.40, selected ? 0.48 : 0.40, 1);
      sprite.userData = {
        kind: 'expedition_event_packet_marker',
        packetId: String(packet.packetId || ''),
        cellId,
        templateId: String(packet.templateId || packet.kind || ''),
        spriteAssetSlot: String(spriteAsset.slot || ''),
        spriteAssetPath: String(spriteAsset.path || ''),
        spriteAssetReady: !!expeditionRegionTileReady(spriteAsset),
        visualOnly: true,
        readOnly: true,
        selectable: true,
        inspectable: true,
        routeAuthority: false,
        actionAuthority: false,
        executableActions: 0
      };
      this.pickables.push(sprite);
      this.eventMarkerSprites.push(sprite);
      this.eventMarkerCount += 1;
      this.scene.add(sprite);
    }

    this.objectiveMarkerCount = 0;
    if (objective && String(objective.mode || 'read') !== 'read' && objective.targetCellId) {
      const targetCellId = String(objective.targetCellId || '');
      const targetCell = cellsById.get(targetCellId);
      const position = layout.positions.get(targetCellId);
      if (targetCell && position) {
        const selected = targetCellId === String(this.selectedCellId || '');
        const spriteAsset = String(objective.mode || '') === 'packet'
          ? EXPEDITION_MARKER_SPRITE_ASSETS.event_packet
          : EXPEDITION_MARKER_SPRITE_ASSETS.objective_beacon;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: makeExpeditionObjectiveMarkerTexture(objective, selected),
          transparent: true,
          depthWrite: false,
          depthTest: true,
          alphaTest: 0.03
        }));
        sprite.position.set(position.x + 0.38, position.y + 0.41, 0.50);
        sprite.scale.set(selected ? 0.56 : 0.48, selected ? 0.56 : 0.48, 1);
        sprite.userData = {
          kind: 'expedition_objective_marker',
          mode: String(objective.mode || ''),
          cellId: targetCellId,
          targetCellId,
          packetId: String(objective.packetId || ''),
          spriteAssetSlot: String(spriteAsset.slot || ''),
          spriteAssetPath: String(spriteAsset.path || ''),
          spriteAssetReady: !!expeditionRegionTileReady(spriteAsset),
          visualOnly: true,
          readOnly: true,
          selectable: true,
          inspectable: true,
          routeAuthority: false,
          actionAuthority: false,
          executableActions: 0
        };
        this.pickables.push(sprite);
        this.objectiveMarkerSprites.push(sprite);
        this.objectiveMarkerCount = 1;
        this.scene.add(sprite);
      }
    }

    const units = Array.isArray(this.model.units?.items) ? this.model.units.items.filter((unit) => unit?.unitId) : [];
    const selectedUnit = units.find((unit) => String(unit.unitId || '') === String(this.selectedUnitId || '')) || null;
    this.commandTargetCount = 0;
    for (const target of expeditionCommandTargetsForUnit(selectedUnit || {}, cellsById)) {
      const position = layout.positions.get(String(target.cellId || ''));
      if (!position) continue;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeExpeditionCommandTargetTexture(target),
        transparent: true,
        depthWrite: false,
        depthTest: true,
        alphaTest: 0.03,
        opacity: target.commandId === 'scout_sector' ? 0.92 : 0.84
      }));
      sprite.position.set(position.x, position.y + 0.05, 0.515);
      sprite.scale.set(target.commandId === 'scout_sector' ? 1.34 : 1.20, target.commandId === 'scout_sector' ? 1.34 : 1.20, 1);
      sprite.userData = {
        kind: 'expedition_command_target',
        unitId: target.unitId,
        unitType: target.unitType,
        commandId: target.commandId,
        cellId: target.cellId,
        fogState: target.fogState,
        serverMutationImplemented: target.serverMutationImplemented === true,
        movementMutation: target.movementMutation === true,
        visualOnly: true,
        readOnly: true,
        previewOnly: true,
        selectable: true,
        routeAuthority: false,
        actionAuthority: false,
        executableActions: 0
      };
      this.pickables.push(sprite);
      this.commandTargetSprites.push(sprite);
      this.commandTargetCount += 1;
      this.scene.add(sprite);
    }
    this.unitTokenCount = 0;
    const unitsByCell = units.reduce((acc, unit) => {
      const cellId = String(unit.location?.cellId || '');
      if (!cellId) return acc;
      if (!acc[cellId]) acc[cellId] = [];
      acc[cellId].push(unit);
      return acc;
    }, {});
    for (const [cellId, cellUnits] of Object.entries(unitsByCell)) {
      const position = layout.positions.get(cellId);
      if (!position) continue;
      cellUnits.forEach((unit, index) => {
        const selected = String(unit.unitId || '') === this.selectedUnitId;
        const spriteAsset = expeditionUnitSpriteAsset(unit);
        const spriteAssetReady = !!expeditionRegionTileReady(spriteAsset);
        const offsetAngle = ((index / Math.max(1, cellUnits.length)) * Math.PI * 2) - Math.PI / 2;
        const radius = cellUnits.length > 1 ? 0.26 : 0;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: makeExpeditionUnitTexture(unit, selected),
          transparent: true,
          depthWrite: false,
          depthTest: true,
          alphaTest: 0.03
        }));
        sprite.position.set(position.x + (Math.cos(offsetAngle) * radius), position.y + 0.44 + (Math.sin(offsetAngle) * radius * 0.36), 0.54 + (index * 0.01));
        const scale = selected ? 0.72 : 0.58;
        sprite.scale.set(scale, scale, 1);
        sprite.userData = {
          kind: 'expedition_unit',
          unitId: String(unit.unitId || ''),
          unitType: String(unit.unitType || ''),
          displayName: String(unit.displayName || ''),
          cellId,
          spriteAssetSlot: String(spriteAsset?.slot || ''),
          spriteAssetPath: String(spriteAsset?.path || ''),
          spriteAssetReady,
          selectable: unit.selectable !== false,
          readOnly: unit.readOnly !== false,
          movementMutationImplemented: unit.movement?.movementMutationImplemented === true
        };
        this.pickables.push(sprite);
        this.unitSprites.push(sprite);
        this.unitTokenCount += 1;
        this.scene.add(sprite);
      });
    }
    this.updateInfo();
  }

  visibleSize() {
    return {
      width: Math.max(0.01, (this.camera.right - this.camera.left) / this.camera.zoom),
      height: Math.max(0.01, (this.camera.top - this.camera.bottom) / this.camera.zoom)
    };
  }

  applyCameraBounds() {
    const margin = 0.85;
    const visible = this.visibleSize();
    const minX = this.mapBounds.minX - margin;
    const maxX = this.mapBounds.maxX + margin;
    const minY = this.mapBounds.minY - margin;
    const maxY = this.mapBounds.maxY + margin;
    const width = Math.max(0.01, maxX - minX);
    const height = Math.max(0.01, maxY - minY);
    this.camera.position.x = visible.width >= width
      ? (minX + maxX) / 2
      : clamp(this.camera.position.x, minX + (visible.width / 2), maxX - (visible.width / 2));
    this.camera.position.y = visible.height >= height
      ? (minY + maxY) / 2
      : clamp(this.camera.position.y, minY + (visible.height / 2), maxY - (visible.height / 2));
    this.camera.zoom = clamp(this.camera.zoom, 0.85, 3.4);
    this.camera.updateProjectionMatrix();
  }

  setZoom(nextZoom) {
    this.camera.zoom = clamp(nextZoom, 0.85, 3.4);
    this.applyCameraBounds();
    this.render();
    this.notifyViewChange();
  }

  resetView() {
    this.camera.zoom = 1;
    this.camera.position.x = this.mapBounds.centerX;
    this.camera.position.y = this.mapBounds.centerY;
    this.applyCameraBounds();
    this.render();
    this.notifyViewChange();
  }

  panBy(dx, dy) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const visible = this.visibleSize();
    this.camera.position.x -= (dx / Math.max(1, rect.width)) * visible.width;
    this.camera.position.y += (dy / Math.max(1, rect.height)) * visible.height;
    this.applyCameraBounds();
    this.render();
    this.notifyViewChange();
  }

  notifyViewChange() {
    this.hostNode.dispatchEvent(new CustomEvent('founders-plot-expedition-map-view-change'));
  }

  onWheel(event) {
    event.preventDefault();
    const multiplier = event.deltaY < 0 ? 1.13 : 1 / 1.13;
    this.setZoom(this.camera.zoom * multiplier);
  }

  onPointerDown(event) {
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try {
      this.hostNode.setPointerCapture?.(event.pointerId);
    } catch (_) {
      // Synthetic pointer proofs do not always create an active browser pointer.
    }
    this.dragging = true;
    this.dragMoved = false;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.hostNode.dataset.dragging = 'true';
    if (this.activePointers.size >= 2) {
      const points = Array.from(this.activePointers.values());
      this.pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      this.pinchZoom = this.camera.zoom;
    }
  }

  onPointerMove(event) {
    if (!this.activePointers.has(event.pointerId)) {
      this.setHoverFromPoint(event.clientX, event.clientY);
      return;
    }
    const previous = this.activePointers.get(event.pointerId);
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.activePointers.size >= 2) {
      const points = Array.from(this.activePointers.values());
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (this.pinchDistance > 0) this.setZoom(this.pinchZoom * (distance / this.pinchDistance));
      this.dragMoved = true;
      return;
    }
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) {
      this.dragMoved = this.dragMoved || Math.abs(event.clientX - (this.lastPointer?.x || event.clientX)) + Math.abs(event.clientY - (this.lastPointer?.y || event.clientY)) > 4;
      this.panBy(dx, dy);
    }
  }

  onPointerLeave() {
    this.setHoverCell('');
  }

  onPointerUp(event) {
    const wasClick = this.dragging && !this.dragMoved && this.activePointers.size <= 1;
    this.activePointers.delete(event.pointerId);
    try {
      this.hostNode.releasePointerCapture?.(event.pointerId);
    } catch (_) {
      // Ignore synthetic pointer releases that were never captured.
    }
    this.dragging = this.activePointers.size > 0;
    if (!this.dragging) {
      delete this.hostNode.dataset.dragging;
      this.pinchDistance = 0;
    }
    if (wasClick) {
      const hit = this.pickFromPoint(event.clientX, event.clientY);
      if (hit) {
        if (hit.userData?.kind === 'expedition_unit') {
          const detail = detailFromExpeditionUnit(hit);
          this.selectedUnitId = detail.unitId;
          if (detail.cellId) this.selectedCellId = detail.cellId;
          if (detail.cellId) this.setHoverCell(detail.cellId);
          window.dispatchEvent(new CustomEvent('founders-plot-expedition-unit-select', { detail }));
        } else if (['expedition_event_packet_marker', 'expedition_objective_marker'].includes(String(hit.userData?.kind || ''))) {
          const detail = detailFromExpeditionMarker(hit);
          if (detail.cellId) this.selectedCellId = detail.cellId;
          if (detail.cellId) this.setHoverCell(detail.cellId);
          window.dispatchEvent(new CustomEvent('founders-plot-expedition-map-select', { detail }));
        } else if (hit.userData?.kind === 'expedition_command_target') {
          const detail = detailFromExpeditionCommandTarget(hit);
          if (detail.cellId) this.selectedCellId = detail.cellId;
          if (detail.cellId) this.setHoverCell(detail.cellId);
          window.dispatchEvent(new CustomEvent('founders-plot-expedition-command-target-preview', { detail }));
        } else {
          const detail = detailFromExpeditionCell(hit);
          this.selectedCellId = detail.cellId;
          this.setHoverCell(detail.cellId);
          window.dispatchEvent(new CustomEvent('founders-plot-expedition-map-select', { detail }));
        }
      }
    }
  }

  setHoverFromPoint(clientX, clientY) {
    const hit = this.pickFromPoint(clientX, clientY);
    this.setHoverCell(hit?.userData?.cellId || hit?.userData?.targetCellId || '');
  }

  setHoverCell(cellId = '') {
    const nextCellId = String(cellId || '');
    if (nextCellId === this.hoverCellId) return;
    this.hoverCellId = nextCellId;
    if (nextCellId) this.hostNode.dataset.hoverCellId = nextCellId;
    else delete this.hostNode.dataset.hoverCellId;
    this.rebuild();
    this.render();
  }

  pickFromPoint(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    return hits[0]?.object || null;
  }

  canvasPointForCell(cellId) {
    const mesh = this.cellMeshes.find((entry) => String(entry.userData?.cellId || '') === String(cellId || ''));
    if (!mesh) return null;
    return this.canvasPointForObject(mesh);
  }

  canvasPointForObject(object) {
    if (!object) return null;
    const world = new THREE.Vector3();
    object.getWorldPosition(world);
    world.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: ((world.x + 1) / 2) * rect.width,
      y: ((-world.y + 1) / 2) * rect.height
    };
  }

  updateInfo() {
    const canvas = this.renderer.domElement;
    const regionVisuals = this.cells.map((cell) => {
      const fogState = String(cell.fogState || 'locked_unknown');
      const terrain = expeditionCellTerrain(cell);
      const publicTerrainText = expeditionPublicTerrainText(cell);
      const asset = expeditionRegionTileAssetForCell(cell, terrain);
      const assetImage = expeditionRegionTileReady(asset);
      const underlayStyle = expeditionContinuousUnderlayStyle(cell, terrain);
      const publicTerrainAssetSlot = serverPublicTerrainSlot(cell);
      const fogAssetSlot = !cellExposesRegionTruth(cell) ? serverFogAssetSlot(cell) : null;
      return {
        cellId: String(cell.cellId || ''),
        fogState,
        siteType: String(cell.siteType || ''),
        kind: String(cell.kind || ''),
        publicTerrainText,
        publicTerrainAssetSlot,
        publicTerrainAssetSlotSource: String(cell.publicTerrainAssetSlotSource || ''),
        publicTerrainAssetSlotReason: String(cell.publicTerrainAssetSlotReason || ''),
        fogAssetSlot,
        terrainAssetContractVersion: String(cell.terrainAssetContractVersion || ''),
        terrain,
        runtimeAssetPack: EXPEDITION_REGION_ASSET_PACK_VERSION,
        assetSlot: asset?.slot || null,
        assetPath: asset?.path || null,
        assetKind: asset?.assetKind || null,
        fogOnly: asset?.fogOnly === true,
        assetReady: !!assetImage,
        assetAllowedByServerTruth: expeditionRegionTileAssetAllowed(cell, terrain, asset),
        underlayTerrain: underlayStyle.terrain,
        underlayFogOnly: underlayStyle.fogOnly === true,
        waterCue: terrain === 'water',
        ruinSignalCue: terrain === 'ruin_signal',
        hiddenSpecificitySuppressed: !cellExposesRegionTruth(cell) && terrain === fogState
      };
    });
    const generatedSpriteAssets = Array.from(new Map([
      ...Object.values(EXPEDITION_UNIT_SPRITE_ASSETS),
      ...Object.values(EXPEDITION_MARKER_SPRITE_ASSETS)
    ].map((asset) => [asset.path, asset])).values());
    const generatedSpriteAssetReadyCount = generatedSpriteAssets
      .filter((asset) => !!ensureExpeditionRegionTileImage(asset))
      .length;
    this.info = {
      renderer: 'three.js',
      surface: 'expedition-map',
      projectionHash: String(this.model?.projectionHash || ''),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      cellCount: this.cells.length,
      selectedCellId: String(this.selectedCellId || ''),
      hoverCellId: String(this.hoverCellId || ''),
      zoom: Number(this.camera.zoom.toFixed(3)),
        visualShell: EXPEDITION_VISUAL_SHELL_VERSION,
        visualLayers: {
          terrainTexture: true,
          runtimeRegionAssetPack: EXPEDITION_REGION_ASSET_PACK_VERSION,
          runtimeRegionAtlas: `${EXPEDITION_PUBLIC_TERRAIN_ASSET_BASE}/manifest.json`,
          runtimeTerrainUnderlay: EXPEDITION_PROMOTED_UNDERLAY_ASSET.path,
          runtimeSpriteAssetPack: EXPEDITION_SPRITE_ASSET_PACK_VERSION,
          runtimeSpriteAtlas: `${EXPEDITION_SPRITE_ASSET_BASE}/manifest.json`,
          generatedSpriteAssets: true,
          generatedSpriteAssetCount: generatedSpriteAssets.length,
          generatedSpriteAssetsReady: generatedSpriteAssetReadyCount,
          generatedSpriteAssetsVisualOnly: true,
          generatedSpriteAssetsReadOnly: true,
          serverTerrainAssetContractVersion: EXPEDITION_PUBLIC_TERRAIN_CONTRACT_VERSION,
          serverTerrainSlotSource: EXPEDITION_PUBLIC_TERRAIN_SLOT_SOURCE,
          assetBackedRegionTiles: regionVisuals.filter((cell) => cell.assetPath).length,
          assetBackedLoadedTiles: regionVisuals.filter((cell) => cell.assetReady).length,
          assetBackedTerrainTextures: true,
          continuousTerrainUnderlay: true,
          continuousTerrainUnderlayVersion: EXPEDITION_VISUAL_SHELL_VERSION,
          continuousUnderlayUsesServerOwnedCells: true,
          continuousUnderlayHiddenCellsFogOnly: regionVisuals
            .filter((cell) => !['discovered', 'known'].includes(cell.fogState))
            .every((cell) => cell.underlayFogOnly && cell.underlayTerrain === cell.fogState),
          continuousUnderlayVisualOnly: true,
          plateBlendLayer: true,
          softRegionSeams: true,
          reducedPlateEdgeContrast: true,
          centerTileMutedForUnderlay: true,
          cartographicFogDepth: true,
          ambientContourField: true,
          fogDepthGlyphsVisualOnly: true,
          terrainUnderlayCount: this.terrainUnderlayCount,
          proceduralFallbackWhenAssetPending: true,
          candidate02Cues: true,
          agentTownIdentityCues: true,
          scoutLedgerHud: true,
        mapFirstHudOverlays: true,
        hoverAffordance: true,
        selectedSectorOutline: true,
        beaconPlanWagonCues: true,
        homeNodeEmphasis: true,
        riverFlatCues: true,
        waterCuesServerGated: true,
        woodlandRidgeCues: true,
        ruinSignalCues: true,
        ruinSignalCuesServerGated: true,
        lockedUnknownSealedFogOnly: true,
        hintedAbstractFogEdge: true,
        frontierBoundaryDashes: true,
        frontierBoundaryVisualOnly: true,
        fogVeils: this.cells.filter((cell) => !['discovered', 'known'].includes(String(cell.fogState || ''))).length,
        edgeFogCount: this.edgeFogCount,
        civicBeaconCount: this.civicBeaconCount,
        surveyStrokeCount: this.surveyStrokeCount,
        surveyStrokesVisualOnly: true,
        receiptTraceVisualOnly: true,
        markerCount: this.markerCount,
        eventPacketMarkers: true,
        eventPacketMarkerCount: this.eventMarkerCount,
        objectiveMarkers: true,
        objectiveMarkerCount: this.objectiveMarkerCount,
        eventObjectiveMarkersVisualOnly: [...this.eventMarkerSprites, ...this.objectiveMarkerSprites]
          .every((sprite) => sprite.userData?.visualOnly === true),
        eventObjectiveMarkersReadOnly: [...this.eventMarkerSprites, ...this.objectiveMarkerSprites]
          .every((sprite) => sprite.userData?.readOnly === true),
        eventObjectiveMarkersInspectable: [...this.eventMarkerSprites, ...this.objectiveMarkerSprites]
          .every((sprite) => sprite.userData?.selectable === true && sprite.userData?.inspectable === true),
        eventObjectiveMarkerAuthority: false,
        unitTokens: true,
        unitTokenCount: this.unitTokenCount,
        unitTokensReadOnly: this.unitSprites.every((sprite) => sprite.userData?.readOnly === true),
        unitMovementMutationImplemented: this.unitSprites.some((sprite) => sprite.userData?.movementMutationImplemented === true),
        commandTargetRings: true,
        commandTargetCount: this.commandTargetCount,
        commandTargetRingsVisualOnly: this.commandTargetSprites.every((sprite) => sprite.userData?.visualOnly === true),
        commandTargetRingsReadOnly: this.commandTargetSprites.every((sprite) => sprite.userData?.readOnly === true),
        commandTargetRingsSelectable: this.commandTargetSprites.every((sprite) => sprite.userData?.selectable === true),
        commandTargetRingsPreviewOnly: this.commandTargetSprites.every((sprite) => sprite.userData?.previewOnly === true),
        commandTargetRingAuthority: false,
        clientAuthority: false
      },
      regionConsistency: {
        waterCueCells: regionVisuals.filter((cell) => cell.waterCue).map((cell) => cell.cellId),
        ruinSignalCueCells: regionVisuals.filter((cell) => cell.ruinSignalCue).map((cell) => cell.cellId),
        lockedUnknownCellsSealed: regionVisuals
          .filter((cell) => cell.fogState === 'locked_unknown')
          .every((cell) => cell.hiddenSpecificitySuppressed && !cell.waterCue && !cell.ruinSignalCue),
        hintedCellsAbstract: regionVisuals
          .filter((cell) => cell.fogState === 'hinted')
          .every((cell) => cell.hiddenSpecificitySuppressed && !cell.waterCue && !cell.ruinSignalCue),
        waterCuesRequireServerOwnedWater: regionVisuals
          .filter((cell) => cell.waterCue)
          .every((cell) => cell.publicTerrainAssetSlot === 'water'),
        waterCoastRuntimeAssetsBlocked: regionVisuals.every((cell) => !['water', 'coast'].includes(String(cell.assetSlot || ''))),
        hiddenCellsHaveNoPublicTerrainSlot: regionVisuals
          .filter((cell) => !['discovered', 'known'].includes(cell.fogState))
          .every((cell) => cell.publicTerrainAssetSlot == null),
        hiddenCellsUseOnlyFogAssets: regionVisuals
          .filter((cell) => !['discovered', 'known'].includes(cell.fogState))
          .every((cell) => ['hinted_frontier_fog', 'locked_unknown_fog'].includes(String(cell.assetSlot || '')) && cell.fogOnly === true && cell.assetKind === 'fog_only'),
        knownDiscoveredAssetsMatchServerTerrain: regionVisuals
          .filter((cell) => ['discovered', 'known'].includes(cell.fogState) && cell.assetPath)
          .every((cell) => cell.assetAllowedByServerTruth === true),
        visibleAssetsMatchPublicTerrainSlot: regionVisuals
          .filter((cell) => ['discovered', 'known'].includes(cell.fogState) && cell.assetPath)
          .every((cell) => cell.assetSlot === cell.publicTerrainAssetSlot && cell.assetKind === 'concrete_public_terrain'),
        serverTerrainAssetContractComplete: regionVisuals
          .every((cell) => cell.terrainAssetContractVersion === EXPEDITION_PUBLIC_TERRAIN_CONTRACT_VERSION
            && (['discovered', 'known'].includes(cell.fogState)
              ? cell.publicTerrainAssetSlotSource === EXPEDITION_PUBLIC_TERRAIN_SLOT_SOURCE
              : cell.fogAssetSlot != null)),
        runtimeAssetProofMetadataComplete: regionVisuals
          .filter((cell) => cell.assetPath)
          .every((cell) => cell.cellId && cell.fogState && cell.runtimeAssetPack && cell.assetSlot && cell.assetKind && typeof cell.assetAllowedByServerTruth === 'boolean'),
        runtimeAssetCellsRegionTruthBound: regionVisuals
          .filter((cell) => cell.assetPath)
          .every((cell) => cell.assetAllowedByServerTruth === true),
        continuousUnderlayHiddenCellsFogOnly: regionVisuals
          .filter((cell) => !['discovered', 'known'].includes(cell.fogState))
          .every((cell) => cell.underlayFogOnly && cell.underlayTerrain === cell.fogState),
        continuousUnderlayNoActionAuthority: this.terrainUnderlayCount === 1
      },
      regionVisuals,
      eventMarkers: this.eventMarkerSprites.map((sprite) => ({
        packetId: String(sprite.userData?.packetId || ''),
        cellId: String(sprite.userData?.cellId || ''),
        templateId: String(sprite.userData?.templateId || ''),
        spriteAssetSlot: String(sprite.userData?.spriteAssetSlot || ''),
        spriteAssetPath: String(sprite.userData?.spriteAssetPath || ''),
        spriteAssetReady: sprite.userData?.spriteAssetReady === true,
        visualOnly: sprite.userData?.visualOnly === true,
        readOnly: sprite.userData?.readOnly === true,
        selectable: sprite.userData?.selectable === true,
        inspectable: sprite.userData?.inspectable === true,
        routeAuthority: sprite.userData?.routeAuthority === true,
        actionAuthority: sprite.userData?.actionAuthority === true,
        executableActions: Number(sprite.userData?.executableActions || 0),
        canvas: this.canvasPointForObject(sprite)
      })),
      objectiveMarkers: this.objectiveMarkerSprites.map((sprite) => ({
        mode: String(sprite.userData?.mode || ''),
        targetCellId: String(sprite.userData?.targetCellId || ''),
        packetId: String(sprite.userData?.packetId || ''),
        spriteAssetSlot: String(sprite.userData?.spriteAssetSlot || ''),
        spriteAssetPath: String(sprite.userData?.spriteAssetPath || ''),
        spriteAssetReady: sprite.userData?.spriteAssetReady === true,
        visualOnly: sprite.userData?.visualOnly === true,
        readOnly: sprite.userData?.readOnly === true,
        selectable: sprite.userData?.selectable === true,
        inspectable: sprite.userData?.inspectable === true,
        routeAuthority: sprite.userData?.routeAuthority === true,
        actionAuthority: sprite.userData?.actionAuthority === true,
        executableActions: Number(sprite.userData?.executableActions || 0),
        canvas: this.canvasPointForObject(sprite)
      })),
      units: this.unitSprites.map((sprite) => ({
        unitId: String(sprite.userData?.unitId || ''),
        unitType: String(sprite.userData?.unitType || ''),
        displayName: String(sprite.userData?.displayName || ''),
        cellId: String(sprite.userData?.cellId || ''),
        spriteAssetSlot: String(sprite.userData?.spriteAssetSlot || ''),
        spriteAssetPath: String(sprite.userData?.spriteAssetPath || ''),
        spriteAssetReady: sprite.userData?.spriteAssetReady === true,
        selected: String(sprite.userData?.unitId || '') === String(this.selectedUnitId || ''),
        readOnly: sprite.userData?.readOnly === true,
        movementMutationImplemented: sprite.userData?.movementMutationImplemented === true,
        canvas: this.canvasPointForObject(sprite)
      })),
      commandTargets: this.commandTargetSprites.map((sprite) => ({
        unitId: String(sprite.userData?.unitId || ''),
        unitType: String(sprite.userData?.unitType || ''),
        commandId: String(sprite.userData?.commandId || ''),
        cellId: String(sprite.userData?.cellId || ''),
        fogState: String(sprite.userData?.fogState || ''),
        serverMutationImplemented: sprite.userData?.serverMutationImplemented === true,
        movementMutation: sprite.userData?.movementMutation === true,
        visualOnly: sprite.userData?.visualOnly === true,
        readOnly: sprite.userData?.readOnly === true,
        previewOnly: sprite.userData?.previewOnly === true,
        selectable: sprite.userData?.selectable === true,
        routeAuthority: sprite.userData?.routeAuthority === true,
        actionAuthority: sprite.userData?.actionAuthority === true,
        executableActions: Number(sprite.userData?.executableActions || 0),
        canvas: this.canvasPointForObject(sprite)
      })),
      camera: {
        x: Number(this.camera.position.x.toFixed(3)),
        y: Number(this.camera.position.y.toFixed(3)),
        zoom: Number(this.camera.zoom.toFixed(3))
      },
      bounds: {
        minX: Number(this.mapBounds.minX.toFixed(3)),
        maxX: Number(this.mapBounds.maxX.toFixed(3)),
        minY: Number(this.mapBounds.minY.toFixed(3)),
        maxY: Number(this.mapBounds.maxY.toFixed(3))
      },
      fogStates: this.cells.reduce((acc, cell) => {
        const key = String(cell.fogState || 'locked_unknown');
        acc[key] = Number(acc[key] || 0) + 1;
        return acc;
      }, {}),
      pickTargets: this.cells.map((cell) => ({
        cellId: String(cell.cellId || ''),
        fogState: String(cell.fogState || ''),
        terrain: expeditionCellTerrain(cell),
        status: String(cell.status || ''),
        title: String(cell.title || ''),
        canvas: this.canvasPointForCell(cell.cellId)
      }))
    };
    return this.info;
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

function renderExpeditionMap(hostNode, model = {}, options = {}) {
  let stage = expeditionMapRenderers.get(hostNode);
  if (!stage) {
    stage = new ExpeditionMapThreeStage(hostNode);
    expeditionMapRenderers.set(hostNode, stage);
  }
  return stage.sync(model || {}, options.selectedCellId || '', options.selectedUnitId || '');
}

function getExpeditionMapInfo(hostNode) {
  const stage = expeditionMapRenderers.get(hostNode);
  return stage ? stage.updateInfo() : null;
}

function zoomExpeditionMap(hostNode, multiplier = 1) {
  const stage = expeditionMapRenderers.get(hostNode);
  if (!stage) return null;
  stage.setZoom(stage.camera.zoom * number(multiplier, 1));
  return stage.updateInfo();
}

function resetExpeditionMapCamera(hostNode) {
  const stage = expeditionMapRenderers.get(hostNode);
  if (!stage) return null;
  stage.resetView();
  return stage.updateInfo();
}

function disposeExpeditionMap(hostNode) {
  const stage = expeditionMapRenderers.get(hostNode);
  if (!stage) return;
  stage.dispose();
  expeditionMapRenderers.delete(hostNode);
}

window.FoundersPlotThreeRenderer = {
  renderPlotScene,
  getPlotSceneInfo,
  renderExpeditionMap,
  getExpeditionMapInfo,
  zoomExpeditionMap,
  resetExpeditionMapCamera,
  disposeExpeditionMap
};
