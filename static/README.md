# text2echart — Data to ECharts Visualization

An OpenClaw skill that converts structured data into beautiful ECharts HTML files.

## Quick Start

```bash
# Generate a chart from JSON data
echo '{"title":"Sales","type":"bar","data":[{"name":"Jan","value":1200},{"name":"Feb","value":900}],"options":{"theme":"dark"}}' > data.json
node scripts/build.js data.json chart.html
# Open chart.html in browser
```

## Chart Templates

### 📊 Bar Chart

```json
{
  "title": "Sales by Month",
  "type": "bar",
  "data": [
    {"name": "Jan", "value": 1200},
    {"name": "Feb", "value": 900},
    {"name": "Mar", "value": 1600}
  ],
  "options": {
    "theme": "infographic",
    "yAxisName": "Amount"
  }
}
```

### 📈 Line Chart

```json
{
  "title": "Temperature Trend",
  "type": "line",
  "data": [
    {"name": "Mon", "value": 22},
    {"name": "Tue", "value": 25},
    {"name": "Wed", "value": 23},
    {"name": "Thu", "value": 21},
    {"name": "Fri", "value": 28}
  ],
  "options": {
    "theme": "dark",
    "yAxisName": "°C"
  }
}
```

### 🥧 Pie Chart

```json
{
  "title": "Market Share",
  "type": "pie",
  "data": [
    {"name": "Chrome", "value": 48},
    {"name": "Firefox", "value": 22},
    {"name": "Safari", "value": 18},
    {"name": "Edge", "value": 8},
    {"name": "Others", "value": 4}
  ],
  "options": {
    "theme": "vintage"
  }
}
```

### ☁️ Word Cloud

```json
{
  "title": "Keywords",
  "type": "wordcloud",
  "data": [
    {"name": "AI", "value": 100},
    {"name": "ML", "value": 85},
    {"name": "Data", "value": 70},
    {"name": "Cloud", "value": 60}
  ],
  "options": {
    "theme": "macarons"
  }
}
```

## Themes

| Theme | Style | Best for |
|-------|-------|----------|
| dark | Deep blue, tech feel | Presentations, dark backgrounds |
| infographic | Clean, white background | Reports |
| macarons | Soft colors | Business PPT |
| vintage | Retro, warm | Historical data |
| shine | Bright, vivid | Marketing |
| roma | Professional, finance | Enterprise reports |

## Project Structure

```
text2echart/
├── SKILL.md              # OpenClaw skill definition
├── scripts/
│   └── build.js          # HTML generation script
├── web/
│   ├── text2echarts.html # Interactive app (English)
│   ├── styles.css        # Shared styles
│   ├── app.js            # Core app logic (i18n)
│   ├── templates.js      # CN chart templates
│   ├── templates-en.js   # EN chart templates
│   ├── lang/             # JSON language packs
│   └── lib/              # ECharts libs (offline)
└── examples/
    └── 2026-06-05-如何写好Skill.md
```
