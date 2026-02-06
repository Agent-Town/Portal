(() => {
  function normalizeTheme(raw) {
    if (!raw) return '';
    const value = String(raw).trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,32}$/.test(value)) return '';
    return value;
  }

  const params = new URLSearchParams(window.location.search);
  const themeFromQuery = normalizeTheme(params.get('theme'));
  const storedTheme = normalizeTheme(window.localStorage.getItem('at_theme'));
  const theme = themeFromQuery || storedTheme;

  if (themeFromQuery && themeFromQuery !== storedTheme) {
    window.localStorage.setItem('at_theme', themeFromQuery);
  }

  if (!theme) return;

  document.documentElement.dataset.theme = theme;

  const id = 'atThemeStylesheet';
  let link = document.getElementById(id);
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `/themes/${encodeURIComponent(theme)}.css`;
})();

