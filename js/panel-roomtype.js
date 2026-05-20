// PANEL D — Room-type composition by district (stacked horizontal bars).
window.HK = window.HK || {};

HK.panelRoomType = (function () {
  let chart;

  const REGION_ORDER = ['Hong Kong Island','Kowloon','New Territories'];

  function build(state) {
    const roomData = HK.DATA.roomtype;
    const reg = HK.DATA.density.region;
    // Order districts by region, then by share of Private room (descending).
    const districts = roomData.districts.slice().sort((a, b) => {
      const ra = REGION_ORDER.indexOf(reg[a]);
      const rb = REGION_ORDER.indexOf(reg[b]);
      if (ra !== rb) return ra - rb;
      const denA = roomData.by_district[a]['Entire home/apt'] + roomData.by_district[a]['Private room'];
      const denB = roomData.by_district[b]['Entire home/apt'] + roomData.by_district[b]['Private room'];
      return (roomData.by_district[a]['Private room'] / Math.max(denA,1))
           - (roomData.by_district[b]['Private room'] / Math.max(denB,1));
    });

    const entire = districts.map(d => roomData.by_district[d]['Entire home/apt']);
    const priv   = districts.map(d => roomData.by_district[d]['Private room']);
    // Percentages for clean stacking.
    const entirePct = entire.map((e,i) => {
      const tot = e + priv[i];
      return tot > 0 ? e / tot * 100 : 0;
    });
    const privPct = priv.map((p,i) => 100 - entirePct[i]);

    const isHi = d => (state.scope.level === 'district' && state.scope.district === d) ||
                       (state.scope.level === 'region'   && state.scope.region   === reg[d]) ||
                       state.scope.level === 'all';

    // Region tags for axis labels
    const regionMarks = districts.map(d => {
      const r = reg[d];
      const tag = r === 'Hong Kong Island' ? '◆' : r === 'Kowloon' ? '■' : '▲';
      return `${tag}  ${d}`;
    });

    return {
      legend: { top: 0, left: 'center', textStyle: { fontSize: 11 }, data: ['Entire home/apt','Private room'] },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: params => {
          const idx = params[0].dataIndex;
          const e = entire[idx], p = priv[idx], tot = e + p;
          return `<b>${districts[idx]}</b> <span style="color:#777">(${reg[districts[idx]]})</span><br>
                  Entire: ${e.toLocaleString()} (${entirePct[idx].toFixed(1)}%)<br>
                  Private: ${p.toLocaleString()} (${privPct[idx].toFixed(1)}%)<br>
                  total reviews: ${tot.toLocaleString()}`;
        }
      },
      grid: { left: 130, right: 14, top: 30, bottom: 24 },
      xAxis: {
        type: 'value', max: 100,
        axisLabel: { formatter: '{value}%', fontSize: 10 },
      },
      yAxis: {
        type: 'category', data: regionMarks, inverse: true,
        axisLabel: {
          fontSize: 10,
          color: (_v, idx) => isHi(districts[idx]) ? '#1f2328' : '#9aa3ad',
        }
      },
      series: [
        {
          name: 'Entire home/apt', type: 'bar', stack: 'one',
          data: entirePct.map((v, i) => ({
            value: v,
            itemStyle: { color: '#1f7a8c', opacity: isHi(districts[i]) ? 0.95 : 0.30 }
          })),
          label: { show: false }
        },
        {
          name: 'Private room', type: 'bar', stack: 'one',
          data: privPct.map((v, i) => ({
            value: v,
            itemStyle: { color: '#c2185b', opacity: isHi(districts[i]) ? 0.95 : 0.30 }
          })),
          label: { show: false }
        },
      ],
    };
  }

  return {
    mount() {
      const el = document.getElementById('chart-roomtype');
      chart = echarts.init(el);
      el._echartsInstance = chart;
      // Click a y-axis label → set district scope
      chart.on('click', params => {
        if (params.componentType === 'series') {
          const d = HK.DATA.roomtype.districts[params.dataIndex];
          const r = HK.DATA.density.region[d];
          HK.store.setScope({ level: 'district', region: r, district: d });
        }
      });
      new ResizeObserver(() => chart.resize()).observe(el);
      HK.store.subscribe(state => chart.setOption(build(state), true));
    }
  };
})();
