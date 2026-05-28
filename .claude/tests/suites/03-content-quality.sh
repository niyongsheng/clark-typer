#!/bin/bash
# 03-content-quality.sh — 内容约束自动化扫描套件
# 调用 Python checkers 对正文、设定、角色进行约束检查

cd "$(dirname "$0")/.."
source lib/check-utils.sh

echo "# 内容约束扫描套件"
echo "调用 Python 检查器验证内容质量约束"
echo ""

init_test_run

CHECKERS_DIR="$(pwd)/../checkers"
PROJECT_ROOT="$(pwd)/../.."

python3_available() {
  command -v python3 &>/dev/null
}

if ! python3_available; then
  echo "    $FAIL Python3 is required for content quality checks"
  ((TEST_FAIL++))
  print_test_summary
  exit 1
fi

# ── Density Checker ─────────────────────────────────────────────

describe "密度交替法则检查"

CHAPTER_DIR="$PROJECT_ROOT/7-正文"
if [[ -d "$CHAPTER_DIR" ]] && ls "$CHAPTER_DIR"/第*章.txt &>/dev/null 2>&1; then
  DENSITY_OUTPUT=$(python3 "$CHECKERS_DIR/density-checker.py" --dir "$CHAPTER_DIR" 2>&1 || true)
  echo "$DENSITY_OUTPUT" | while IFS= read -r line; do echo "    $line"; done
  # Count passes and fails
  pass_count=$(echo "$DENSITY_OUTPUT" | grep -c "\[PASS\]" || true)
  fail_count=$(echo "$DENSITY_OUTPUT" | grep -c "\[FAIL\]" || true)
  ((TEST_PASS += pass_count))
  ((TEST_FAIL += fail_count))
  if [[ "$pass_count" -eq 0 && "$fail_count" -eq 0 ]]; then
    echo "    $WARN No chapter files to check"
    ((TEST_WARN++))
  fi
else
  echo "    $WARN No chapter files found, skipping density check"
  ((TEST_WARN++))
fi

# ── Paragraph Checker ──────────────────────────────────────────

describe "单句段控制检查"

if [[ -d "$CHAPTER_DIR" ]] && ls "$CHAPTER_DIR"/第*章.txt &>/dev/null 2>&1; then
  PARA_OUTPUT=$(python3 "$CHECKERS_DIR/paragraph-checker.py" --dir "$CHAPTER_DIR" 2>&1 || true)
  echo "$PARA_OUTPUT" | while IFS= read -r line; do echo "    $line"; done
  pass_count=$(echo "$PARA_OUTPUT" | grep -c "\[PASS\]" || true)
  fail_count=$(echo "$PARA_OUTPUT" | grep -c "\[FAIL\]" || true)
  ((TEST_PASS += pass_count))
  ((TEST_FAIL += fail_count))
else
  echo "    $WARN No chapter files found, skipping paragraph check"
  ((TEST_WARN++))
fi

# ── Label Checker ──────────────────────────────────────────────

describe "三层标签合规检查"

SCIENCE_FILE="$PROJECT_ROOT/3-科学设定/科学设定.md"
if [[ -f "$SCIENCE_FILE" ]]; then
  LABEL_OUTPUT=$(python3 "$CHECKERS_DIR/label-checker.py" "$SCIENCE_FILE" 2>&1 || true)
  echo "$LABEL_OUTPUT" | while IFS= read -r line; do echo "    $line"; done
  if [[ "$LABEL_OUTPUT" == *"PASS"* ]]; then
    ((TEST_PASS++))
  elif [[ "$LABEL_OUTPUT" == *"FAIL"* ]]; then
    ((TEST_FAIL++))
  fi
else
  echo "    $WARN 科学设定.md not found, skipping label check"
  ((TEST_WARN++))
fi

# ── External Markers Checker ───────────────────────────────────

describe "角色外化标记检查"

CHAR_FILE="$PROJECT_ROOT/0-角色档案/核心人物.md"
if [[ -f "$CHAR_FILE" ]]; then
  MARKER_OUTPUT=$(python3 "$CHECKERS_DIR/external-markers.py" "$CHAR_FILE" 2>&1 || true)
  echo "$MARKER_OUTPUT" | while IFS= read -r line; do echo "    $line"; done
  if [[ "$MARKER_OUTPUT" == *"所有角色外化标记合规"* ]]; then
    ((TEST_PASS++))
  elif [[ "$MARKER_OUTPUT" == *"违反"* ]]; then
    ((TEST_FAIL++))
  fi
else
  echo "    $WARN 核心人物.md not found, skipping marker check"
  ((TEST_WARN++))
fi

# ── Summary ──────────────────────────────────────────────────────

print_test_summary
test_ok
