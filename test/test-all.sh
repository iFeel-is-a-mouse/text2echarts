#!/bin/bash
# text2echart 批量验证脚本
# 用法: bash scripts/test-all.sh

echo "=== text2echart 全量验证 ==="
echo ""

# 清理
rm -rf .test-output
mkdir -p .test-output

# 1. 测试所有6种图表生成
echo "1/3 生成 HTML..."
for type in bar line pie scatter radar wordcloud; do
  cat > .test-output/$type.json << EOF
{"title":"${type}","type":"${type}","data":[{"name":"A","value":30},{"name":"B","value":80},{"name":"C","value":45}],"options":{"theme":"dark"}}
EOF
  if node scripts/build.js .test-output/$type.json .test-output/$type.html 2>/dev/null; then
    echo "  ✅ $type"
  else
    echo "  ❌ $type"
  fi
done

# 2. 基本验证：检查HTML是否含有echarts和option
echo ""
echo "2/3 验证 HTML 结构..."
for type in bar line pie scatter radar wordcloud; do
  has_echarts=$(grep -c 'echarts.min.js' .test-output/$type.html)
  has_option=$(grep -c 'setOption' .test-output/$type.html)
  has_canvas=$(grep -c 'div.*chart' .test-output/$type.html)
  echo "  $type: echarts=$has_echarts option=$has_option canvas=$has_canvas"
done

# 3. 文件大小
echo ""
echo "3/3 输出文件:"
ls -lh .test-output/*.html

echo ""
echo "=== 全部完成 ==="
