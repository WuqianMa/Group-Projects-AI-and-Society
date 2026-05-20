// PANEL F — Region × segment × room-type, rendered as three side-by-side
// stacked bar charts (one per region). Replaces the earlier Sankey that
// readers found hard to follow.
window.HK = window.HK || {};

HK.panelMix = (function () {
  const REGIONS = ['Hong Kong Island', 'Kowloon', 'New Territories'];
  const ROOM_COLORS = { 'Entire home/apt': '#1f7a8c', 'Private room': '#c2185b' };

  let chart = null;

  function init() {
    const el = document.getElementById('chart-mix');
    chart = echarts.init(el);
    el._echartsInstance = chart;
    new ResizeObserver(() => chart.resize())
      .observe(el.parentElement);
  }

  function segLabel(axis, id) {
    const seg = (HK.store.AXIS_SEGMENTS[axis] || []).find(s => s.id === id);
    return seg ? seg.label : id;
  }

  function axisTitle(axis) {
    if (axis === 'language') return 'language';
    if (axis === 'stay')     return 'stay length';
    return 'group size';
  }

  function render(state) {
    if (!chart) return;
    const data = HK.DATA.mix[state.compareBy];
    // axis_order excludes 'all' for the bar rendering — show only the real segments.
    const segs = HK.store.AXIS_SEGMENTS[state.compareBy].filter(s => s.id !== 'all').map(s => s.id);

    // Build 3 sub-grids, one per region; each sub-grid is a horizontal stacked bar.
    const gridGap = 4;
    const titleH = 22;
    const grids = [], titles = [], xAxes = [], yAxes = [], series = [];

    const entire = { name: 'Entire home/apt', type: 'bar', stack: 'rt',
                     itemStyle: { color: ROOM_COLORS['Entire home/apt'] },
                     label: { show: true, position: 'inside', color: '#fff', fontSize: 11,
                              formatter: p => p.value >= 400 ? p.value.toLocaleString() : '' },
                     emphasis: { focus: 'series' }, data: [] };
    const priv   = { name: 'Private room', type: 'bar', stack: 'rt',
                     itemStyle: { color: ROOM_COLORS['Private room'] },
                     label: { show: true, position: 'inside', color: '#fff', fontSize: 11,
                              formatter: p => p.value >= 400 ? p.value.toLocaleString() : '' },
                     emphasis: { focus: 'series' }, data: [] };

    REGIONS.forEach((region, i) => {
      const left  = (i / 3 * 100) + 2 + '%';
      const width = (100 / 3 - 4) + '%';
      grids.push({ left, width, top: titleH + 26, bottom: 26, containLabel: true });

      titles.push({
        text: region, left: `${(i + 0.5) * 100 / 3}%`, top: 4,
        textAlign: 'center',
        textStyle: { fontSize: 13, fontWeight: 600, color: '#1f3a5f' },
      });

      const cats = segs.map(s => segLabel(state.compareBy, s));
      xAxes.push({ gridIndex: i, type: 'value', axisLabel: { fontSize: 10 } });
      yAxes.push({ gridIndex: i, type: 'category', data: cats, inverse: true,
                   axisLabel: { fontSize: 11 } });

      // pad data arrays so each series stays aligned across all 3 grids
      segs.forEach(seg => {
        const cell = (data[region] && data[region][seg]) || {};
        entire.data.push({ value: cell['Entire home/apt'] || 0, xAxisIndex: i, yAxisIndex: i });
        priv.data.push  ({ value: cell['Private room']    || 0, xAxisIndex: i, yAxisIndex: i });
      });
    });

    // ECharts series-to-grid binding: each datum carries its own xAxisIndex/yAxisIndex.
    // For stacked bars across grids we instead need 3 separate series pairs.
    // Rewrite: produce one (entire, priv) pair per region grid.
    const seriesPerRegion = [];
    REGIONS.forEach((region, i) => {
      const entireSeries = {
        name: 'Entire home/apt', type: 'bar', stack: 'rt' + i,
        xAxisIndex: i, yAxisIndex: i,
        itemStyle: { color: ROOM_COLORS['Entire home/apt'] },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 11,
                 formatter: p => p.value >= 400 ? p.value.toLocaleString() : '' },
        emphasis: { focus: 'series' },
        data: segs.map(seg => (data[region] && data[region][seg] && data[region][seg]['Entire home/apt']) || 0),
      };
      const privSeries = {
        name: 'Private room', type: 'bar', stack: 'rt' + i,
        xAxisIndex: i, yAxisIndex: i,
        itemStyle: { color: ROOM_COLORS['Private room'] },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 11,
                 formatter: p => p.value >= 400 ? p.value.toLocaleString() : '' },
        emphasis: { focus: 'series' },
        data: segs.map(seg => (data[region] && data[region][seg] && data[region][seg]['Private room']) || 0),
      };
      seriesPerRegion.push(entireSeries, privSeries);
    });

    chart.setOption({
      backgroundColor: '#fff',
      legend: {
        top: 0, right: 12,
        data: ['Entire home/apt', 'Private room'],
        textStyle: { fontSize: 12 },
      },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: items => {
          if (!items.length) return '';
          const i = items[0].axisIndex || 0;
          const region = REGIONS[i];
          const seg = items[0].name;
          const total = items.reduce((s, it) => s + (it.value || 0), 0);
          let rows = `<b>${region}</b><br><span style="color:#666">${axisTitle(state.compareBy)}: ${seg}</span><br>`;
          items.forEach(it => {
            rows += `<span style="color:${it.color}">●</span> ${it.seriesName}: <b>${it.value.toLocaleString()}</b><br>`;
          });
          rows += `<span style="color:#666">total reviews: ${total.toLocaleString()}</span>`;
          return rows;
        },
      },
      title: titles,
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      series: seriesPerRegion,
    }, true);
  }

  return {
    mount() {
      init();
      HK.store.subscribe(render);
    },
  };
})();
