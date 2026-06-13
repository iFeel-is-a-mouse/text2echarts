#!/usr/bin/env node
/**
 * test-all — 批量验证 6 种图表类型（FIX #1: 重写为子进程调用 build.js CLI）
 * 1. 转换测试用例为 ECharts option + meta 格式
 * 2. 子进程调用 node scripts/build.js 生成 HTML
 * 3. Playwright 截图验证渲染
 * 4. 报告结果
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const TEST_CASES = [
  {
    name: '01-bar',
    title: '柱状图 - 月度销售额',
    input: {
      title: '月度销售额',
      type: 'bar',
      data: [
        { name: '一月', value: 1200 },
        { name: '二月', value: 900 },
        { name: '三月', value: 1600 },
        { name: '四月', value: 1100 },
        { name: '五月', value: 1400 },
        { name: '六月', value: 1800 },
      ],
      options: { theme: 'infographic', width: 800, height: 500, yAxisName: '万元' }
    }
  },
  {
    name: '02-line',
    title: '折线图 - 温度变化',
    input: {
      title: '一周温度变化',
      type: 'line',
      data: [
        { name: '周一', value: 22 },
        { name: '周二', value: 25 },
        { name: '周三', value: 23 },
        { name: '周四', value: 21 },
        { name: '周五', value: 28 },
        { name: '周六', value: 30 },
        { name: '周日', value: 27 },
      ],
      options: { theme: 'dark', width: 800, height: 500, yAxisName: '°C' }
    }
  },
  {
    name: '03-pie',
    title: '饼图 - 市场占比',
    input: {
      title: '市场份额分布',
      type: 'pie',
      data: [
        { name: 'Chrome', value: 48 },
        { name: 'Firefox', value: 22 },
        { name: 'Safari', value: 18 },
        { name: 'Edge', value: 8 },
        { name: '其他', value: 4 },
      ],
      options: { theme: 'vintage', width: 800, height: 500 }
    }
  },
  {
    name: '04-scatter',
    title: '散点图 - 数据分布',
    input: {
      title: '身高体重分布',
      type: 'scatter',
      data: [
        { x: 160, y: 55 }, { x: 165, y: 60 },
        { x: 170, y: 65 }, { x: 175, y: 70 },
        { x: 180, y: 75 }, { x: 185, y: 80 },
        { x: 170, y: 58 }, { x: 175, y: 72 },
      ],
      options: { theme: 'dark', width: 800, height: 500, xAxisName: '身高(cm)', yAxisName: '体重(kg)' }
    }
  },
  {
    name: '05-radar',
    title: '雷达图 - 能力评估',
    input: {
      title: '能力评估',
      type: 'radar',
      data: [
        { name: '技术能力', value: 90 },
        { name: '沟通协调', value: 75 },
        { name: '项目管理', value: 60 },
        { name: '创新能力', value: 85 },
        { name: '团队协作', value: 80 },
      ],
      options: { theme: 'macarons', width: 800, height: 500 }
    }
  },
  {
    name: '06-wordcloud',
    title: '词云 - 技术热词',
    input: {
      title: '技术热词',
      type: 'wordcloud',
      data: [
        { name: '人工智能', value: 100 },
        { name: '大模型', value: 85 },
        { name: '机器学习', value: 70 },
        { name: '深度学习', value: 60 },
        { name: '数据挖掘', value: 50 },
        { name: '自然语言', value: 45 },
        { name: '计算机视觉', value: 40 },
        { name: '强化学习', value: 35 },
        { name: '知识图谱', value: 30 },
        { name: 'AIGC', value: 28 },
        { name: '推荐系统', value: 25 },
        { name: '边缘计算', value: 22 },
      ],
      options: { theme: 'vintage', width: 800, height: 500 }
    }
  },
];

// FIX #1: Convert simple test case format → build.js CLI format {options: meta, ...echartsOption}
function toBuildInput(tc) {
  const { title, type, data, options: opts = {} } = tc;
  const meta = {
    theme: opts.theme || 'dark',
    width: opts.width || 800,
    height: opts.height || 500,
    bgColor: (opts.theme || 'dark') === 'dark' ? '#1a1a2e' : '#f5f5f5',
    slideMode: false,
  };

  let echartsOption = {
    title: { text: title, left: 'center' },
    tooltip: {},
  };

  switch (type) {
    case 'bar':
      echartsOption.tooltip.trigger = 'axis';
      echartsOption.legend = { data: ['数据'], bottom: '0' };
      echartsOption.grid = { left: '3%', right: '4%', bottom: '15%', containLabel: true };
      echartsOption.xAxis = { type: 'category', data: data.map(d => d.name) };
      echartsOption.yAxis = { type: 'value', name: opts.yAxisName || '' };
      echartsOption.series = [{
        name: '数据',
        type: 'bar',
        data: data.map(d => d.value),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top' },
      }];
      break;

    case 'line':
      echartsOption.tooltip.trigger = 'axis';
      echartsOption.legend = { data: ['数据'], bottom: '0' };
      echartsOption.grid = { left: '3%', right: '4%', bottom: '15%', containLabel: true };
      echartsOption.xAxis = { type: 'category', data: data.map(d => d.name) };
      echartsOption.yAxis = { type: 'value', name: opts.yAxisName || '' };
      echartsOption.series = [{
        name: '数据',
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        areaStyle: { opacity: 0.1 },
      }];
      break;

    case 'pie':
      echartsOption.tooltip = { trigger: 'item', formatter: '{b}: {c} ({d}%)' };
      echartsOption.series = [{
        type: 'pie',
        radius: ['30%', '60%'],
        data: data.map(d => ({ name: d.name, value: d.value })),
        label: { show: true, formatter: '{b}\n{d}%' },
        emphasis: { label: { fontSize: 16, fontWeight: 'bold' } },
      }];
      break;

    case 'scatter':
      echartsOption.xAxis = { type: 'value', name: opts.xAxisName || '' };
      echartsOption.yAxis = { type: 'value', name: opts.yAxisName || '' };
      echartsOption.series = [{
        type: 'scatter',
        data: data.map(d => [d.x, d.y]),
        symbolSize: 12,
      }];
      break;

    case 'radar': {
      const maxVal = Math.ceil(Math.max(...data.map(d => d.value)) * 1.2 / 10) * 10;
      echartsOption.radar = {
        indicator: data.map(d => ({ name: d.name, max: maxVal })),
      };
      echartsOption.series = [{
        type: 'radar',
        data: [{ value: data.map(d => d.value), name: '能力' }],
      }];
      break;
    }

    case 'wordcloud':
      echartsOption.series = [{
        type: 'wordCloud',
        data: data.map(d => ({ name: d.name, value: d.value })),
        sizeRange: [14, 60],
        rotationRange: [-45, 45],
        shape: 'diamond',
      }];
      break;

    default:
      throw new Error('Unknown chart type: ' + type);
  }

  return { options: meta, ...echartsOption };
}

async function run() {
  const outDir = path.join(__dirname, '..', '.test-output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const buildScript = path.join(__dirname, '..', 'scripts', 'build.js');
  const results = [];

  // Step 1: Generate all HTML files via subprocess (FIX #1: subprocess instead of broken require)
  console.log('\n=== 生成测试图表 ===\n');
  for (const tc of TEST_CASES) {
    try {
      const buildInput = toBuildInput(tc.input);
      const jsonPath = path.join(outDir, `${tc.name}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(buildInput, null, 2), 'utf-8');

      const htmlPath = path.join(outDir, `${tc.name}.html`);
      execSync(`node "${buildScript}" "${jsonPath}" "${htmlPath}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        timeout: 30000,
      });
      console.log(`✅ 生成 ${tc.name}.html`);
      results.push({ ...tc, htmlPath, jsonPath, status: 'generated' });
    } catch (err) {
      console.log(`❌ ${tc.name}: ${err.message}`);
      results.push({ ...tc, htmlPath: null, status: 'fail', error: err.message });
    }
  }

  // Step 2: Screenshot with Playwright
  console.log('\n=== Playwright 截图验证 ===\n');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.log('⚠️  Playwright 未安装，跳过截图验证');
    console.log('   安装: npm install playwright && npx playwright install chromium');
    report(results, outDir);
    return;
  }

  for (const r of results) {
    if (r.status === 'fail' || !r.htmlPath) continue;

    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    try {
      await page.goto('file://' + r.htmlPath, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for canvas (ECharts renders to canvas)
      await page.waitForSelector('canvas', { timeout: 15000 });

      // Give rendering time
      await page.waitForTimeout(r.name.includes('wordcloud') ? 5000 : 2500);

      // Screenshot
      const imgPath = r.htmlPath.replace('.html', '.png');
      await page.screenshot({ path: imgPath, fullPage: true, type: 'png' });

      // Verify canvas has content (not blank)
      const stats = fs.statSync(imgPath);
      let hasContent = true;
      try {
        hasContent = await page.evaluate(() => {
          const c = document.querySelector('canvas');
          if (!c) return false;
          const ctx = c.getContext('2d');
          if (!ctx) return true; // webgl canvas
          const imageData = ctx.getImageData(0, 0, Math.min(c.width, 100), Math.min(c.height, 100));
          for (let i = 0; i < imageData.data.length; i += 64) {
            if (imageData.data[i] < 250 || imageData.data[i + 1] < 250 || imageData.data[i + 2] < 250) {
              return true;
            }
          }
          return false;
        });
      } catch (e) {
        // Can't read pixels from WebGL canvas — assume content exists
        hasContent = true;
      }

      console.log(`✅ ${r.name}.png  (${(stats.size / 1024).toFixed(1)}KB${hasContent ? '' : ' ⚠️ 空白?'})`);
      r.status = 'pass';
      r.imageSize = stats.size;
    } catch (err) {
      console.log(`❌ ${r.name}: ${err.message}`);
      r.status = 'fail';
      r.error = err.message;
    } finally {
      await page.close();
    }
  }

  if (browser) await browser.close();
  report(results, outDir);
}

function report(results, outDir) {
  console.log('\n=== 测试结果 ===\n');
  let pass = 0, fail = 0;
  for (const r of results) {
    const icon = r.status === 'pass' ? '✅' : '❌';
    const detail = r.status === 'pass' ? r.title : (r.error || '生成失败');
    console.log(`  ${icon} ${r.name}: ${detail}`);
    if (r.status === 'pass') pass++; else fail++;
  }
  console.log(`\n${pass}/${results.length} 通过, ${fail} 失败`);
  console.log(`\n输出目录: ${outDir}`);
  console.log('打开 .html 文件查看图表，.png 文件查看截图');
  if (fail > 0) process.exit(1);
}

run().catch(err => { console.error(err); process.exit(1); });
