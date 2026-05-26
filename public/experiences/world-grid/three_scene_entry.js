import * as THREE from 'three';

const stateColors = {
  claimed: 0xc7892e,
  claimable: 0x6f8a58,
  visible: 0xd7b66f,
  locked: 0x8b8170
};

const terrainRoughness = {
  prairie: 0.52,
  ridge: 0.82,
  river: 0.38,
  forest: 0.64,
  mesa: 0.74
};

function hexToNumber(value, fallback) {
  const normalized = String(value || '').trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return fallback;
  return Number.parseInt(normalized.slice(1), 16);
}

function rendererSize(container) {
  const rect = container.getBoundingClientRect();
  return {
    width: Math.max(320, Math.floor(rect.width || 640)),
    height: Math.max(260, Math.floor(rect.height || 420))
  };
}

function makeMaterial(cell, palette = null) {
  const color = hexToNumber(
    palette?.state?.[cell.state] || palette?.terrain?.[cell.terrain],
    stateColors[cell.state] || 0xd7b66f
  );
  return new THREE.MeshStandardMaterial({
    color,
    roughness: terrainRoughness[cell.terrain] || 0.62,
    metalness: 0.04,
    transparent: cell.state === 'locked',
    opacity: cell.state === 'locked' ? 0.48 : 0.92
  });
}

function createCellMesh(cell, palette = null) {
  const geometry = new THREE.CircleGeometry(0.48, 6);
  const mesh = new THREE.Mesh(geometry, makeMaterial(cell, palette));
  mesh.rotation.z = Math.PI / 6;
  mesh.position.set(cell.x * 1.12, cell.y * 1.12, 0);
  mesh.userData = { cellId: cell.cellId, cell };
  return mesh;
}

function renderWorldGridScene(container, sceneState, options = {}) {
  if (!container) throw new Error('MISSING_WORLD_GRID_CONTAINER');
  const { width, height } = rendererSize(container);
  container.innerHTML = '';
  const generatedPack = options.generatedPack || null;
  const palette = generatedPack?.stylePack?.palette || null;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.domElement.setAttribute('data-world-grid-canvas', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(hexToNumber(palette?.background, 0xf7e8c8));

  const camera = new THREE.OrthographicCamera(-4.8, 4.8, 3.2, -3.2, 0.1, 50);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(hexToNumber(palette?.light, 0xfff2d2), 2.1);
  light.position.set(2, 4, 6);
  scene.add(light);
  scene.add(new THREE.AmbientLight(hexToNumber(palette?.ambient, 0xffe8b8), 1.8));

  const group = new THREE.Group();
  scene.add(group);
  const meshes = [];
  for (const cell of sceneState.cells || []) {
    const mesh = createCellMesh(cell, palette);
    meshes.push(mesh);
    group.add(mesh);
  }

  const selectedRing = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.62, 32),
    new THREE.MeshBasicMaterial({ color: hexToNumber(palette?.selected || palette?.focus, 0x2b76c4), transparent: true, opacity: 0.86 })
  );
  selectedRing.position.z = 0.04;
  group.add(selectedRing);

  const homeCell = (sceneState.cells || []).find((cell) => cell.state === 'claimed');
  if (homeCell) {
    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.45, 5),
      new THREE.MeshStandardMaterial({ color: hexToNumber(palette?.primary, 0x7a3f22), roughness: 0.5 })
    );
    marker.position.set(homeCell.x * 1.12, homeCell.y * 1.12, 0.42);
    marker.rotation.x = Math.PI / 2;
    group.add(marker);
  }

  function syncSelection(cellId = sceneState.selectedCellId) {
    const selected = (sceneState.cells || []).find((cell) => cell.cellId === cellId) || homeCell;
    if (selected) selectedRing.position.set(selected.x * 1.12, selected.y * 1.12, 0.06);
  }
  syncSelection();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function handlePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit?.object?.userData?.cell) return;
    const cell = hit.object.userData.cell;
    syncSelection(cell.cellId);
    if (typeof options.onSelect === 'function') options.onSelect(cell.cellId);
  }
  renderer.domElement.addEventListener('pointerdown', handlePointer);

  let frameCount = 0;
  let disposed = false;
  const startedAt = performance.now();
  function animate() {
    if (disposed) return;
    frameCount += 1;
    group.rotation.z = Math.sin(performance.now() / 3200) * 0.006;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  function info() {
    const uptimeMs = Math.max(1, performance.now() - startedAt);
    return {
      renderer: 'three',
      cellCount: (sceneState.cells || []).length,
      selectedCellId: sceneState.selectedCellId,
      generatedPackId: generatedPack?.packId || '',
      stylePackId: generatedPack?.stylePack?.stylePackId || '',
      palette: palette ? {
        background: palette.background,
        primary: palette.primary,
        claimable: palette.state?.claimable
      } : null,
      performance: {
        uptimeMs,
        averageFps: Math.round((frameCount / uptimeMs) * 1000)
      }
    };
  }

  function dispose() {
    disposed = true;
    renderer.domElement.removeEventListener('pointerdown', handlePointer);
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    selectedRing.geometry.dispose();
    selectedRing.material.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
  }

  return {
    dispose,
    info,
    setSelectedCell: syncSelection
  };
}

window.WorldGridThreeRenderer = {
  renderWorldGridScene
};
