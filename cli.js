#!/usr/bin/env node
/**
 * text2echart CLI — zero-dep, CSV & JSON input
 *
 * Usage:
 *   node cli.js data.csv                          # CSV → bar chart
 *   node cli.js data.csv --type line              # CSV → line chart
 *   node cli.js data.csv --type pie               # CSV → pie chart
 *   node cli.js data.json -o chart.html           # JSON
 *   node cli.js data.csv --open                   # CSV → generate + open browser
 *   echo '{"series":[{"type":"bar","data":[30]}]}' | node cli.js -   # stdin
 */
const fs = require('fs'), path = require('path'), os = require('os');

const HELP = `
Usage: node cli.js <input> [options]

Input:  .json / .csv / "-" (stdin)
Options:
  -o, --out <file>  Output file (default: chart-N.html)
  --type <type>     Chart type for CSV: bar|line|pie|radar (default: bar)
  --theme <name>    dark|infographic|macarons|roma|shine|vintage
  --width <px>      Default: 800
  --height <px>     Default: 500
  --slide           960x540 PPT mode
  --svg             Use SVG renderer (HTML)
  --svg-output      Output standalone .svg file (needs Playwright)
  --open            Open HTML in browser after generation
  --embed           Embed ECharts lib (default, ~1MB)
  --help
`;

const THEME_MAP = {
  dark: ', "dark"', infographic: ', "infographic"', macarons: ', "macarons"',
  roma: ', "roma"', shine: ', "shine"', vintage: ', "vintage"',
};

// ===== CSV → ECharts =====
function csv2echart(text, chartType) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw 'CSV needs at least header + 1 row';

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    const cols = l.split(',').map(c => c.trim());
    return cols;
  });

  const names = rows.map(r => r[0]);             // first column = categories
  const series = headers.slice(1).map((h, si) => ({
    name: h,
    type: chartType,
    data: rows.map(r => parseFloat(r[si + 1]) || 0),
  }));

  const title = { text: path.basename(process.argv[2] || 'data'), left: 'center' };

  if (chartType === 'pie') {
    return {
      title, tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie', radius: ['30%', '60%'],
        data: rows.map(r => ({ name: r[0], value: parseFloat(r[1]) || 0 })),
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 13 },
        emphasis: { label: { fontSize: 16, fontWeight: 'bold' } },
      }],
    };
  }

  return {
    title, tooltip: { trigger: 'axis' },
    legend: { data: headers.slice(1), bottom: '0' },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: names },
    yAxis: { type: 'value' },
    series,
  };
}

function isCSV(text) {
  const first = text.trim().split('\n')[0];
  return first && first.includes(',') && !first.trim().startsWith('{') && !first.trim().startsWith('[');
}

// ===== HTML Generation =====
// FIX #6 + #8: CDN theme URLs with SRI hashes
function getThemeCDN() {
  const themes = {
    infographic: 'sha384-in3Jg9KdR2sThccpJ7/3ZNYEkY4/NtMeIgQI4TNqeYF9ghP6vNSjyqG9hH+rjIBL',
    macarons:    'sha384-kv7TIhTLTx/SkGRy+/4NvBQoM8PMpmZoGLHD/vgU4dkaJQUZseEoay4eEfuj8N3q',
    roma:        'sha384-SCicgVrdPgT4IxG9KpyKLvcsoTI5p69HI4iMKBS/5AJbvx9GMeQ8RYzwrnt6tQFx',
    shine:       'sha384-WoU7GchffFZe/llNaRfcHjMjnsBF7w7gw2yWGzU94gmHAWAz0OL50/Kjyg7RM/F+',
    vintage:     'sha384-Joi5np/IBXfTxpnrJnETdlvKsxhhsaJp9U57rXGChtjI6lgma3rPLZMMVRn1uU4X',
  };
  return Object.entries(themes).map(([t, sri]) =>
    `\n<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/theme/${t}.js" integrity="${sri}" crossorigin="anonymous"></script>`
  ).join('');
}

