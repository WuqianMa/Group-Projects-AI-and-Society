// PANEL B — right-hand context: scope card + pies + sample quotes.
window.HK = window.HK || {};

HK.panelContext = (function () {
  let popChart, langChart, roomChart;

  function init() {
    popChart  = echarts.init(document.getElementById('pie-pop'));
    langChart = echarts.init(document.getElementById('pie-lang'));
    roomChart = echarts.init(document.getElementById('pie-room'));
    [popChart, langChart, roomChart].forEach(c => {
      document.getElementById(c.getDom().id)._echartsInstance = c;
    });
    new ResizeObserver(() => {
      [popChart, langChart, roomChart].forEach(c => c.resize());
    }).observe(document.getElementById('context-body'));
  }

  function regionTagHtml(region) {
    if (!region) return '';
    return `<span class="region-tag ${HK.regionTagClass(region)}">${region}</span>`;
  }

  function fmtInt(n) { return (n || 0).toLocaleString(); }

  function buildScopeCard(state) {
    const sc = state.scope;
    let title, region = null, area = 0, pop = 0, listings = 0, reviews = 0;

    if (sc.level === 'all') {
      title = 'All Hong Kong';
      const feats = HK.DATA.districts.features;
      area = feats.reduce((s,f) => s + f.properties.area_km2, 0);
      pop  = feats.reduce((s,f) => s + (f.properties.population_2021 || 0), 0);
      reviews = Object.values(HK.DATA.density.count.all.all).reduce((s,n) => s+n, 0);
    } else if (sc.level === 'region') {
      title = sc.region;
      region = sc.region;
      const feats = HK.DATA.districts.features.filter(f => f.properties.region === region);
      area = feats.reduce((s,f) => s + f.properties.area_km2, 0);
      pop  = feats.reduce((s,f) => s + (f.properties.population_2021 || 0), 0);
      reviews = feats.reduce((s,f) => s + (HK.DATA.density.count.all.all[f.properties.district] || 0), 0);
    } else {
      title = sc.district;
      region = sc.region;
      const feat = HK.DATA.districts.features.find(f => f.properties.district === sc.district);
      area = feat.properties.area_km2;
      pop  = feat.properties.population_2021 || 0;
      reviews = HK.DATA.density.count.all.all[sc.district] || 0;
    }

    const popDensity = area > 0 ? Math.round(pop / area) : 0;
    const revDensity = area > 0 ? Math.round(reviews / area) : 0;

    document.getElementById('scope-card').innerHTML = `
      <h3>${title} ${regionTagHtml(region)}</h3>
      <div class="meta">
        <div><b>Area</b> ${area.toFixed(1)} km²</div>
        <div><b>Population (2021)</b> ${fmtInt(pop)}</div>
        <div><b>Pop. density</b> ${fmtInt(popDensity)} / km²</div>
        <div><b>Reviews</b> ${fmtInt(reviews)}</div>
        <div><b>Review density</b> ${fmtInt(revDensity)} / km²</div>
      </div>
    `;
  }

  function pieOpt(title, items, palette) {
    return {
      title: { text: title, top: 0, left: 'center', textStyle: { fontSize: 11, color: '#4b5563', fontWeight: 600 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      color: palette,
      series: [{
        type: 'pie',
        radius: ['38%','62%'],
        center: ['50%','58%'],
        avoidLabelOverlap: true,
        label: { fontSize: 10 },
        labelLine: { length: 6, length2: 4 },
        data: items,
      }],
    };
  }

  function renderPies(state) {
    const sc = state.scope;
    const features = HK.DATA.districts.features;
    const countsAll = HK.DATA.density.count.all.all;
    const langCounts = HK.DATA.density.count.language;
    const roomData = HK.DATA.roomtype;

    // POPULATION pie / bar
    let popItems;
    if (sc.level === 'all') {
      const byR = {};
      features.forEach(f => {
        byR[f.properties.region] = (byR[f.properties.region]||0) + (f.properties.population_2021||0);
      });
      popItems = Object.entries(byR).map(([k,v]) => ({ name: k, value: v }));
    } else if (sc.level === 'region') {
      popItems = features.filter(f => f.properties.region === sc.region)
        .map(f => ({ name: f.properties.district, value: f.properties.population_2021 || 0 }));
    } else {
      // District — pop is a single number, show a comparison bar instead.
      popItems = null;
    }

    if (popItems) {
      popChart.setOption(pieOpt('Population', popItems,
        ['#b35900','#1f7a8c','#4a7c59','#7e57c2','#c2185b','#5d6d7e']), true);
      document.getElementById('pie-pop').style.display = 'block';
    } else {
      // District — comparison bar (this district vs HK avg) on 3 metrics
      const feat = features.find(f => f.properties.district === sc.district);
      const area = feat.properties.area_km2;
      const pop = feat.properties.population_2021 || 0;
      const reviews = countsAll[sc.district] || 0;
      const entire = roomData.by_district[sc.district]['Entire home/apt'];
      const priv   = roomData.by_district[sc.district]['Private room'];
      const tot = entire + priv;
      const dPopDen = pop / area;
      const dRevDen = reviews / area;
      const dEntirePct = tot ? entire / tot * 100 : 0;

      const allArea = features.reduce((s,f) => s + f.properties.area_km2, 0);
      const allPop  = features.reduce((s,f) => s + (f.properties.population_2021||0), 0);
      const allRev  = Object.values(countsAll).reduce((s,n) => s+n, 0);
      const allEntire = features.reduce((s,f) => s + (roomData.by_district[f.properties.district]['Entire home/apt']||0), 0);
      const allPriv   = features.reduce((s,f) => s + (roomData.by_district[f.properties.district]['Private room']||0), 0);
      const allTot = allEntire + allPriv;
      const hPopDen = allPop / allArea;
      const hRevDen = allRev / allArea;
      const hEntirePct = allTot ? allEntire / allTot * 100 : 0;

      popChart.setOption({
        title: { text: 'This vs HK average', top: 0, left: 'center', textStyle: { fontSize: 11, color: '#4b5563', fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        grid: { left: 95, right: 12, top: 22, bottom: 18 },
        xAxis: { type: 'value', axisLabel: { fontSize: 9 } },
        yAxis: { type: 'category', data: ['Pop / km²','Reviews / km²','% Entire-home'], axisLabel: { fontSize: 10 } },
        series: [
          { name: 'This area', type: 'bar', barWidth: 7,
            data: [dPopDen, dRevDen, dEntirePct],
            itemStyle: { color: '#1f3a5f' },
            label: { show: true, position: 'right', fontSize: 9, formatter: p => p.value > 100 ? Math.round(p.value).toLocaleString() : p.value.toFixed(1) } },
          { name: 'HK avg', type: 'bar', barWidth: 7,
            data: [hPopDen, hRevDen, hEntirePct],
            itemStyle: { color: '#6aa3d5' },
            label: { show: true, position: 'right', fontSize: 9, formatter: p => p.value > 100 ? Math.round(p.value).toLocaleString() : p.value.toFixed(1) } },
        ],
      }, true);
    }

    // LANGUAGE pie
    const langItems = [];
    ['en','zh-CN','zh-TW'].forEach(L => {
      const counts = (HK.DATA.density.count.language[L]) || {};
      let v = 0;
      if (sc.level === 'all') v = Object.values(counts).reduce((s,n) => s+n, 0);
      else if (sc.level === 'region') {
        features.filter(f => f.properties.region === sc.region)
          .forEach(f => v += counts[f.properties.district] || 0);
      } else v = counts[sc.district] || 0;
      langItems.push({ name: L === 'en' ? 'English' : L === 'zh-CN' ? 'Simp. Chinese' : 'Trad. Chinese', value: v });
    });
    langChart.setOption(pieOpt('Review language', langItems,
      ['#1f3a5f','#b35900','#4a7c59']), true);

    // ROOM TYPE pie
    const roomItems = [];
    if (sc.level === 'all') {
      Object.entries(roomData.global).forEach(([k,v]) => roomItems.push({ name: k, value: v }));
    } else if (sc.level === 'region') {
      Object.entries(roomData.by_region[sc.region]).forEach(([k,v]) => roomItems.push({ name: k, value: v }));
    } else {
      Object.entries(roomData.by_district[sc.district]).forEach(([k,v]) => roomItems.push({ name: k, value: v }));
    }
    roomChart.setOption(pieOpt('Room type', roomItems, ['#1f7a8c','#c2185b']), true);
  }

  function renderQuotes(state) {
    const sc = state.scope;
    const ex = HK.DATA.examples;
    let pool = {};

    if (sc.level === 'district') {
      pool = ex[sc.district] || {};
    } else {
      // Aggregate: pull 1 quote per language from random in-scope districts.
      ['en','zh-CN','zh-TW'].forEach(L => {
        const candidates = [];
        HK.DATA.districts.features.forEach(f => {
          const inScope = sc.level === 'all' || f.properties.region === sc.region;
          if (!inScope) return;
          const arr = (ex[f.properties.district] || {})[L] || [];
          arr.forEach(q => candidates.push(q));
        });
        if (candidates.length) {
          pool[L] = [candidates[Math.floor(Math.random() * candidates.length)]];
        }
      });
    }

    const tagFor = L => L === 'en' ? 'EN' : L === 'zh-CN' ? 'ZH-CN' : 'ZH-TW';
    let html = '';
    ['en','zh-CN','zh-TW'].forEach(L => {
      const arr = (pool[L] || []).slice(0, 1);
      arr.forEach(q => {
        html += `<div class="quote">
                   <span class="lang-tag">${tagFor(L)}</span>${q.text}
                   ${q.gloss ? `<span class="gloss">${q.gloss}</span>` : ''}
                 </div>`;
      });
    });
    document.getElementById('quotes').innerHTML = html || '<div style="color:#888;font-size:12px">No qualifying review quotes in this scope.</div>';
  }

  function render(state) {
    buildScopeCard(state);
    renderPies(state);
    renderQuotes(state);
  }

  return {
    mount() {
      init();
      HK.store.subscribe(render);
    }
  };
})();
