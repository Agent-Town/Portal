(function () {
  function mappingName(generatedPack, canonicalId, fallback) {
    const mapping = (generatedPack?.gameplayMapping?.canonicalEntities || [])
      .find((item) => item.canonicalId === canonicalId);
    return mapping?.generatedName || fallback;
  }

  function terrainLabel(terrain, generatedPack = null) {
    const fallback = {
      prairie: 'Prairie',
      ridge: 'Ridge',
      river: 'River',
      forest: 'Forest',
      mesa: 'Mesa'
    }[terrain] || 'Unknown terrain';
    return mappingName(generatedPack, `terrain.${terrain}`, fallback);
  }

  function stateLabel(state, generatedPack = null) {
    const fallback = {
      claimed: 'Claimed',
      claimable: 'Future claim option',
      visible: 'Visible',
      locked: 'Locked'
    }[state] || 'Unknown state';
    return mappingName(generatedPack, `state.${state}`, fallback);
  }

  function createWorldGridSceneState(region, preferences, generatedPack = null) {
    const cells = Array.isArray(region?.cells) ? region.cells : [];
    const selectedCellId = preferences?.selectedCellId || cells.find((cell) => cell.state === 'claimed')?.cellId || '';
    return {
      id: region?.regionId || 'region_unknown',
      generatedPackId: generatedPack?.packId || '',
      stylePackId: generatedPack?.stylePack?.stylePackId || '',
      selectedCellId,
      camera: preferences?.camera || { zoom: 'region', q: 0, r: 0 },
      cells: cells.map((cell) => ({
        ...cell,
        x: cell.q + (cell.r * 0.5),
        y: cell.r * 0.86,
        label: `${terrainLabel(cell.terrain, generatedPack)} - ${stateLabel(cell.state, generatedPack)}`,
        accessibleName: `${terrainLabel(cell.terrain, generatedPack)} cell at ${cell.q}, ${cell.r}. ${stateLabel(cell.state, generatedPack)}.`
      })),
      settlements: Array.isArray(region?.settlements) ? region.settlements : [],
      routes: Array.isArray(region?.routes) ? region.routes : []
    };
  }

  window.WorldGridSceneState = {
    createWorldGridSceneState,
    mappingName,
    stateLabel,
    terrainLabel
  };
})();
