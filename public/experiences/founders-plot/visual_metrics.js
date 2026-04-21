(function attachFoundersPlotVisualMetrics(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FoundersPlotVisualMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function foundersPlotVisualMetricsFactory() {
  const DEFAULT_DEBUG_TERMS = [
    'provider',
    'model',
    'oauth',
    'wallet',
    'blockchain',
    'runtime token',
    'bearer',
    'mcp',
    'json',
    'debug',
    'schema',
    'worker trace',
    'openclaw'
  ];
  const PROSE_IGNORE_SELECTOR = [
    '.sr-only',
    '.foundersDrawerTray',
    '.foundersInventory',
    '.foundersHudLevel',
    '.foundersHudQueue',
    '.foundersLabel',
    '.foundersBadge',
    '.at-fp-stage button',
    '.at-fp-stageCaption'
  ].join(', ');

  function elementVisible(node) {
    if (!(node instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    if (node.hidden) return false;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    return node.getClientRects().length > 0;
  }

  function intersectsViewport(rect, viewportWidth, viewportHeight, viewportTop = 0) {
    return rect.right > 0 && rect.bottom > viewportTop && rect.left < viewportWidth && rect.top < viewportHeight;
  }

  function visibleRectArea(rect, viewportWidth, viewportHeight, viewportTop = 0) {
    if (!intersectsViewport(rect, viewportWidth, viewportHeight, viewportTop)) return 0;
    const left = Math.max(0, rect.left);
    const top = Math.max(viewportTop, rect.top);
    const right = Math.min(viewportWidth, rect.right);
    const bottom = Math.min(viewportHeight, rect.bottom);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
  }

  function textNodesUnder(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
        if (!elementVisible(node.parentElement)) return NodeFilter.FILTER_REJECT;
        if (node.parentElement.closest(PROSE_IGNORE_SELECTOR)) return NodeFilter.FILTER_REJECT;
        const value = String(node.textContent || '').trim();
        return value ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    return nodes;
  }

  function normalizeWords(text) {
    return String(text || '')
      .replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  function countVisibleWords(root = document.body) {
    return textNodesUnder(root).reduce((count, node) => count + normalizeWords(node.textContent).length, 0);
  }

  function countVisiblePanels(root = document.body, selector = '.foundersSurfacePanel') {
    return Array.from(root.querySelectorAll(selector)).filter((node) => elementVisible(node)).length;
  }

  function countPrimaryCtasAboveFold(root = document.body, viewportHeight = window.innerHeight) {
    const explicitQuestCta = root.querySelector('[data-testid="founders-quest-cta"], #questCtaBtn');
    if (explicitQuestCta && elementVisible(explicitQuestCta) && explicitQuestCta.getBoundingClientRect().top < viewportHeight) {
      return 1;
    }
    return Array.from(root.querySelectorAll('.btn.primary, .foundersPrimaryCta, [data-primary-cta="true"]'))
      .filter((node) => elementVisible(node))
      .filter((node) => node.getBoundingClientRect().top < viewportHeight)
      .length;
  }

  function countDebugTerminology(root = document.body, terms = DEFAULT_DEBUG_TERMS) {
    const visibleText = textNodesUnder(root).map((node) => node.textContent).join(' ').toLowerCase();
    return terms.reduce((count, term) => count + (visibleText.includes(String(term).toLowerCase()) ? 1 : 0), 0);
  }

  function duplicateDomIdCount(root = document) {
    const ids = Array.from(root.querySelectorAll('[id]')).map((node) => node.id).filter(Boolean);
    const seen = new Set();
    let duplicates = 0;
    ids.forEach((id) => {
      if (seen.has(id)) duplicates += 1;
      seen.add(id);
    });
    return duplicates;
  }

  function stageVisibleAreaRatio(stageNode, viewportWidth = window.innerWidth, viewportHeight = window.innerHeight, viewportTop = 0) {
    if (!(stageNode instanceof HTMLElement) || !elementVisible(stageNode)) return 0;
    const rect = stageNode.getBoundingClientRect();
    const stageArea = visibleRectArea(rect, viewportWidth, viewportHeight, viewportTop);
    const viewportArea = Math.max(1, viewportWidth * Math.max(1, viewportHeight - viewportTop));
    return stageArea / viewportArea;
  }

  function hasHorizontalOverflow(root = document.documentElement) {
    if (!(root instanceof HTMLElement)) return false;
    return root.scrollWidth > root.clientWidth + 1;
  }

  function visibleText(root = document.body) {
    return textNodesUnder(root).map((node) => String(node.textContent || '').trim()).join(' ');
  }

  function collectSurfaceMetrics(options = {}) {
    const root = options.root || document.body;
    const stageNode = options.stageNode || document.querySelector('[data-testid="founders-plot-stage"]') || document.getElementById('plotBoard');
    const viewportWidth = Number(options.viewportWidth || window.innerWidth);
    const viewportHeight = Number(options.viewportHeight || window.innerHeight);
    const topHud = options.topHudNode || document.querySelector('[data-testid="founders-status-strip"]');
    const viewportTop = topHud instanceof HTMLElement ? Math.max(0, topHud.getBoundingClientRect().bottom) : 0;
    return {
      visibleWords: countVisibleWords(root),
      visiblePanels: countVisiblePanels(root),
      primaryCtasAboveFold: countPrimaryCtasAboveFold(root, viewportHeight),
      debugTerminologyCount: countDebugTerminology(root, options.terms || DEFAULT_DEBUG_TERMS),
      duplicateDomIdCount: duplicateDomIdCount(document),
      stageVisibleAreaRatio: stageVisibleAreaRatio(stageNode, viewportWidth, viewportHeight, viewportTop),
      horizontalOverflow: hasHorizontalOverflow(document.documentElement),
      visibleText: visibleText(root)
    };
  }

  return {
    DEFAULT_DEBUG_TERMS,
    collectSurfaceMetrics,
    countDebugTerminology,
    countPrimaryCtasAboveFold,
    countVisiblePanels,
    countVisibleWords,
    duplicateDomIdCount,
    elementVisible,
    hasHorizontalOverflow,
    stageVisibleAreaRatio
  };
});
