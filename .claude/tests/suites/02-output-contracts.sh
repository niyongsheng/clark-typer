#!/bin/bash
# 02-output-contracts.sh — 输出合约测试套件
# 每个技能完成后验证其产出文件的存在性、路径正确性、基本格式

cd "$(dirname "$0")/.."
source lib/check-utils.sh

echo "# 输出合约测试套件"
echo "验证每个技能的产出文件是否符合预期"
echo "注意：空项目状态下此套件预期会有大量失败，这是正常的。"
echo ""

init_test_run

# ── typer-init ──────────────────────────────────────────────────

describe "typer-init: 初始化后所有内容目录为空"

assert_dir_empty "0-角色档案"
assert_dir_empty "1-思想实验"
assert_dir_empty "2-世界观设定"
assert_dir_empty "3-科学设定"
assert_dir_empty "4-分卷大纲"
assert_dir_empty "5-剧情单元"
assert_dir_empty "6-分章大纲"
assert_dir_empty "7-正文"
assert_dir_empty "8-参考资料"
assert_dir_empty "9-素材碎片"
assert_file_not_exists ".clark/clark.db"

# ── typer-topic ─────────────────────────────────────────────────

describe "typer-topic: 选题与创作意图"

assert_file_exists "1-思想实验/创作意图.md"
# 创作意图.md should contain the 4 dimensions
assert_pattern_in_file "核心动机" "1-思想实验/创作意图.md" "创作意图包含 核心动机"
assert_pattern_in_file "篇幅" "1-思想实验/创作意图.md" "创作意图包含 篇幅预期"
assert_pattern_in_file "氛围" "1-思想实验/创作意图.md" "创作意图包含 感觉与氛围"
assert_pattern_in_file "约束" "1-思想实验/创作意图.md" "创作意图包含 创作约束"
assert_file_exists "1-思想实验/选题.md"

# ── typer-settings ──────────────────────────────────────────────

describe "typer-settings: 世界观与科学设定"

assert_file_exists "2-世界观设定/世界观.md"
assert_file_exists "3-科学设定/科学设定.md"
assert_pattern_in_file "\[已知科学\]" "3-科学设定/科学设定.md" "包含 [已知科学] 标签"
assert_pattern_in_file "\[合理外推\]" "3-科学设定/科学设定.md" "包含 [合理外推] 标签"
assert_pattern_in_file "\[核心假设\]" "3-科学设定/科学设定.md" "包含 [核心假设] 标签"
assert_pattern_in_file "不可妥协" "3-科学设定/科学设定.md" "包含哲学边界锚定"

# ── typer-character ─────────────────────────────────────────────

describe "typer-character: 角色档案与关系图谱"

assert_file_exists "0-角色档案/核心人物.md"
assert_file_exists "0-角色档案/关系图谱.md"

# Check external markers exist (look for character ## sections)
if [[ -f "$(pwd)/../../0-角色档案/核心人物.md" ]]; then
  char_count=$(grep -c "^## " "$(pwd)/../../0-角色档案/核心人物.md" 2>/dev/null || true)
  echo "    Characters defined: $char_count"
  if [[ "$char_count" -gt 0 ]]; then
    echo "    $PASS At least one character defined"
    ((TEST_PASS++))
  else
    echo "    $FAIL No characters found"
    ((TEST_FAIL++))
  fi
fi

# ── typer-style ─────────────────────────────────────────────────

describe "typer-style: 写作风格定义"

assert_file_exists "1-思想实验/写作风格.md"
# Should have quantitative rhythm metrics
assert_pattern_in_file "短句" "1-思想实验/写作风格.md" "包含短句控制指标"
assert_pattern_in_file "密度" "1-思想实验/写作风格.md" "包含密度控制指标"
assert_pattern_in_file "折射" "1-思想实验/写作风格.md" "包含科幻折射率策略"

# ── typer-structure ─────────────────────────────────────────────

describe "typer-structure: 故事架构"

assert_file_exists "1-思想实验/故事架构.md"

# ── typer-research ──────────────────────────────────────────────

describe "typer-research: 科研资料"

assert_dir_not_empty "8-参考资料"

# ── typer-outline ───────────────────────────────────────────────

describe "typer-outline: 大纲文件"

assert_dir_not_empty "4-分卷大纲"
assert_dir_not_empty "5-剧情单元"
assert_dir_not_empty "6-分章大纲"