function makeHTML(optJson, opts) {
  const {title, theme, w, h, bg, slide, embed, svg} = opts;
  const ts = THEME_MAP[theme] || '';
  const init = `echarts.init(document.getElementById('chart')${ts}${svg ? ',{renderer:"svg"}' : ''})`;
  // FIX #8: CDN SRI hashes added; FIX #6: theme CDN added
  const wcExtra = optJson.includes('wordCloud') ? '\n<script src="https://cdn.jsdelivr.net/npm/echarts-wordcloud@2.1.0/dist/echarts-wordcloud.min.js" integrity="sha384-U1KEY0DDCF4Dq6Yx1J+EZ5Hnj8X5bMn52OAcJB8C4OiAWeU4iJhJ/Tv5KhTqu8zZ" crossorigin="anonymous"></script>\n' : '';
  const base = embed ? loadLocal() : `<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js" integrity="sha384-pPi0zxBAoDu6+JXW/C68UZLvBUUtU+7zonhif43rqj7pxsGyqyqzcian2Rj37Rss" crossorigin="anonymous"></script>${wcExtra}${getThemeCDN()}`;

  if (slide) return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title>${base}<style>body{margin:0;background:#1a1a2e}.slide{width:960px;height:540px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(135deg,#1a1a2e,#16213e);page-break-after:always}.slide-title{color:#4facfe;font-size:28px;margin-bottom:20px}.slide-chart{width:900px;height:400px}</style></head><body><div class="slide"><div class="slide-title">${title}</div><div id="chart" class="slide-chart"></div></div><script>var chart=${init};chart.setOption(${optJson});</script></body></html>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title>${base}<style>body{margin:0;background:${bg};display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}#chart{width:${w}px;height:${h}px;box-shadow:0 4px 20px rgba(0,0,0,0.1);border-radius:12px;background:#fff}</style></head><body><div id="chart"></div><script>var chart=${init};var option=${optJson};chart.setOption(option);window.addEventListener('resize',function(){chart.resize()});</script></body></html>`;
}

function loadLocal() {
  // FIX #6: Load echarts core + wordcloud first, then all theme files
  const lib = path.join(__dirname, 'lib');
  let s = '';
  for (const f of ['echarts-5.6.min.js', 'echarts-wordcloud-2.1.min.js']) {
    const p = path.join(lib, f);
    if (fs.existsSync(p)) s += '<script>' + fs.readFileSync(p) + '</script>\n';
  }
  // FIX #6: embed all 6 theme files from lib/
  const themeFiles = fs.readdirSync(lib)
    .filter(f => f.startsWith('echarts-theme-') && f.endsWith('.js'))
    .sort();
  for (const f of themeFiles) {
    const p = path.join(lib, f);
    s += '<script>' + fs.readFileSync(p) + '</script>\n';
  }
  return s;
}

// ===== Main =====
async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help')) { console.log(HELP); return; }

  let inputFile, out, chartType = 'bar', doOpen = false;
  const o = { theme: 'dark', w: 800, h: 500, slide: false, bg: '#1a1a2e', embed: true, svg: true, svgOutput: false };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-o' || a === '--out') out = args[++i];
    else if (a === '--type') chartType = args[++i];
    else if (a === '--open') doOpen = true;
    else if (a === '--cdn') o.embed = false;
    else if (a === '--embed') o.embed = true;
    else if (a === '--theme') o.theme = args[++i];
    else if (a === '--width') o.w = parseInt(args[++i]) || 800;
    else if (a === '--height') o.h = parseInt(args[++i]) || 500;
    else if (a === '--slide') o.slide = true;
    else if (a === '--svg') o.svg = true;
    else if (a === '--svg-output') { o.svgOutput = true; }
    else inputFile = a;
  }
  if (o.theme !== 'dark') o.bg = '#f5f5f5';

  // Read input
  const raw = inputFile === '-' ? fs.readFileSync('/dev/stdin', 'utf-8') : fs.readFileSync(path.resolve(inputFile), 'utf-8');

  let echartsOpt;
  if (isCSV(raw)) {
    echartsOpt = csv2echart(raw, chartType);
  } else {
    const input = JSON.parse(raw);
    const {options:meta, ...rest} = input;
    echartsOpt = rest;
    // Merge inline options
    if (meta) Object.assign(o, meta);
  }

  const title = typeof echartsOpt.title === 'string' ? echartsOpt.title : (echartsOpt.title?.text || 'chart');
  const html = makeHTML(JSON.stringify(echartsOpt), {...o, title});
  
  // --svg-output: extract SVG from rendered HTML (requires Playwright)
  if (o.svgOutput) {
    try {
      const {chromium} = require('playwright');
      const tmpHtml = `/tmp/text2echart_${Date.now()}.html`;
      fs.writeFileSync(tmpHtml, html);
      const browser = await chromium.launch({headless:true});
      const page = await browser.newPage({viewport:{width:o.w,height:o.h}});
      await page.goto('file://' + tmpHtml, {waitUntil:'load',timeout:15000}).catch(()=>{});
      await page.waitForTimeout(3000);
      const svg = await page.evaluate(() => {
        const s = document.querySelector('svg');
        if (!s) return '';
        const w=s.viewBox.baseVal.width||760;
        const h=s.viewBox.baseVal.height||500;
        s.setAttribute('width','800'); s.setAttribute('height','500');
        s.setAttribute('viewBox','0 0 '+w+' '+h);
        s.style.position='static'; s.style.display='block'; s.style.background='#fff';
        return new XMLSerializer().serializeToString(s);
      });
      const file = out || `chart_${Date.now().toString(36)}.svg`;
      fs.writeFileSync(file, '<?xml version="1.0" encoding="UTF-8"?>\n' + svg);
      console.log(`✅ ${file}`);
      await browser.close();
      fs.unlinkSync(tmpHtml);
    } catch(e) {
      console.error('❌ Playwright required for SVG output: npm install playwright');
      process.exit(1);
    }
  } else {
    const file = out || `chart_${Date.now().toString(36)}.html`;
    fs.writeFileSync(file, html);
    console.log(`✅ ${file}`);
  }

  if (doOpen) {
    console.log('   Open manually: ' + path.resolve(file));
  }
}

main().catch(e => { console.error('❌', e.message || e); process.exit(1); });
