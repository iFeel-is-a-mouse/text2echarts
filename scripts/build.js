#!/usr/bin/env node
/**
 * text2echart — Build script
 *
 * Usage: node scripts/build.js <option.json> [output.html]
 *
 * Input: ECharts option JSON + options metadata
 * Output: self-contained HTML (embedded ECharts, offline)
 */

const fs = require('fs');
const path = require('path');

const THEME_MAP = {
  dark: ', "dark"', infographic: ', "infographic"', macarons: ', "macarons"',
  roma: ', "roma"', shine: ', "shine"', vintage: ', "vintage"',
};

function loadECharts() {
  const libDir = path.join(__dirname, '..', 'lib');
  const webLibDir = path.join(__dirname, '..', 'lib'); // FIX #6: themes live in lib/
  const echartsFile = path.join(libDir, 'echarts-5.6.min.js');
  const wcFile = path.join(libDir, 'echarts-wordcloud-2.1.min.js');
  
  let script = '';
  // FIX #8: CDN SRI hashes added
  if (fs.existsSync(echartsFile)) {
    script += '<script>' + fs.readFileSync(echartsFile, 'utf-8') + '</script>\n';
  } else {
    script += '<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js" integrity="sha384-pPi0zxBAoDu6+JXW/C68UZLvBUUtU+7zonhif43rqj7pxsGyqyqzcian2Rj37Rss" crossorigin="anonymous"></script>\n';
  }
  if (fs.existsSync(wcFile)) {
    script += '<script>' + fs.readFileSync(wcFile, 'utf-8') + '</script>\n';
  } else {
    script += '<script src="https://cdn.jsdelivr.net/npm/echarts-wordcloud@2.1.0/dist/echarts-wordcloud.min.js" integrity="sha384-U1KEY0DDCF4Dq6Yx1J+EZ5Hnj8X5bMn52OAcJB8C4OiAWeU4iJhJ/Tv5KhTqu8zZ" crossorigin="anonymous"></script>\n';
  }
  // FIX #6 + #8: Load all 6 theme files from lib/ (embed) or CDN with SRI (fallback)
  const themeFiles = ['dark', 'infographic', 'macarons', 'roma', 'shine', 'vintage'];
  const themeSRI = {
    dark:         'sha384-todo-dark',  // ECharts 5.x built-in; local-only
    infographic:  'sha384-in3Jg9KdR2sThccpJ7/3ZNYEkY4/NtMeIgQI4TNqeYF9ghP6vNSjyqG9hH+rjIBL',
    macarons:     'sha384-kv7TIhTLTx/SkGRy+/4NvBQoM8PMpmZoGLHD/vgU4dkaJQUZseEoay4eEfuj8N3q',
    roma:         'sha384-SCicgVrdPgT4IxG9KpyKLvcsoTI5p69HI4iMKBS/5AJbvx9GMeQ8RYzwrnt6tQFx',
    shine:        'sha384-WoU7GchffFZe/llNaRfcHjMjnsBF7w7gw2yWGzU94gmHAWAz0OL50/Kjyg7RM/F+',
    vintage:      'sha384-Joi5np/IBXfTxpnrJnETdlvKsxhhsaJp9U57rXGChtjI6lgma3rPLZMMVRn1uU4X',
  };
  for (const t of themeFiles) {
    const localPath = path.join(webLibDir, `echarts-theme-${t}.js`);
    if (fs.existsSync(localPath)) {
      script += '<script>' + fs.readFileSync(localPath, 'utf-8') + '</script>\n';
    } else if (t !== 'dark') {
      // dark theme is built into ECharts 5.x; others need CDN fallback
      script += `<script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/theme/${t}.js" integrity="${themeSRI[t]}" crossorigin="anonymous"></script>\n`;
    }
  }
  return script;
}

function build(optionJson, meta, scripts) {
  const { title, theme, width, height, bgColor, slideMode } = meta;
  return slideMode
    ? makeSlide(title, optionJson, theme, scripts)
    : makePage(title, optionJson, theme, width, height, bgColor, scripts);
}

function makePage(title, opt, theme, w, h, bg, scripts) {
  const themeStr = THEME_MAP[theme] || '';
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
${scripts}
<style>body{margin:0;background:${bg};display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}#chart{width:${w}px;height:${h}px;box-shadow:0 4px 20px rgba(0,0,0,0.1);border-radius:12px;background:#fff}</style></head>
<body><div id="chart"></div>
<script>var chart=echarts.init(document.getElementById('chart')${themeStr});var option=${opt};chart.setOption(option);window.addEventListener('resize',function(){chart.resize()});</script></body></html>`;
}

function makeSlide(title, opt, theme, scripts) {
  const themeStr = THEME_MAP[theme] || '';
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
${scripts}
<style>body{margin:0;background:#1a1a2e}.slide{width:960px;height:540px;margin:0 auto;display:flex;flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(135deg,#1a1a2e,#16213e);page-break-after:always}.slide-title{color:#4facfe;font-size:28px;margin-bottom:20px;font-weight:bold}.slide-chart{width:900px;height:400px}</style></head>
<body><div class="slide"><div class="slide-title">${title}</div><div id="chart" class="slide-chart"></div></div>
<script>var chart=echarts.init(document.getElementById('chart')${themeStr});chart.setOption(${opt});</script></body></html>`;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args.length) { console.log('Usage: node scripts/build.js <input.json> [output.html]'); process.exit(1); }

  const input = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
  const meta = input.options || {};
  const { options, ...echartsOption } = input;
  const title = (typeof echartsOption.title === 'string' ? echartsOption.title : echartsOption.title?.text) || 'dataviz';

  const env = {
    title,
    theme: meta.theme || 'dark',
    width: meta.width || 800,
    height: meta.height || 500,
    bgColor: meta.transparent_bg ? 'transparent' : ((meta.theme || 'dark') === 'dark' ? '#1a1a2e' : '#f5f5f5'),
    slideMode: meta.slide_mode || false,
  };

  const scripts = loadECharts();
  const html = build(JSON.stringify(echartsOption, null, 2), env, scripts);
  const out = args[1] || `chart_${Date.now().toString(36)}.html`;
  fs.writeFileSync(out, html, 'utf-8');
  console.log(`✅ ${out}`);
}

module.exports = { build, loadECharts };
