// Boot: load JSON, bind header controls, mount all panels.
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await HK.loadAll();
  } catch (err) {
    document.body.innerHTML = `<div style="padding:24px;color:#900;font-family:monospace;white-space:pre-wrap">
      Failed to load data:
      ${err && err.message ? err.message : err}

      The page must be served from an HTTP server (file:// fetch() is blocked by browsers).
      From the project root, run:
        python3 -m http.server -d web 8000
      Then open  http://localhost:8000/
    </div>`;
    return;
  }

  // Header — compareBy radios
  document.querySelectorAll('input[name="compareBy"]').forEach(r => {
    r.addEventListener('change', e => {
      HK.store.set({ compareBy: e.target.value, segment: 'all' });
      buildSegmentChips();
    });
  });

  // Header — colour scale
  document.querySelectorAll('input[name="colorScale"]').forEach(r => {
    r.addEventListener('change', e => HK.store.set({ colorScale: e.target.value }));
  });

  // Header — map style (choropleth vs listing heatmap)
  document.querySelectorAll('input[name="mapStyle"]').forEach(r => {
    r.addEventListener('change', e => HK.store.set({ mapStyle: e.target.value }));
  });

  // Header — reset view
  document.getElementById('reset-view').addEventListener('click', () => {
    HK.store.setScope({ level: 'all', region: null, district: null });
    if (HK._resetMapView) HK._resetMapView();
  });

  // Build segment chips for the current compareBy axis
  function buildSegmentChips() {
    const st = HK.store.get();
    const segs = HK.store.AXIS_SEGMENTS[st.compareBy];
    const cont = document.getElementById('segment-chips');
    cont.innerHTML = '';
    segs.forEach(s => {
      const b = document.createElement('button');
      b.className = 'chip' + (st.segment === s.id ? ' active' : '');
      b.textContent = s.label;
      b.addEventListener('click', () => HK.store.set({ segment: s.id }));
      cont.appendChild(b);
    });
  }

  // Re-render chips & breadcrumb whenever state changes
  HK.store.subscribe(state => {
    document.querySelectorAll('#segment-chips .chip').forEach((el, i) => {
      const segs = HK.store.AXIS_SEGMENTS[state.compareBy];
      el.classList.toggle('active', segs[i] && state.segment === segs[i].id);
    });
    buildBreadcrumb(state);
  });

  function buildBreadcrumb(state) {
    const el = document.getElementById('breadcrumb');
    el.innerHTML = '';
    const sc = state.scope;
    const parts = [];
    parts.push({ label: 'All Hong Kong', target: { level: 'all', region: null, district: null }, current: sc.level === 'all' });
    if (sc.level !== 'all' && sc.region) {
      parts.push({ label: sc.region, target: { level: 'region', region: sc.region, district: null }, current: sc.level === 'region' });
    }
    if (sc.level === 'district' && sc.district) {
      parts.push({ label: sc.district, target: { level: 'district', region: sc.region, district: sc.district }, current: true });
    }
    parts.forEach((p, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep'; sep.textContent = '▸';
        el.appendChild(sep);
      }
      const span = document.createElement('span');
      span.className = p.current ? 'current' : 'crumb';
      span.textContent = p.label;
      if (!p.current) {
        span.addEventListener('click', () => {
          HK.store.setScope(p.target);
          if (p.target.level === 'all' && HK._resetMapView) HK._resetMapView();
        });
      }
      el.appendChild(span);
    });
  }

  // Mount panels
  HK.panelMap.mount();
  HK.panelContext.mount();
  HK.panelPopDensity.mount();
  HK.panelRoomType.mount();
  HK.panelTopics.mount();
  HK.panelMix.mount();

  buildSegmentChips();
});
