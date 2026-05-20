// Per-panel and "download all" PNG export.
window.HK = window.HK || {};

HK.download = {
  // Build a filesystem-safe slug describing the current dashboard state.
  // Example: panel-map__language-en__district-Yau-Tsim-Mong__hotspots.png
  stateSlug() {
    const s = (HK.store && HK.store.get) ? HK.store.get() : {};
    const slug = v => String(v).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const parts = [];

    if (s.compareBy) {
      parts.push(s.segment && s.segment !== 'all'
        ? `${slug(s.compareBy)}-${slug(s.segment)}`
        : `${slug(s.compareBy)}-all`);
    }
    if (s.scope) {
      if (s.scope.level === 'region')   parts.push('region-'   + slug(s.scope.region));
      if (s.scope.level === 'district') parts.push('district-' + slug(s.scope.district));
    }
    if (s.mapStyle === 'heatmap') parts.push('hotspots');
    return parts.join('__');
  },

  fileName(id) {
    const slug = HK.download.stateSlug();
    return slug ? `${id}__${slug}.png` : `${id}.png`;
  },

  // Download a single panel by id ("panel-map", "panel-context", etc).
  panel(id) {
    const node = document.getElementById(id);
    if (!node) return;
    const fname = HK.download.fileName(id);

    // PANEL A — Leaflet map.
    // Choropleth mode uses leaflet-image (crisp vector). Heatmap mode uses
    // html2canvas because leaflet-image cannot capture L.heat's canvas layer.
    if (id === 'panel-map') {
      const map = HK._leafletMap;
      const inHeatmap = HK.store && HK.store.get && HK.store.get().mapStyle === 'heatmap';
      if (!inHeatmap && map && window.leafletImage) {
        leafletImage(map, function (err, canvas) {
          if (err || !canvas) return HK.download._html2(node, fname);
          HK.download._saveCanvas(canvas, fname);
        });
        return;
      }
      return HK.download._html2(node, fname);
    }

    // ECharts panels: use the chart's built-in dataURL exporter.
    const echartsCandidate = node.querySelector('.chart');
    if (echartsCandidate && echartsCandidate._echartsInstance) {
      const inst = echartsCandidate._echartsInstance;
      const url = inst.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' });
      HK.download._saveDataUrl(url, fname);
      return;
    }

    // Mixed-content panels (context, topics): html2canvas
    HK.download._html2(node, fname);
  },

  all() {
    const ids = ['panel-map','panel-context','panel-popdensity','panel-roomtype','panel-topics','panel-mix'];
    ids.forEach((id, i) => setTimeout(() => HK.download.panel(id), i * 400));
  },

  _html2(node, fname) {
    html2canvas(node, { backgroundColor: '#ffffff', scale: 2, useCORS: true }).then(canvas => {
      HK.download._saveCanvas(canvas, fname);
    });
  },

  _saveCanvas(canvas, name) {
    HK.download._saveDataUrl(canvas.toDataURL('image/png'), name);
  },

  _saveDataUrl(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};

// Bind every "⇩" icon button.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dl').forEach(btn => {
    btn.addEventListener('click', () => HK.download.panel(btn.dataset.target));
  });
  const all = document.getElementById('download-all');
  if (all) all.addEventListener('click', HK.download.all);
});