# Check 5-dimension lock in chapter outlines (if files exist)
outline_dir="$(pwd)/../../6-分章大纲"
if [[ -d "$outline_dir" ]]; then
  outline_count=$(find "$outline_dir" -type f 2>/dev/null | wc -l)
  echo "    Outline files: $outline_count"
  # Check for 5-dimension keywords across all outline files
  dim_found=$(grep -lE "认知框架|情感锚点|世界质感|设疑具体|临场张力" "$outline_dir"/*.md 2>/dev/null | wc -l)
  if [[ "$dim_found" -gt 0 ]]; then
    echo "    $PASS Five-dimension lock present in $dim_found files"
    ((TEST_PASS++))
  else
    echo "    $WARN No five-dimension lock found (may not be generated yet)"
    ((TEST_WARN++))
  fi
fi

# ── typer-writer ────────────────────────────────────────────────

describe "typer-writer: 正文产出"

assert_file_pattern_exists "7-正文/第*章.txt"
# Verify no .md chapter files exist
md_chapters=$(ls "$(pwd)/../../7-正文/"*.md 2>/dev/null | wc -l)
if [[ "$md_chapters" -eq 0 ]]; then
  echo "    $PASS No .md chapter files (correct format is .txt)"
  ((TEST_PASS++))
else
  echo "    $FAIL Found $md_chapters .md chapter files (should be .txt)"
  ((TEST_FAIL++))
fi

# Check chapter-snapshot was updated after writing
snapshot_file="$(pwd)/../../.claude/chapter-snapshot.md"
if [[ -f "$snapshot_file" ]]; then
  data_lines=$(grep -c "^|" "$snapshot_file" 2>/dev/null || true)
  if [[ "$data_lines" -ge 3 ]]; then  # header + separator + at least 1 data row
    echo "    $PASS chapter-snapshot.md has $((data_lines - 2)) chapter entries"
    ((TEST_PASS++))
  fi
fi

# ── typer-review ────────────────────────────────────────────────

describe "审稿报告"

assert_dir_not_empty ".claude/temp"
# Check for review reports with verdict
temp_dir="$(pwd)/../../.claude/temp"
if [[ -d "$temp_dir" ]]; then
  review_files=$(find "$temp_dir" -name "*.md" -o -name "*.json" 2>/dev/null | wc -l)
  if [[ "$review_files" -gt 0 ]]; then
    verdict_found=$(grep -lE "通过|需修改|有条件通过" "$temp_dir"/* 2>/dev/null | wc -l)
    if [[ "$verdict_found" -gt 0 ]]; then
      echo "    $PASS Review report contains verdict"
      ((TEST_PASS++))
    fi
  fi
fi

# ── typer-reader-review ────────────────────────────────────────

describe "读者审稿报告"

assert_file_pattern_exists ".claude/temp/*读者审稿*"

# ── typer-consistency ───────────────────────────────────────────

describe "一致性扫描"

assert_dir_not_empty ".claude/temp"
# Check consistency report naming
consistency_found=$(find "$(pwd)/../../.claude/temp" -name "*一致*" -o -name "*consistency*" 2>/dev/null | wc -l)
if [[ "$consistency_found" -gt 0 ]]; then
  echo "    $PASS Consistency report found"
  ((TEST_PASS++))
fi

# ── typer-export ────────────────────────────────────────────────

describe "导出产物"

assert_dir_not_empty "打包发布"
# Check for specific formats
export_dir="$(pwd)/../../打包发布"
if [[ -d "$export_dir" ]]; then
  for fmt in txt epub pdf; do
    matches=$(find "$export_dir" -iname "*.$fmt" 2>/dev/null | wc -l)
    if [[ "$matches" -gt 0 ]]; then
      echo "    $PASS Found .$fmt export file(s)"
      ((TEST_PASS++))
    fi
  done
fi

# ── typer-wrap ──────────────────────────────────────────────────

describe "typer-wrap: 卷终工序"

assert_file_exists ".claude/temp/卷终-设定扫描.md"
assert_file_exists ".claude/temp/卷终-哲学审计.md"
assert_file_exists "0-角色档案/卷末角色状态.md"

# ── typer-index ─────────────────────────────────────────────────

describe "语义索引层"

assert_file_exists ".clark/clark.db"

# ── Summary ──────────────────────────────────────────────────────

echo ""
echo "  注意: 空项目状态下输出合约测试预期会有失败。"
echo "  随着创作流程推进，这些测试应逐渐全部通过。"
echo ""

print_test_summary
test_ok
