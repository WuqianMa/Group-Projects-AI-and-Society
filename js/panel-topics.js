// PANEL E — Topic bars + word cloud, one row per segment of compare-axis.
window.HK = window.HK || {};

HK.panelTopics = (function () {
  let charts = []; // {bar: ec, cloud: ec, el: div}

  const SEGMENT_LABELS = {
    'en': 'English reviewers',
    'zh-CN': 'Simplified Chinese reviewers',
    'zh-TW': 'Traditional Chinese reviewers',
    'Short': 'Short stay (≤3n)',
    'Medium': 'Medium stay (4–7n)',
    'Long': 'Long stay (≥8n)',
    'Solo-Couple': 'Solo / Couple',
    'Small': 'Small group (3–4)',
    'Large': 'Large group (≥5)',
  };

  const SEGMENT_COLORS = {
    'en':         '#1f3a5f',
    'zh-CN':      '#b35900',
    'zh-TW':      '#4a7c59',
    'Short':      '#1f7a8c',
    'Medium':     '#6aa3d5',
    'Long':       '#1f3a5f',
    'Solo-Couple':'#c2185b',
    'Small':      '#9b6b9e',
    'Large':      '#4a7c59',
  };

  function buildBar(themes, shares, color) {
    const sortable = themes.map(t => ({ t, v: shares[t] || 0 })).sort((a,b) => a.v - b.v);
    return {
      grid: { left: 145, right: 28, top: 4, bottom: 18 },
      xAxis: { type: 'value', axisLabel: { formatter: '{value}%', fontSize: 10 } },
      yAxis: { type: 'category', data: sortable.map(s => s.t), axisLabel: { fontSize: 10 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
                 formatter: params => `${params[0].name}: ${params[0].value.toFixed(1)}% of reviews mention this` },
      series: [{
        type: 'bar', barWidth: 9,
        data: sortable.map(s => ({ value: s.v * 100, itemStyle: { color } })),
        label: { show: true, position: 'right', fontSize: 9, formatter: p => p.value.toFixed(0) + '%' }
      }],
    };
  }

  function buildCloud(tokens, color) {
    return {
      tooltip: { show: true, formatter: p => `${p.name}: ${p.value.toLocaleString()}` },
      series: [{
        type: 'wordCloud',
        gridSize: 6,
        sizeRange: [10, 32],
        rotationRange: [0, 0],
        shape: 'circle',
        width: '95%', height: '95%',
        textStyle: { color },
        data: tokens,
      }],
    };
  }

  function render(state) {
    const scopeId = HK.scopeId(state.scope);
    const axis = state.compareBy;
    const segOrder = (axis === 'language' ? ['en','zh-CN','zh-TW']
                  : axis === 'stay'     ? ['Short','Medium','Long']
                                        : ['Solo-Couple','Small','Large']);
    const topicScope = HK.DATA.topics.scopes[scopeId] || HK.DATA.topics.scopes['all'];
    const cloudScope = HK.DATA.wordcloud.scopes[scopeId] || HK.DATA.wordcloud.scopes['all'];
    const themes = HK.DATA.topics.themes;

    const grid = document.getElementById('topics-grid');
    grid.innerHTML = '';
    charts = [];

    segOrder.forEach(seg => {
      const row = document.createElement('div');
      row.className = 'topics-row';
      const segColor = SEGMENT_COLORS[seg] || '#1f3a5f';
      row.innerHTML = `
        <div class="seg-label" style="color:${segColor}">${SEGMENT_LABELS[seg] || seg}</div>
        <div class="topic-bars" id="topic-bars-${seg}"></div>
        <div class="wordcloud" id="wordcloud-${seg}"></div>
      `;
      grid.appendChild(row);

      const barEl = document.getElementById(`topic-bars-${seg}`);
      const cloudEl = document.getElementById(`wordcloud-${seg}`);
      const barChart = echarts.init(barEl);
      const cloudChart = echarts.init(cloudEl);
      barEl._echartsInstance = barChart;
      cloudEl._echartsInstance = cloudChart;

      const shares = (topicScope[axis] && topicScope[axis][seg]) || {};
      const tokens = (cloudScope[axis] && cloudScope[axis][seg]) || [];

      barChart.setOption(buildBar(themes, shares, segColor));
      if (tokens.length === 0) {
        cloudChart.setOption({
          graphic: { type: 'text', left: 'center', top: 'middle',
                     style: { text: '(no tokens in scope)', fill: '#999', fontSize: 12 } }
        });
      } else {
        cloudChart.setOption(buildCloud(tokens, segColor));
      }
      charts.push({ bar: barChart, cloud: cloudChart });
    });
  }

  return {
    mount() {
      HK.store.subscribe(render);
      window.addEventListener('resize', () => {
        charts.forEach(c => { c.bar.resize(); c.cloud.resize(); });
      });
    }
  };
})();
