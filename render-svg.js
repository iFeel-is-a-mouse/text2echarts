const { chromium } = require('/usr/local/lib/node_modules/@playwright/test/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const projectDir = '/Users/guohaiqiu/.openclaw/workspace/projects/text2echart';

const charts = [
  {
    name: 'bar-chart',
    option: {
      title: { text: 'Bar Chart — Multi-Style Demo', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Sales', 'Profit'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: ['Jan','Feb','Mar','Apr','May','Jun'] },
      yAxis: { type: 'value' },
      color: ['#e74c3c', '#f39c12'],
      series: [
        { name: 'Sales', type: 'bar', data: [120,200,150,80,230,180], itemStyle: { borderRadius: [6,6,0,0] }, label: { show: true, position: 'top' } },
        { name: 'Profit', type: 'bar', data: [70,110,95,50,130,100], itemStyle: { borderRadius: [6,6,0,0] }, label: { show: true, position: 'top' } }
      ]
    }
  },
  {
    name: 'pie-chart',
    option: {
      title: { text: 'Browser Market Share', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: [
          { value: 65, name: 'Chrome' },
          { value: 18, name: 'Safari' },
          { value: 8, name: 'Edge' },
          { value: 5, name: 'Firefox' },
          { value: 4, name: 'Other' }
        ],
        label: { formatter: '{b}\n{d}%' },
        emphasis: { label: { fontSize: 16, fontWeight: 'bold' } }
      }]
    }
  },
  {
    name: 'wordcloud',
    option: {
      title: { text: 'Word Cloud — AI/ML Terms', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        sizeRange: [14, 56],
        rotationRange: [-60, 60],
        rotationStep: 30,
        gridSize: 6,
        textStyle: { fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
        emphasis: { focus: 'self', textStyle: { shadowBlur: 10, shadowColor: '#333' } },
        data: [
          { name: 'Machine Learning', value: 98 }, { name: 'Deep Learning', value: 92 },
          { name: 'Neural Network', value: 88 }, { name: 'Data Science', value: 85 },
          { name: 'Python', value: 82 }, { name: 'Algorithm', value: 78 },
          { name: 'Computer Vision', value: 75 }, { name: 'NLP', value: 72 },
          { name: 'Reinforcement', value: 68 }, { name: 'Transformer', value: 65 },
          { name: 'CNN', value: 62 }, { name: 'RNN', value: 58 },
          { name: 'TensorFlow', value: 55 }, { name: 'PyTorch', value: 52 },
          { name: 'Regression', value: 48 }, { name: 'Classification', value: 45 },
          { name: 'Clustering', value: 42 }, { name: 'Embedding', value: 38 },
          { name: 'Attention', value: 35 }, { name: 'GPT', value: 32 },
          { name: 'BERT', value: 30 }, { name: 'GAN', value: 28 },
          { name: 'Autoencoder', value: 25 }, { name: 'Backpropagation', value: 22 },
          { name: 'Gradient', value: 20 }, { name: 'Optimizer', value: 18 }
        ]
      }]
    }
  }
];

(async () => {
  const browser = await chromium.launch();
  
  for (const chart of charts) {
    const page = await browser.newPage();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<script>${fs.readFileSync(path.join(projectDir, 'lib/echarts-5.6.min.js'), 'utf8')}<\/script>
<script>${fs.readFileSync(path.join(projectDir, 'lib/echarts-wordcloud-2.1.min.js'), 'utf8')}<\/script>
<style>body{margin:0;padding:0;background:#fff}</style>
</head><body><div id="chart" style="width:800px;height:500px"></div>
<script>
var c = echarts.init(document.getElementById('chart'), null, {renderer:'svg'});
c.setOption(${JSON.stringify(chart.option)});
<\/script></body></html>`;
    
    await page.setContent(html);
    await page.waitForSelector('svg', { timeout: 10000 });
    await page.waitForTimeout(1500);
    
    // Extract the actual ECharts SVG element (skip the wrapper div)
    const svgContent = await page.$eval('#chart svg', el => el.outerHTML);
    const svg = svgContent;
    
    const outPath = path.join(projectDir, 'assets', `${chart.name}.svg`);
    fs.writeFileSync(outPath, svg);
    console.log(`${chart.name}.svg: ${svg.length} bytes`);
    await page.close();
  }
  
  await browser.close();
  console.log('Done!');
})();
