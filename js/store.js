// Global filter state with a tiny pub/sub.
// Every panel registers a callback and re-renders when state changes.

window.HK = window.HK || {};

HK.store = (function () {
  const state = {
    compareBy: 'language',         // 'language' | 'stay' | 'group'
    segment: 'all',                // 'all' or one of axis segments
    scope: { level: 'all', region: null, district: null },
    colorScale: 'log',             // 'linear' | 'log' — log default because density is heavily skewed
    mapStyle: 'choropleth',        // 'choropleth' | 'heatmap'
  };

  const subs = [];

  return {
    get: () => JSON.parse(JSON.stringify(state)),
    set(patch) {
      Object.assign(state, patch);
      subs.forEach(fn => fn(state));
    },
    setScope(scope) {
      state.scope = Object.assign({ level: 'all', region: null, district: null }, scope);
      subs.forEach(fn => fn(state));
    },
    subscribe(fn) { subs.push(fn); fn(state); },
    AXIS_SEGMENTS: {
      language: [
        { id: 'all',    label: 'All' },
        { id: 'en',     label: 'English' },
        { id: 'zh-CN',  label: 'Simplified Chinese' },
        { id: 'zh-TW',  label: 'Traditional Chinese' },
      ],
      stay: [
        { id: 'all',    label: 'All' },
        { id: 'Short',  label: 'Short ≤3n' },
        { id: 'Medium', label: 'Medium 4–7n' },
        { id: 'Long',   label: 'Long ≥8n' },
      ],
      group: [
        { id: 'all',         label: 'All' },
        { id: 'Solo-Couple', label: 'Solo / Couple' },
        { id: 'Small',       label: 'Small 3–4' },
        { id: 'Large',       label: 'Large ≥5' },
      ],
    },
  };
})();
