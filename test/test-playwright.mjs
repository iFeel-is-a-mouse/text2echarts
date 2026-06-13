/**
 * Playwright E2E Test Suite for text2echart Web Application
 *
 * Tests: page loading, template loading, chart generation, theme switching,
 * export functionality, English version, responsive design
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8899';
const RESULTS = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function record(name, pass, detail = '') {
  RESULTS.total++;
  if (pass) {
    RESULTS.passed++;
    console.log(`  ✅ ${name}`);
  } else {
    RESULTS.failed++;
    console.log(`  ❌ ${name} — ${detail}`);
  }
  RESULTS.details.push({ name, pass, detail });
}

// Wait for the chart canvas to have actual rendered content
async function waitForChartRendered(page, timeout = 8000) {
  // Wait for the canvas element to be present and have content
  await page.waitForSelector('#chart canvas', { timeout });
  // Give ECharts time to render
  await page.waitForTimeout(1500);
  // Check that the canvas has actual content (not blank)
  const canvasContent = await page.evaluate(() => {
    const canvas = document.querySelector('#chart canvas');
    if (!canvas) return { exists: false, width: 0, height: 0 };
    return {
      exists: true,
      width: canvas.width,
      height: canvas.height
    };
  });
  return canvasContent;
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('text2echart Web — Playwright E2E Test Suite');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });

  try {
    // ================================================================
    // TEST 1: Page Loading — Chinese Version
    // ================================================================
    console.log('\n📋 SECTION 1: Page Loading (中文版)');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/text2echarts.html`, { waitUntil: 'networkidle', timeout: 15000 });

      // Check title
      const title = await page.title();
      record('Page title', title === 'ECharts图表生成器', `Got: "${title}"`);

      // Check that chart canvas exists
      const canvasExists = await page.$('#chart canvas');
      record('Canvas element exists', !!canvasExists, canvasExists ? 'OK' : 'No canvas found');

      // Check initial template loading (pie chart template)
      const textareaValue = await page.$eval('#optionInput', el => el.value);
      record('Initial template loaded (pie)', textareaValue.includes('市场份额'), textareaValue.length > 100 ? `Length: ${textareaValue.length}` : 'Too short');

      // Check for JS errors
      record('No JS errors on load', jsErrors.length === 0, jsErrors.length > 0 ? jsErrors.join('; ') : 'OK');

      // Wait for chart to render after initial template
      const canvasInfo = await waitForChartRendered(page);
      record('Chart rendered after load', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      await page.close();
    }

    // ================================================================
    // TEST 2: Template Loading
    // ================================================================
    console.log('\n📋 SECTION 2: Template Loading');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/text2echarts.html`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Test bar chart template
      await page.click('#barTemplate');
      await page.waitForTimeout(2000);
      let textareaVal = await page.$eval('#optionInput', el => el.value);
      record('Bar template loaded', textareaVal.includes('水果销售'), `Contains "水果销售": ${textareaVal.includes('水果销售')}`);
      let canvasInfo = await waitForChartRendered(page);
      record('Bar chart rendered', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);
      record('Bar template has function string', (await page.$eval('#functionInput', el => el.value)).includes('publicVar'), 'Function string present');

      // Test line chart template
      await page.click('#lineTemplate');
      await page.waitForTimeout(2000);
      textareaVal = await page.$eval('#optionInput', el => el.value);
      record('Line template loaded', textareaVal.includes('温度变化'), `Contains "温度变化": ${textareaVal.includes('温度变化')}`);
      canvasInfo = await waitForChartRendered(page);
      record('Line chart rendered', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      // Test pie chart template
      await page.click('#pieTemplate');
      await page.waitForTimeout(2000);
      textareaVal = await page.$eval('#optionInput', el => el.value);
      record('Pie template loaded', textareaVal.includes('市场份额'), `Contains "市场份额": ${textareaVal.includes('市场份额')}`);
      canvasInfo = await waitForChartRendered(page);
      record('Pie chart rendered', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      // Test word cloud template
      await page.click('#cloudTemplate');
      await page.waitForTimeout(2000);
      textareaVal = await page.$eval('#optionInput', el => el.value);
      record('Word cloud template loaded', textareaVal.includes('wordCloud'), `Contains "wordCloud": ${textareaVal.includes('wordCloud')}`);
      canvasInfo = await waitForChartRendered(page);
      record('Word cloud rendered', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      record('No JS errors during template tests', jsErrors.length === 0, jsErrors.length > 0 ? jsErrors.join('; ') : 'OK');

      await page.close();
    }

    // ================================================================
    // TEST 3: Chart Generation with Custom Input
    // ================================================================
    console.log('\n📋 SECTION 3: Chart Generation (Custom Input)');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/text2echarts.html`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Clear and set custom JSON
      await page.click('#clearBtn');
      await page.waitForTimeout(500);

      const customOption = JSON.stringify({
        title: { text: '测试图表', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
        yAxis: { type: 'value' },
        series: [{ name: '测试', type: 'bar', data: [10, 20, 30, 40] }]
      });
      await page.fill('#optionInput', customOption);

      // Click generate button
      await page.click('#generateBtn');
      await page.waitForTimeout(2000);

      // Check canvas rendered
      const canvasInfo = await waitForChartRendered(page);
      record('Custom bar chart rendered', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      // Check status text
      const statusText = await page.$eval('#statusText', el => el.textContent);
      record('Status shows "图表生成完成"', statusText.includes('图表生成完成'), `Status: "${statusText}"`);

      // Check error panel is hidden
      const errorPanelVisible = await page.$eval('#errorPanel', el => el.classList.contains('active'));
      record('No error panel visible', !errorPanelVisible, errorPanelVisible ? 'Error panel active' : 'OK');

      record('No JS errors during custom chart', jsErrors.length === 0, jsErrors.length > 0 ? jsErrors.join('; ') : 'OK');

      await page.close();
    }

    // ================================================================
    // TEST 4: Theme Switching
    // ================================================================
    console.log('\n📋 SECTION 4: Theme Switching');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/text2echarts.html`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      // First load a template
      await page.click('#barTemplate');
      await page.waitForTimeout(2000);

      let canvasInfo = await waitForChartRendered(page);
      record('Initial chart rendered (bar)', canvasInfo.width > 0 && canvasInfo.height > 0, `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      // Test theme switching — each theme should re-render
      const themes = [
        { value: 'dark', label: '暗色' },
        { value: 'infographic', label: '信息图' },
        { value: 'roma', label: '罗马' },
        { value: 'vintage', label: '复古' },
        { value: 'shine', label: '闪耀' },
        { value: 'macarons', label: '马卡龙' },
      ];

      for (const theme of themes) {
        await page.selectOption('#chartTheme', theme.value);
        await page.waitForTimeout(1500);
        canvasInfo = await waitForChartRendered(page);
        record(`Theme "${theme.label}" renders`, canvasInfo.width > 0 && canvasInfo.height > 0,
          `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);
      }

      record('No JS errors during theme switching', jsErrors.length === 0, jsErrors.length > 0 ? jsErrors.join('; ') : 'OK');

      await page.close();
    }

    // ================================================================
    // TEST 5: Export Functionality
    // ================================================================
    console.log('\n📋 SECTION 5: Export Functionality');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/text2echarts.html`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Load a template first
      await page.click('#pieTemplate');
      await page.waitForTimeout(2000);
      await waitForChartRendered(page);

      // Test PNG export — triggers a download
      const [downloadPng] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
        page.click('#exportPng')
      ]);
      record('PNG export triggers download', !!downloadPng, downloadPng ? `Filename: ${downloadPng.suggestedFilename()}` : 'No download');
      if (downloadPng) {
        const pngPath = `/tmp/test-export-png.png`;
        await downloadPng.saveAs(pngPath);
        const stats = fs.statSync(pngPath);
        record('PNG file has content', stats.size > 100, `Size: ${stats.size} bytes`);
        fs.unlinkSync(pngPath);
      }

      // Test JPG export
      const [downloadJpg] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
        page.click('#exportJpg')
      ]);
      record('JPG export triggers download', !!downloadJpg, downloadJpg ? `Filename: ${downloadJpg.suggestedFilename()}` : 'No download');
      if (downloadJpg) {
        const jpgPath = `/tmp/test-export-jpg.jpg`;
        await downloadJpg.saveAs(jpgPath);
        const stats = fs.statSync(jpgPath);
        record('JPG file has content', stats.size > 100, `Size: ${stats.size} bytes`);
        fs.unlinkSync(jpgPath);
      }

      // Test JSON export
      const [downloadJson] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
        page.click('#exportJson')
      ]);
      record('JSON export triggers download', !!downloadJson, downloadJson ? `Filename: ${downloadJson.suggestedFilename()}` : 'No download');
      if (downloadJson) {
        const jsonPath = `/tmp/test-export-json.json`;
        await downloadJson.saveAs(jsonPath);
        const stats = fs.statSync(jsonPath);
        const content = fs.readFileSync(jsonPath, 'utf-8');
        record('JSON file is valid', stats.size > 50 && content.includes('series'), `Size: ${stats.size} bytes, contains series: ${content.includes('series')}`);
        fs.unlinkSync(jsonPath);
      }

      record('No JS errors during export tests', jsErrors.length === 0, jsErrors.length > 0 ? jsErrors.join('; ') : 'OK');

      await page.close();
    }

    // ================================================================
    // TEST 6: English Version
    // ================================================================
    console.log('\n📋 SECTION 6: English Version');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/text2echarts-en.html`, { waitUntil: 'networkidle', timeout: 15000 });

      // Check English title
      const title = await page.title();
      record('English page title', title === 'ECharts Chart Generator', `Got: "${title}"`);

      // Check chart canvas exists
      const canvasExists = await page.$('#chart canvas');
      record('Canvas element exists (EN)', !!canvasExists, canvasExists ? 'OK' : 'No canvas found');

      // Check initial template loaded (pie)
      const textareaVal = await page.$eval('#optionInput', el => el.value);
      record('Initial template loaded (EN pie)', textareaVal.includes('Market Share') || textareaVal.includes('Chrome'),
        `Contains "Market Share" or "Chrome": ${textareaVal.includes('Market Share') || textareaVal.includes('Chrome')}`);

      // Wait for chart render
      const canvasInfo = await waitForChartRendered(page);
      record('EN chart rendered', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      // Test English template buttons
      await page.click('#barTemplate');
      await page.waitForTimeout(2000);
      let barVal = await page.$eval('#optionInput', el => el.value);
      record('EN bar template loads', barVal.includes('Fruit') || barVal.includes('sales'), `Contains "Fruit" or "sales": ${barVal.includes('Fruit') || barVal.includes('sales')}`);

      // The line template should have English day names
      await page.click('#lineTemplate');
      await page.waitForTimeout(2000);
      let lineVal = await page.$eval('#optionInput', el => el.value);
      record('EN line template uses English days', lineVal.includes('Mon') || lineVal.includes('Tue'),
        `Contains "Mon": ${lineVal.includes('Mon')}`);

      // Check generate button text
      const genBtnText = await page.$eval('#generateBtn', el => el.textContent.trim());
      record('Generate button shows "Generate Chart"', genBtnText.includes('Generate'), `Button text: "${genBtnText}"`);

      const exportBtnText = await page.$eval('#exportPng', el => el.textContent.trim());
      record('Export button shows "Export PNG"', exportBtnText.includes('Export'), `Button text: "${exportBtnText}"`);

      record('No JS errors on EN page', jsErrors.length === 0, jsErrors.length > 0 ? jsErrors.join('; ') : 'OK');

      await page.close();
    }

    // ================================================================
    // TEST 7: Responsive Design / Window Resize
    // ================================================================
    console.log('\n📋 SECTION 7: Responsive Design');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE_URL}/text2echarts.html`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Load a template
      await page.click('#barTemplate');
      await page.waitForTimeout(2000);

      let canvasInfo = await waitForChartRendered(page);
      record('Desktop view chart renders', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      // Resize to mobile width
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1500);

      canvasInfo = await waitForChartRendered(page);
      record('Mobile view chart re-renders', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      // Check that the layout changes (single column on mobile)
      const isSingleColumn = await page.evaluate(() => {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return false;
        const style = window.getComputedStyle(mainContent);
        return style.gridTemplateColumns === '1fr';
      });
      record('Responsive layout switches to single column', isSingleColumn,
        isSingleColumn ? 'Yes' : 'Still multi-column');

      // Resize back to desktop
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(1500);

      canvasInfo = await waitForChartRendered(page);
      record('Desktop view after resize still renders', canvasInfo.width > 0 && canvasInfo.height > 0,
        `Canvas: ${canvasInfo.width}x${canvasInfo.height}`);

      record('No JS errors during resize', jsErrors.length === 0, jsErrors.length > 0 ? jsErrors.join('; ') : 'OK');

      await page.close();
    }

    // ================================================================
    // TEST 8: Error Handling — Invalid JSON
    // ================================================================
    console.log('\n📋 SECTION 8: Error Handling');
    {
      const page = await browser.newPage();
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/text2echarts.html`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Clear and input invalid JSON
      await page.click('#clearBtn');
      await page.fill('#optionInput', '{ invalid json here }');
      await page.click('#generateBtn');
      await page.waitForTimeout(1500);

      // Check for error panel
      const errorPanel = await page.$eval('#errorPanel', el => el.classList.contains('active'));
      record('Error panel shown for invalid JSON', errorPanel, errorPanel ? 'OK' : 'No error panel');

      const errorText = await page.$eval('#errorPanel', el => el.textContent);
      record('Error text is descriptive', errorText.includes('解析错误') || errorText.includes('parse error'),
        `Error: "${errorText.substring(0, 80)}..."`);

      // Test with empty input
      await page.click('#clearBtn');
      await page.waitForTimeout(500);
      await page.fill('#optionInput', '');
      await page.click('#generateBtn');
      await page.waitForTimeout(500);
      const statusText = await page.$eval('#statusText', el => el.textContent);
      record('Empty input shows "配置为空"', statusText.includes('配置为空'), `Status: "${statusText}"`);

      // Filter out the known error from generating with invalid input
      const actualJSErrors = jsErrors.filter(e => !e.includes('转换配置错误') && !e.includes('Unexpected token'));
      record('No critical JS errors from error handling', actualJSErrors.length === 0, actualJSErrors.length > 0 ? actualJSErrors.join('; ') : 'OK');

      await page.close();
    }

  } finally {
    await browser.close();
  }

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total:  ${RESULTS.total}`);
  console.log(`  Passed: ${RESULTS.passed} ✅`);
  console.log(`  Failed: ${RESULTS.failed} ❌`);
  console.log(`  Pass Rate: ${(RESULTS.passed / RESULTS.total * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (RESULTS.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    for (const d of RESULTS.details) {
      if (!d.pass) console.log(`  - ${d.name}: ${d.detail}`);
    }
  }

  return RESULTS;
}

// Run and output results
runTest().then(results => {
  // Save results as JSON for report generation
  const outputPath = path.resolve('projects/text2echart/web/test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${outputPath}`);
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('❌ Test suite crashed:', err);
  process.exit(1);
});
