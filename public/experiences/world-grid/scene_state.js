(function () {
  function terrainLabel(terrain) {
    return {
      prairie: 'Prairie',
      ridge: 'Ridge',
      river: 'River',
      forest: 'Forest',
      mesa: 'Mesa'
    }[terrain] || 'Unknown terrain';
  }

  function stateLabel(state) {
    return {
      claimed: 'Claimed',
      claimable: 'Future claim option',
      visible: 'Visible',
      locked: 'Locked'
    }[state] || 'Unknown state';
  }

  function createWorldGridSceneState(region, preferences) {
    const cells = Array.isArray(region?.cells) ? region.cells : [];
    const selectedCellId = preferences?.selectedCellId || cells.find((cell) => cell.state === 'claimed')?.cellId || '';
    return {
      id: region?.regionId || 'region_unknown',
      selectedCellId,
      camera: preferences?.camera || { zoom: 'region', q: 0, r: 0 },
      cells: cells.map((cell) => ({
        ...cell,
        x: cell.q + (cell.r * 0.5),
        y: cell.r * 0.86,
        label: `${terrainLabel(cell.terrain)} - ${stateLabel(cell.state)}`,
        accessibleName: `${terrainLabel(cell.terrain)} cell at ${cell.q}, ${cell.r}. ${stateLabel(cell.state)}.`
      })),
      settlements: Array.isArray(region?.settlements) ? region.settlements : [],
      routes: Array.isArray(region?.routes) ? region.routes : []
    };
  }

  window.WorldGridSceneState = {
    createWorldGridSceneState,
    stateLabel,
    terrainLabel
  };
})();
