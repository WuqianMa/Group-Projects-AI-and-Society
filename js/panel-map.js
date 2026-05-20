// PANEL A — Real map (Leaflet + CARTO tiles) with district choropleth.
window.HK = window.HK || {};

HK.panelMap = (function () {
  let map = null;
  let districtLayer = null;
  let regionLayer = null;
  let heatLayer = null;
  let seaMaskLayer = null;
  let labelsLayer = null;
  let allBounds = null;
  let currentStyle = 'choropleth';

  // Sequential colour ramp (orange) for review density.
  // Returns a hex string given a normalised value in [0,1].
  function ramp(t) {
    if (t <= 0 || !isFinite(t)) return '#ffffff';
    if (t > 1) t = 1;
    const stops = [
      [0.00, [255,247,236]],
      [0.20, [254,232,200]],
      [0.40, [253,212,158]],
      [0.60, [253,187,132]],
      [0.80, [252,141, 89]],
      [1.00, [179, 0,  0 ]],
    ];
    for (let i = 1; i < stops.length; i++) {
      const [t1, c1] = stops[i-1];
      const [t2, c2] = stops[i];
      if (t <= t2) {
        const f = (t - t1) / (t2 - t1);
        const r = Math.round(c1[0] + (c2[0]-c1[0]) * f);
        const g = Math.round(c1[1] + (c2[1]-c1[1]) * f);
        const b = Math.round(c1[2] + (c2[2]-c1[2]) * f);
        return `rgb(${r},${g},${b})`;
      }
    }
    return '#b30000';
  }

  function buildLegend(min, max, scale) {
    const el = document.getElementById('map-legend');
    el.innerHTML = '';
    const grad = document.createElement('div');
    grad.style.cssText = 'flex:1; max-width:280px';
    grad.innerHTML = `
      <div class="gradient"></div>
      <div class="bounds">
        <span>${Math.round(min).toLocaleString()}</span>
        <span>${Math.round(max).toLocaleString()} reviews/km²</span>
      </div>
      <div style="font-size:11px;color:#555;margin-top:2px">
        Colour scale: ${scale}. Click region or district to zoom in.
      </div>
    `;
    el.appendChild(grad);
  }

  function buildHeatmapLegend(segmentLabel) {
    const el = document.getElementById('map-legend');
    el.innerHTML = '';
    const grad = document.createElement('div');
    grad.style.cssText = 'flex:1; max-width:280px';
    grad.innerHTML = `
      <div class="gradient heatmap"></div>
      <div class="bounds">
        <span>fewer reviews</span>
        <span>more reviews</span>
      </div>
      <div style="font-size:11px;color:#555;margin-top:2px">
        Listing-point heatmap (${segmentLabel}). Sea has no listings, so it stays uncoloured.
      </div>
    `;
    el.appendChild(grad);
  }

  function regionStyle() {
    return { color: '#222', weight: 2.5, opacity: 0.85, fill: false };
  }

  function styleFor(value, vmin, vmax, scale) {
    if (!isFinite(value) || value <= 0) {
      return { color: '#777', weight: 1.0, fillColor: '#ddd', fillOpacity: 0.35 };
    }
    let t;
    if (scale === 'log') {
      const lo = Math.log10(Math.max(vmin, 0.1));
      const hi = Math.log10(Math.max(vmax, lo + 0.001));
      t = (Math.log10(Math.max(value, 0.1)) - lo) / (hi - lo);
    } else {
      t = (value - vmin) / Math.max(vmax - vmin, 0.0001);
    }
    return { color: '#444', weight: 1.0, fillColor: ramp(t), fillOpacity: 0.80 };
  }

  function weightForPoint(p, compareBy, segment) {
    if (segment === 'all') return p.all || 0;
    const bag = p[compareBy];
    if (!bag) return p.all || 0;
    return bag[segment] || 0;
  }

  function renderHeatmap(state) {
    if (!HK.DATA || !HK.DATA.points) return;
    const pts = HK.DATA.points.points;
    const sc = state.scope;
    const inScope = (p) => {
      if (sc.level === 'all') return true;
      if (sc.level === 'region')   return state.scope.region   && pointRegion(p) === sc.region;
      if (sc.level === 'district') return state.scope.district && p.district === sc.district;
      return true;
    };

    const data = [];
    let maxW = 0;
    for (const p of pts) {
      if (!inScope(p)) continue;
      const w = weightForPoint(p, state.compareBy, state.segment);
      if (w <= 0) continue;
      if (w > maxW) maxW = w;
      data.push([p.lat, p.lon, w]);
    }

    if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
    if (data.length) {
      heatLayer = L.heatLayer(data, {
        pane: 'heatPane',
        radius: 22,
        blur: 18,
        maxZoom: 17,
        max: Math.max(maxW, 1),
        minOpacity: 0.35,
        gradient: {
          0.0: '#fff7ec',
          0.2: '#fee8c8',
          0.4: '#fdd49e',
          0.6: '#fdbb84',
          0.8: '#fc8d59',
          1.0: '#b30000',
        },
      }).addTo(map);
    }

    const segLabel = (HK.store.AXIS_SEGMENTS[state.compareBy].find(s => s.id === state.segment) || {}).label || state.segment;
    buildHeatmapLegend(`${state.compareBy === 'language' ? 'Language' : state.compareBy === 'stay' ? 'Stay length' : 'Group size'} · ${segLabel}`);
  }

  function pointRegion(p) {
    const feat = (HK.DATA.districts.features || []).find(f => f.properties.district === p.district);
    return feat ? feat.properties.region : null;
  }

  function render(state) {
    if (!map) return;

    // Switch layers based on map style.
    if (state.mapStyle !== currentStyle) {
      currentStyle = state.mapStyle;
      if (currentStyle === 'heatmap') {
        if (districtLayer) districtLayer.setStyle({ fillOpacity: 0, opacity: 0, weight: 0 });
        if (seaMaskLayer) seaMaskLayer.addTo(map);
        if (labelsLayer)  labelsLayer.addTo(map);
      } else {
        if (heatLayer)    { map.removeLayer(heatLayer); heatLayer = null; }
        if (seaMaskLayer) map.removeLayer(seaMaskLayer);
        if (labelsLayer)  map.removeLayer(labelsLayer);
      }
    }

    if (currentStyle === 'heatmap') {
      renderHeatmap(state);
      return;
    }

    const density = HK.densityFor(state.compareBy, state.segment);
    const values = Object.values(density).filter(v => v > 0);
    const vmin = values.length ? Math.min(...values) : 0;
    const vmax = values.length ? Math.max(...values) : 1;

    districtLayer.eachLayer(layer => {
      const p = layer.feature.properties;
      const v = density[p.district] || 0;
      layer.setStyle(styleFor(v, vmin, vmax, state.colorScale));
      layer._densityVal = v;
      layer.bindTooltip(() => {
        const counts = HK.DATA.density.count[state.compareBy === 'language' && state.segment === 'all' ? 'all' : state.compareBy]
                     || HK.DATA.density.count.all;
        const cset = counts[state.segment] || counts.all || {};
        const n = cset[p.district] || 0;
        const pop = (p.population_2021 || 0).toLocaleString();
        return `<b>${p.district}</b><br>
                <span style="color:#666">${p.region}</span><br>
                density: <b>${Math.round(v).toLocaleString()}</b> reviews/km²<br>
                count: ${n.toLocaleString()} reviews<br>
                area: ${p.area_km2.toFixed(1)} km²<br>
                population (2021): ${pop}`;
      }, { sticky: true });
    });

    // Highlight current scope
    districtLayer.eachLayer(layer => {
      const p = layer.feature.properties;
      const sel = state.scope.level === 'district' && state.scope.district === p.district;
      const dimmed = (state.scope.level === 'region' && state.scope.region !== p.region) ||
                     (state.scope.level === 'district' && state.scope.district !== p.district);
      const cur = layer.options;
      layer.setStyle({
        weight: sel ? 2.4 : 0.8,
        color: sel ? '#000' : (cur.color || '#fff'),
        fillOpacity: dimmed ? 0.45 : 0.80,
      });
    });

    buildLegend(vmin, vmax, state.colorScale);
  }

  function init(state) {
    // Initialise leaflet (called once)
    map = L.map('map', { zoomControl: true, attributionControl: true });
    HK._leafletMap = map;

    // Panes for z-ordering when in heatmap mode:
    //   tilePane (200) < heatPane (350) < seaMaskPane (360) < labelsPane (380) < overlayPane (400)
    map.createPane('heatPane').style.zIndex = 350;
    map.createPane('seaMaskPane').style.zIndex = 360;
    map.createPane('labelsPane').style.zIndex = 380;
    map.getPane('seaMaskPane').style.pointerEvents = 'none';
    map.getPane('labelsPane').style.pointerEvents = 'none';

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM, © CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    // Built but not yet added — toggled on only in heatmap mode.
    seaMaskLayer = L.geoJSON(HK.DATA.seaMask, {
      pane: 'seaMaskPane',
      style: { fillColor: '#d8e6ec', fillOpacity: 1, color: '#8aa6b3', weight: 0.6, opacity: 0.9 },
      interactive: false,
    });
    labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 18,
      pane: 'labelsPane',
    });

    districtLayer = L.geoJSON(HK.DATA.districts, {
      style: { color: '#fff', weight: 0.8, fillColor: '#ddd', fillOpacity: 0.7 },
      onEachFeature: (feat, layer) => {
        layer.on('click', () => {
          const cur = HK.store.get().scope;
          if (cur.level === 'district' && cur.district === feat.properties.district) {
            HK.store.setScope({ level: 'region', region: feat.properties.region });
            map.fitBounds(regionLayer.getLayers()
              .find(L => L.feature.properties.region === feat.properties.region).getBounds(),
              { padding: [20, 20] });
          } else {
            HK.store.setScope({
              level: 'district',
              region: feat.properties.region,
              district: feat.properties.district
            });
            map.fitBounds(layer.getBounds(), { padding: [20, 20] });
          }
        });
      }
    }).addTo(map);

    regionLayer = L.geoJSON(HK.DATA.regions, {
      style: regionStyle(),
      onEachFeature: (feat, layer) => {
        layer.on('click', () => {
          const cur = HK.store.get().scope;
          if (cur.level === 'region' && cur.region === feat.properties.region) {
            HK.store.setScope({ level: 'all' });
            map.fitBounds(allBounds, { padding: [10, 10] });
          } else {
            HK.store.setScope({ level: 'region', region: feat.properties.region });
            map.fitBounds(layer.getBounds(), { padding: [20, 20] });
          }
        });
      },
    }).addTo(map);

    allBounds = districtLayer.getBounds();
    map.fitBounds(allBounds, { padding: [10, 10] });

    HK._resetMapView = function () {
      map.fitBounds(allBounds, { padding: [10, 10] });
    };

    render(state);
  }

  return {
    mount() {
      HK.store.subscribe(state => {
        if (!map) init(state);
        else render(state);
      });
    },
    resetView() {
      if (map) map.fitBounds(allBounds, { padding: [10, 10] });
    },
  };
})();
