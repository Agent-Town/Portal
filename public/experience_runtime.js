(function initExperienceRuntime(root, factory) {
  const api = factory(
    root && root.AgentTownExperienceProfiles ? root.AgentTownExperienceProfiles : null
  );
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root && typeof root === 'object') {
    root.AgentTownExperienceRuntime = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildExperienceRuntime(Profiles) {
  async function fetchJson(fetchImpl, url, options = {}) {
    const response = await fetchImpl(url, {
      credentials: 'same-origin',
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(String(payload?.error || `HTTP_${response.status}`));
      error.status = response.status;
      error.data = payload;
      throw error;
    }
    return payload;
  }

  function getBrowserLanguages() {
    if (typeof navigator === 'undefined') return [];
    if (Array.isArray(navigator.languages) && navigator.languages.length) return navigator.languages;
    if (typeof navigator.language === 'string' && navigator.language.trim()) return [navigator.language.trim()];
    return [];
  }

  async function bootstrap({
    fetchImpl = (typeof fetch === 'function' ? fetch.bind(globalThis) : null)
  } = {}) {
    if (!Profiles || typeof fetchImpl !== 'function') {
      return {
        defaultPresetId: 'global-default',
        current: null,
        hasLocalChoice: false,
        hasSessionChoice: false,
        hasExplicitChoice: false,
        presets: []
      };
    }

    const localPreference = Profiles.readLocalPreference();
    const payload = await fetchJson(fetchImpl, '/api/experience/bootstrap', { method: 'GET', cache: 'no-store' });
    const sessionPreference = payload?.current && typeof payload.current === 'object'
      ? Profiles.normalizePreference(payload.current, {
        defaultPresetId: payload.defaultPresetId || Profiles.DEFAULT_PRESET_ID,
        source: payload.current?.source || 'server-default'
      })
      : null;

    const hasSessionChoice = sessionPreference?.source === 'user';
    const hasLocalChoice = !!(localPreference && Profiles.isSupportedPresetId(localPreference.presetId));

    let current = Profiles.resolveExperiencePreference({
      sessionPreference,
      localPreference,
      browserLanguages: getBrowserLanguages(),
      defaultPresetId: payload.defaultPresetId || Profiles.DEFAULT_PRESET_ID
    });

    if (hasLocalChoice && (!hasSessionChoice || !Profiles.samePreference(localPreference, sessionPreference))) {
      const saved = await fetchJson(fetchImpl, '/api/experience/preference', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ presetId: localPreference.presetId })
      });
      current = Profiles.normalizePreference(saved?.experiencePreference || localPreference, { source: 'user' });
      Profiles.persistLocalPreference(current);
      return {
        defaultPresetId: payload.defaultPresetId || Profiles.DEFAULT_PRESET_ID,
        current,
        sessionPreference: current,
        hasLocalChoice: true,
        hasSessionChoice: true,
        hasExplicitChoice: true,
        presets: Array.isArray(payload?.presets) ? payload.presets : []
      };
    }

    if (hasSessionChoice) {
      Profiles.persistLocalPreference(sessionPreference);
      current = sessionPreference;
    }

    return {
      defaultPresetId: payload.defaultPresetId || Profiles.DEFAULT_PRESET_ID,
      current,
      sessionPreference,
      hasLocalChoice,
      hasSessionChoice,
      hasExplicitChoice: hasLocalChoice || hasSessionChoice,
      presets: Array.isArray(payload?.presets) ? payload.presets : []
    };
  }

  async function setPreference(presetId, {
    fetchImpl = (typeof fetch === 'function' ? fetch.bind(globalThis) : null)
  } = {}) {
    if (!Profiles || typeof fetchImpl !== 'function') throw new Error('EXPERIENCE_RUNTIME_UNAVAILABLE');
    const saved = await fetchJson(fetchImpl, '/api/experience/preference', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ presetId })
    });
    const current = Profiles.normalizePreference(saved?.experiencePreference || { presetId }, { source: 'user' });
    Profiles.persistLocalPreference(current);
    return current;
  }

  function applyDocumentPreference(preference) {
    if (!Profiles) return null;
    const normalized = preference && typeof preference === 'object'
      ? Profiles.normalizePreference(preference, {
        source: preference.source || 'user'
      })
      : Profiles.normalizePreference({ presetId: Profiles.DEFAULT_PRESET_ID }, { source: 'server-default' });
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = normalized.locale || 'en';
      if (document.body) {
        document.body.dataset.experiencePreset = normalized.presetId;
        document.body.dataset.experienceMarket = normalized.market;
      }
    }
    return normalized;
  }

  return {
    bootstrap,
    setPreference,
    applyDocumentPreference,
    getBrowserLanguages
  };
}));
