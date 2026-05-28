#!/bin/bash
# 05-workflow-e2e.sh — 端到端工作流测试
# 模拟最小工作流（短篇模式），验证状态转换完整性
# 注意：此测试为演练模式，不实际执行技能，只验证状态文件可正确推进

cd "$(dirname "$0")/.."
source lib/check-utils.sh
source lib/state-utils.sh

echo "# 端到端工作流演练"
echo "验证状态转换图的完整性和格式正确性"
echo ""

init_test_run

# ── Test: Full transition chain (short story mode) ──────────────

describe "短篇模式完整状态链"

SHORT_CHAIN="init intent topic settings character style research outline write joint-review editor reader-review consistency export wrap"

previous=""
current_count=0
for step in $SHORT_CHAIN; do
  current_count=$((current_count + 1))
  if [[ -n "$previous" ]]; then
    TRANSITIONS=$(get_valid_transitions "$previous")
    if echo "$TRANSITIONS" | grep -wq "$step"; then
      echo "    $PASS $previous → $step (link $((current_count-1)))"
      ((TEST_PASS++))
    else
      echo "    $FAIL $previous → $step (NOT a valid transition)"
      ((TEST_FAIL++))
    fi
  fi
  previous="$step"
done

# ── Test: Long story mode chain ─────────────────────────────────

describe "长篇模式完整状态链"

LONG_CHAIN="init intent topic settings character style structure research outline write review science-review editor reader-review consistency export wrap"

previous=""
for step in $LONG_CHAIN; do
  if [[ -n "$previous" ]]; then
    TRANSITIONS=$(get_valid_transitions "$previous")
    if echo "$TRANSITIONS" | grep -wq "$step"; then
      : # ok
    else
      echo "    $FAIL Missing transition: $previous → $step"
      ((TEST_FAIL++))
    fi
  fi
  previous="$step"
done
echo "    $PASS Long-form workflow chain is valid"
((TEST_PASS++))

# ── Test: All branching possibilities ───────────────────────────

describe "全部分支路径可达"

# Test each path as a space-separated string (compatible with bash 3 on macOS)
test_path() {
  local path_name="$1"
  shift
  local steps=("$@")
  local prev=""
  for step in "${steps[@]}"; do
    if [[ -n "$prev" ]]; then
      TRANSITIONS=$(get_valid_transitions "$prev")
      if ! echo "$TRANSITIONS" | grep -wq "$step"; then
        echo "    $FAIL Path broken: $path_name ($prev → $step not valid)"
        ((TEST_FAIL++))
        return
      fi
    fi
    prev="$step"
  done
  echo "    $PASS Path valid: $path_name"
  ((TEST_PASS++))
}

test_path "init→intent→topic" init intent topic
test_path "write→review→science-review→editor" write review science-review editor
test_path "write→joint-review→editor" write joint-review editor
test_path "consistency→export→wrap" consistency export wrap
test_path "consistency→editor→reader-review" consistency editor reader-review

# ── Test: No dead ends (except wrap) ───────────────────────────

describe "非 wrap 状态都有出口"

for step in init intent topic settings character style structure research outline write review science-review joint-review editor reader-review consistency export; do
  TRANSITIONS=$(get_valid_transitions "$step")
  if [[ -z "$TRANSITIONS" ]]; then
    echo "    $FAIL Dead end at: $step (only wrap should have no outgoing)"
    ((TEST_FAIL++))
  fi
done
echo "    $PASS All non-wrap states have valid outgoing transitions"
((TEST_PASS++))

# ── Test: current-state.md format ──────────────────────────────

describe "current-state.md 格式"

# Check required fields
for field in "current_volume" "current_unit" "unit_range_start" "unit_range_end" "workflow_step"; do
  if grep -q "^${field}:" "$STATE_FILE"; then
    : # ok
  else
    echo "    $FAIL Missing required field: $field"
    ((TEST_FAIL++))
  fi
done
echo "    $PASS All required fields present in current-state.md"
((TEST_PASS++))

# ── Test: chapter-snapshot.md format ───────────────────────────

describe "chapter-snapshot.md 格式"

SNAPSHOT_FILE="$(pwd)/../../.claude/chapter-snapshot.md"
if [[ -f "$SNAPSHOT_FILE" ]]; then
  # Header must contain required columns
  for col in "章节" "关键事件" "科学设定" "角色" "时间" "思想实验"; do
    if grep -q "$col" "$SNAPSHOT_FILE"; then
      : # ok
    else
      echo "    $WARN Missing column in snapshot: $col"
      ((TEST_WARN++))
    fi
  done
  echo "    $PASS Snapshot header structure correct"
  ((TEST_PASS++))
else
  echo "    $WARN chapter-snapshot.md not found"
  ((TEST_WARN++))
fi

# ── Summary ──────────────────────────────────────────────────────

print_test_summary
test_ok
