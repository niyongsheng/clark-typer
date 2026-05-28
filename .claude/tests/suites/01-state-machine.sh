#!/bin/bash
# 01-state-machine.sh — 状态机测试套件
# 验证 current-state.md 与 CLAUDE.md 的状态一致性和转换规则

cd "$(dirname "$0")/.."
source lib/check-utils.sh
source lib/state-utils.sh

echo "# 状态机测试套件"
echo "验证工作流状态的一致性、合法性和转换规则"
echo ""

init_test_run

# ── Test: valid steps exist ──────────────────────────────────────

describe "所有 CLAUDE.md 声明的 step 在 current-state.md 中都存在"

STATE_STEPS=$(grep "^# Values:" "$STATE_FILE" | sed 's/.*: *//' | tr '/' ' ')
CLAUDE_STEPS="init topic settings character style structure research outline write review science-review joint-review editor reader-review consistency export wrap"

for step in $CLAUDE_STEPS; do
  if echo "$STATE_STEPS" | grep -wq "$step"; then
    echo "    $PASS Step '$step' found in current-state.md"
    ((TEST_PASS++))
  else
    echo "    $FAIL Step '$step' MISSING from current-state.md"
    ((TEST_FAIL++))
  fi
done

# ── Test: no orphan steps ────────────────────────────────────────

describe "current-state.md 没有 CLAUDE.md 未定义的 step"

for step in $STATE_STEPS; do
  if echo "$CLAUDE_STEPS" | grep -wq "$step"; then
    : # ok
  else
    echo "    $FAIL Orphan step '$step' in current-state.md (not in CLAUDE.md)"
    ((TEST_FAIL++))
  fi
done

# ── Test: current workflow_step is valid ─────────────────────────

describe "当前 workflow_step 值是合法的"

CURRENT=$(read_step)
if echo "$CLAUDE_STEPS" | grep -wq "$CURRENT"; then
  echo "    $PASS Current step '$CURRENT' is valid"
  ((TEST_PASS++))
else
  echo "    $FAIL Current step '$CURRENT' is NOT valid (expected one of: $CLAUDE_STEPS)"
  ((TEST_FAIL++))
fi

# ── Test: transition matrix (forward transitions) ────────────────

describe "状态转换规则符合 CLAUDE.md 定义"

# Verify that source steps can reach their expected targets
# write → review or joint-review
WRITE_TRANSITIONS=$(get_valid_transitions "write")
if echo "$WRITE_TRANSITIONS" | grep -q "review"; then
  echo "    $PASS write → review is a valid transition"
  ((TEST_PASS++))
else
  echo "    $FAIL write → review should be valid"
  ((TEST_FAIL++))
fi
if echo "$WRITE_TRANSITIONS" | grep -q "joint-review"; then
  echo "    $PASS write → joint-review is a valid transition"
  ((TEST_PASS++))
else
  echo "    $FAIL write → joint-review should be valid"
  ((TEST_FAIL++))
fi

# review → science-review or editor
REVIEW_TRANSITIONS=$(get_valid_transitions "review")
if echo "$REVIEW_TRANSITIONS" | grep -q "science-review"; then
  echo "    $PASS review → science-review is a valid transition"
  ((TEST_PASS++))
else
  echo "    $FAIL review → science-review should be valid"
  ((TEST_FAIL++))
fi
if echo "$REVIEW_TRANSITIONS" | grep -q "editor"; then
  echo "    $PASS review → editor is a valid transition"
  ((TEST_PASS++))
else
  echo "    $FAIL review → editor should be valid"
  ((TEST_FAIL++))
fi

# editor → reader-review
EDITOR_TRANSITIONS=$(get_valid_transitions "editor")
if echo "$EDITOR_TRANSITIONS" | grep -q "reader-review"; then
  echo "    $PASS editor → reader-review is a valid transition"
  ((TEST_PASS++))
else
  echo "    $FAIL editor → reader-review should be valid"
  ((TEST_FAIL++))
fi

# consistency → export or editor (export on pass, editor on fail)
CONSISTENCY_TRANSITIONS=$(get_valid_transitions "consistency")
if echo "$CONSISTENCY_TRANSITIONS" | grep -q "export"; then
  echo "    $PASS consistency → export is a valid transition"
  ((TEST_PASS++))
else
  echo "    $FAIL consistency → export should be valid"
  ((TEST_FAIL++))
fi
if echo "$CONSISTENCY_TRANSITIONS" | grep -q "editor"; then
  echo "    $PASS consistency → editor is a valid transition (failure recovery)"
  ((TEST_PASS++))
else
  echo "    $FAIL consistency → editor should be valid as failure recovery"
  ((TEST_FAIL++))
fi

# ── Test: branching logic (joint-review vs review+science-review) ─

describe "审稿分流逻辑可用"

# Verify that the state file comment correctly describes the branching
if grep -q "≤3章用 joint-review" "$STATE_FILE"; then
  echo "    $PASS Branching rule documented (joint-review for ≤3 chapters)"
  ((TEST_PASS++))
else
  echo "    $FAIL Missing branching rule documentation in current-state.md"
  ((TEST_FAIL++))
fi
if grep -q "≥4章用 review" "$STATE_FILE"; then
  echo "    $PASS Branching rule documented (review+science-review for ≥4 chapters)"
  ((TEST_PASS++))
else
  echo "    $FAIL Missing branching rule documentation in current-state.md"
  ((TEST_FAIL++))
fi

# ── Test: workflow_step integrity ────────────────────────────────

describe "状态文件格式完整性"

if grep -q "^workflow_step:" "$STATE_FILE"; then
  echo "    $PASS workflow_step key exists"
  ((TEST_PASS++))
else
  echo "    $FAIL workflow_step key missing from $STATE_FILE"
  ((TEST_FAIL++))
fi

if grep -q "^current_volume:" "$STATE_FILE"; then
  echo "    $PASS current_volume key exists"
  ((TEST_PASS++))
else
  echo "    $FAIL current_volume key missing"
  ((TEST_FAIL++))
fi

if grep -q "^current_unit:" "$STATE_FILE"; then
  echo "    $PASS current_unit key exists"
  ((TEST_PASS++))
else
  echo "    $FAIL current_unit key missing"
  ((TEST_FAIL++))
fi

STEP_LINE=$(grep "^workflow_step: " "$STATE_FILE" | head -1)
if echo "$STEP_LINE" | grep -v "^#" > /dev/null 2>&1; then
  # Check it's a single value
  STEP_VAL=$(echo "$STEP_LINE" | sed 's/.*: *//' | tr -d ' ')
  if [[ -n "$STEP_VAL" ]]; then
    echo "    $PASS workflow_step has a value: $STEP_VAL"
    ((TEST_PASS++))
  fi
fi

# ── Summary ──────────────────────────────────────────────────────

print_test_summary
test_ok
