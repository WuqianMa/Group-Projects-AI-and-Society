// PANEL C — Population vs review density (log-log scatter).
window.HK = window.HK || {};

HK.panelPopDensity = (function () {
  let chart;

  const REGION_COLORS = {
    'Hong Kong Island': '#b35900',
    'Kowloon':          '#1f7a8c',
    'New Territories':  '#4a7c59',
  };

  function build(state) {
    const features = HK.DATA.districts.features;
    const density = HK.densityFor(state.compareBy, state.segment);
    const reg = HK.DATA.density.region;

    const seriesData = {};
    ['Hong Kong Island','Kowloon','New Territories'].forEach(r => seriesData[r] = []);

    features.forEach(f => {
      const d = f.properties.district;
      const popDen = (f.properties.population_2021 || 0) / (f.properties.area_km2 || 1);
      const revDen = density[d] || 0;
      if (popDen <= 0 || revDen <= 0) return;
      const isFocus = (state.scope.level === 'district' && state.scope.district === d) ||
                      (state.scope.level === 'region'   && state.scope.region   === reg[d]);
      seriesData[reg[d]].push({
        name: d,
        value: [popDen, revDen],
        symbolSize: isFocus ? 18 : 10,
        itemStyle: { opacity: state.scope.level === 'all' ? 0.85 : (isFocus ? 1.0 : 0.25),
                     borderColor: '#fff', borderWidth: 1 },
        label: { show: isFocus, formatter: d, position: 'top', fontSize: 11, color: '#222' }
      });
    });

    return {
      tooltip: {
        formatter: p => `<b>${p.data.name}</b><br>
                         pop density: ${Math.round(p.data.value[0]).toLocaleString()} / km²<br>
                         review density: ${Math.round(p.data.value[1]).toLocaleString()} / km²`
      },
      legend: { top: 0, left: 'center', textStyle: { fontSize: 11 } },
      grid: { left: 60, right: 24, top: 32, bottom: 50 },
      xAxis: {
        type: 'log',
        name: 'population per km²  (log)',
        nameLocation: 'middle', nameGap: 28,
        axisLabel: { fontSize: 10 },
        logBase: 10,
      },
      yAxis: {
        type: 'log',
        name: 'reviews per km²  (log)',
        nameLocation: 'middle', nameGap: 42,
        axisLabel: { fontSize: 10 },
        logBase: 10,
      },
      series: Object.keys(seriesData).map(r => ({
        name: r,
        type: 'scatter',
        data: seriesData[r],
        itemStyle: { color: REGION_COLORS[r] },
      })),
    };
  }

  return {
    mount() {
      const el = document.getElementById('chart-popdensity');
      chart = echarts.init(el);
      el._echartsInstance = chart;
      new ResizeObserver(() => chart.resize()).observe(el);
      HK.store.subscribe(state => chart.setOption(build(state), true));
    }
  };
})();
