// iterate-init.js — bind app.js agent interface after DOM is ready
(() => {
  const rebind = () => {
    if (typeof window.setupAgentInterface === 'function') window.setupAgentInterface();
  };
  requestAnimationFrame(rebind);
  setTimeout(rebind, 250);
  setTimeout(rebind, 1000);
})();
