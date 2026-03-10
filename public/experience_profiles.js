(function initExperienceProfiles(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root && typeof root === 'object') {
    root.AgentTownExperienceProfiles = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildExperienceProfiles() {
  const globalRoot = typeof globalThis !== 'undefined' ? globalThis : null;
  const DEFAULT_PRESET_ID = 'global-default';
  const FULL_STORAGE_KEY = 'agentTown:experiencePreference';
  const STORAGE_KEYS = Object.freeze({
    presetId: 'agentTown:experiencePreset',
    locale: 'agentTown:locale',
    market: 'agentTown:market',
    full: FULL_STORAGE_KEY
  });

  const PRESETS = Object.freeze({
    'global-default': Object.freeze({
      id: 'global-default',
      label: 'English / Global',
      locale: 'en',
      market: 'global',
      copyNamespace: 'global-default',
      providerPolicy: 'global-default',
      sharePolicy: 'x-moltbook',
      mediaPolicy: 'youtube',
      agentPolicy: 'default'
    }),
    'cn-mainland': Object.freeze({
      id: 'cn-mainland',
      label: '简体中文 / Mainland-friendly',
      locale: 'zh-CN',
      market: 'cn-mainland',
      copyNamespace: 'cn-mainland',
      providerPolicy: 'cn-mainland',
      sharePolicy: 'link-first',
      mediaPolicy: 'mainland-safe',
      agentPolicy: 'avoid-blocked-services'
    })
  });

  function nowIso() {
    return new Date().toISOString();
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function normalizePresetId(value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    return PRESETS[raw] ? raw : DEFAULT_PRESET_ID;
  }

  function isSupportedPresetId(value) {
    return !!PRESETS[String(value || '').trim()];
  }

  function getPreset(value) {
    return clone(PRESETS[normalizePresetId(value)]);
  }

  function listPresets() {
    return Object.keys(PRESETS).map((key) => getPreset(key));
  }

  function normalizeSelectedAt(value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return nowIso();
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : nowIso();
  }

  function normalizePreference(input, opts = {}) {
    const presetId = normalizePresetId(input?.presetId || opts.defaultPresetId || DEFAULT_PRESET_ID);
    const preset = PRESETS[presetId];
    const sourceRaw = typeof input?.source === 'string' ? input.source.trim() : '';
    return {
      presetId: preset.id,
      locale: preset.locale,
      market: preset.market,
      providerPolicy: preset.providerPolicy,
      sharePolicy: preset.sharePolicy,
      mediaPolicy: preset.mediaPolicy,
      agentPolicy: preset.agentPolicy,
      selectedAt: normalizeSelectedAt(input?.selectedAt),
      source: sourceRaw || String(opts.source || 'server-default')
    };
  }

  function samePreference(a, b) {
    return String(a?.presetId || '') === String(b?.presetId || '')
      && String(a?.locale || '') === String(b?.locale || '')
      && String(a?.market || '') === String(b?.market || '');
  }

  function canUseStorage(storage) {
    return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
  }

  function readStorage(storage, key) {
    if (!canUseStorage(storage)) return '';
    try {
      return String(storage.getItem(key) || '').trim();
    } catch {
      return '';
    }
  }

  function writeStorage(storage, key, value) {
    if (!canUseStorage(storage)) return;
    try {
      storage.setItem(key, value);
    } catch {
      // ignore storage errors
    }
  }

  function removeStorage(storage, key) {
    if (!canUseStorage(storage)) return;
    try {
      storage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  }

  function readLocalPreference(storage) {
    const activeStorage = storage || globalRoot?.localStorage || null;
    const fullRaw = readStorage(activeStorage, STORAGE_KEYS.full);
    if (fullRaw) {
      try {
        const parsed = JSON.parse(fullRaw);
        if (parsed && typeof parsed === 'object') {
          return normalizePreference(parsed, {
            source: typeof parsed.source === 'string' && parsed.source.trim() ? parsed.source.trim() : 'user'
          });
        }
      } catch {
        // fall back to legacy keys below
      }
    }

    const presetId = readStorage(activeStorage, STORAGE_KEYS.presetId);
    if (!isSupportedPresetId(presetId)) return null;
    const locale = readStorage(activeStorage, STORAGE_KEYS.locale);
    const market = readStorage(activeStorage, STORAGE_KEYS.market);
    return normalizePreference({
      presetId,
      locale,
      market,
      source: 'user'
    }, { source: 'user' });
  }

  function persistLocalPreference(input, storage) {
    const activeStorage = storage || globalRoot?.localStorage || null;
    const preference = normalizePreference(input, { source: 'user' });
    writeStorage(activeStorage, STORAGE_KEYS.presetId, preference.presetId);
    writeStorage(activeStorage, STORAGE_KEYS.locale, preference.locale);
    writeStorage(activeStorage, STORAGE_KEYS.market, preference.market);
    writeStorage(activeStorage, STORAGE_KEYS.full, JSON.stringify(preference));
    return preference;
  }

  function clearLocalPreference(storage) {
    const activeStorage = storage || globalRoot?.localStorage || null;
    removeStorage(activeStorage, STORAGE_KEYS.presetId);
    removeStorage(activeStorage, STORAGE_KEYS.locale);
    removeStorage(activeStorage, STORAGE_KEYS.market);
    removeStorage(activeStorage, STORAGE_KEYS.full);
  }

  function browserSuggestedPresetId(languagesInput) {
    const values = Array.isArray(languagesInput)
      ? languagesInput
      : (typeof languagesInput === 'string' && languagesInput ? [languagesInput] : []);
    const normalized = values
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    if (normalized.some((value) => value === 'zh-cn' || value === 'zh-hans' || value.startsWith('zh'))) {
      return 'cn-mainland';
    }
    return DEFAULT_PRESET_ID;
  }

  function resolveExperiencePreference({
    explicitPresetId = '',
    sessionPreference = null,
    localPreference = null,
    browserLanguages = [],
    defaultPresetId = DEFAULT_PRESET_ID
  } = {}) {
    if (isSupportedPresetId(explicitPresetId)) {
      return normalizePreference({ presetId: explicitPresetId, source: 'user' }, { source: 'user' });
    }
    if (sessionPreference && isSupportedPresetId(sessionPreference.presetId)) {
      return normalizePreference(sessionPreference, {
        defaultPresetId,
        source: sessionPreference.source || 'server-default'
      });
    }
    if (localPreference && isSupportedPresetId(localPreference.presetId)) {
      return normalizePreference(localPreference, { defaultPresetId, source: 'user' });
    }
    const suggestedPresetId = browserSuggestedPresetId(browserLanguages);
    if (isSupportedPresetId(suggestedPresetId)) {
      return normalizePreference({ presetId: suggestedPresetId, source: 'browser' }, { defaultPresetId, source: 'browser' });
    }
    return normalizePreference({ presetId: defaultPresetId, source: 'server-default' }, { defaultPresetId, source: 'server-default' });
  }

  return {
    DEFAULT_PRESET_ID,
    STORAGE_KEYS,
    FULL_STORAGE_KEY,
    PRESETS,
    listPresets,
    getPreset,
    isSupportedPresetId,
    normalizePreference,
    samePreference,
    readLocalPreference,
    persistLocalPreference,
    clearLocalPreference,
    browserSuggestedPresetId,
    resolveExperiencePreference
  };
}));
