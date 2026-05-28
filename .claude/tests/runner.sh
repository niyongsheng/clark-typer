#!/bin/bash
# runner.sh — clark-typer 测试主调度器
#
# Usage:
#   bash runner.sh                 # 全量运行
#   bash runner.sh --suite 01      # 单套件
#   bash runner.sh --quick         # 快速（状态+合约）
#   bash runner.sh --trend         # 趋势报告
#   bash runner.sh --optimize      # 分析优化建议
#   bash runner.sh --list          # 列出套件

set -eo pipefail
cd "$(dirname "$0")"

SUITES_DIR="suites"
REPORTS_DIR="reports"
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
TREND_FILE="$REPORTS_DIR/trend-data.csv"
VIOLATIONS_FILE="$REPORTS_DIR/violations.csv"

mkdir -p "$REPORTS_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Help ─────────────────────────────────────────────────────────

show_help() {
  echo "clark-typer 测试调度器 — 创作流程验证与持续优化"
  echo ""
  echo "用法: bash runner.sh [选项]"
  echo ""
  echo "选项:"
  echo "  --suite N    运行指定套件 (如 01)"
  echo "  --quick      只运行状态机 + 输出合约 (快速验证)"
  echo "  --trend      显示最近测试的趋势报告"
  echo "  --optimize   分析失败模式，输出优化建议"
  echo "  --list       列出可用套件"
  echo "  --help       显示此帮助"
}

# ── Suite listing ────────────────────────────────────────────────

list_suites() {
  echo "可用测试套件:"
  for suite in "$SUITES_DIR"/*.sh; do
    if [[ -f "$suite" ]]; then
      name=$(basename "$suite" .sh)
      desc=$(head -5 "$suite" | grep "^#" | head -1 | sed 's/^# //' 2>/dev/null || echo "No description")
      echo "  $name  $desc"
    fi
  done
}

# ── Run a single suite, capture results ─────────────────────────

run_suite() {
  local suite_file="$1"
  local suite_name
  suite_name=$(basename "$suite_file" .sh)

  if [[ ! -f "$suite_file" ]]; then
    echo "═══════════════════════════════════════════════"
    echo -e "${RED}[ERROR] Suite not found: $suite_file${NC}"
    echo "═══════════════════════════════════════════════"
    return 1
  fi

  echo "═══════════════════════════════════════════════"
  echo "  Suite: $suite_name"
  echo "═══════════════════════════════════════════════"
  echo ""

  bash "$suite_file" 2>&1
  local suite_exit=${PIPESTATUS[0]}
  if [[ "$suite_exit" -ne 0 ]]; then
    echo "    [FAIL] Suite exited with code $suite_exit"
  fi
  return $suite_exit
}

# ── Trend report ─────────────────────────────────────────────────

show_trend() {
  if [[ ! -f "$TREND_FILE" ]]; then
    echo "尚无趋势数据。运行完整测试后自动生成。"
    echo ""
    echo "提示: 持续运行测试将自动采集以下指标:"
    echo "  通过率、失败数、警告数、约束违反统计"
    return
  fi

  echo "趋势报告 (最近 10 次运行):"
  echo "────────────────────────────────────────"
  echo ""

  # Overview trend
  echo "通过率趋势:"
  python3 -c "
import csv, sys
with open('$TREND_FILE') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
rows = rows[-10:]
for r in rows:
    total = int(r['pass']) + int(r['fail'])
    if total > 0:
        rate = int(r['pass']) * 100 // total
    else:
        rate = 0
    bar = '█' * (rate // 5) + '░' * ((20 - rate // 5))
    print(f'  {r[\"timestamp\"][:16]:16} {bar} {rate}% ({r[\"pass\"]}✓/{r[\"fail\"]}✗)')
" 2>/dev/null || echo "  (python3 required for trend visualization)"

  echo ""

  # Violation tracking
  if [[ -f "$VIOLATIONS_FILE" ]]; then
    echo "约束违反统计:"
    python3 -c "
import csv
from collections import defaultdict
with open('$VIOLATIONS_FILE') as f:
    reader = csv.DictReader(f)
    violations = list(reader)
if violations:
    counts = defaultdict(int)
    for v in violations:
        counts[v['type']] += 1
    for vtype, count in sorted(counts.items(), key=lambda x: -x[1]):
        print(f'  {vtype}: {count}次')
else:
    print('  (无记录)')
" 2>/dev/null
  fi
}

# ── Optimization analysis ───────────────────────────────────────

run_optimize() {
  if [[ ! -f "$TREND_FILE" ]]; then
    echo "尚无足够数据进行分析。请先运行测试。"
    return
  fi

  echo "优化分析:"
  echo "────────────────────────────────────────"
  echo ""

  python3 -c "
import csv
from collections import defaultdict

with open('$TREND_FILE') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

if len(rows) < 2:
    print('  至少需要 2 次运行记录才能分析趋势。')
    exit(0)

# Analyze failure patterns
total_runs = len(rows)
total_fails = sum(int(r['fail']) for r in rows)
total_passes = sum(int(r['pass']) for r in rows)
total_warns = sum(int(r['warn']) for r in rows)

avg_pass = total_passes / total_runs
avg_fail = total_fails / total_runs
avg_warn = total_warns / total_runs

print(f'  总运行次数: {total_runs}')
print(f'  平均通过: {avg_pass:.0f}  平均失败: {avg_fail:.0f}  平均警告: {avg_warn:.0f}')
print()

# Check for deteriorating trend
recent = rows[-3:]
older = rows[:-3] if len(rows) > 3 else rows
if len(recent) >= 3 and len(older) >= 3:
    recent_fail = sum(int(r['fail']) for r in recent)
    older_fail = sum(int(r['fail']) for r in older[-3:])
    if recent_fail > older_fail:
        print(f'  ${RED}⚠ 失败数上升趋势: 最近3次 {recent_fail} > 之前3次 {older_fail}${NC}')
    else:
        print(f'  ${GREEN}✓ 失败数稳定或下降${NC}')
        print()

# Check for systematic failures (same type 3+ times)
if os.path.exists('$VIOLATIONS_FILE'):
    with open('$VIOLATIONS_FILE') as f:
        reader = csv.DictReader(f)
        violations = list(reader)
    type_counts = defaultdict(int)
    for v in violations:
        type_counts[v['type']] += 1
    systemic = [(t, c) for t, c in type_counts.items() if c >= 3]
    if systemic:
        print(f'  ${YELLOW}系统性缺陷检测 (同类型失败 ≥3次):${NC}')
        for t, c in systemic:
            print(f'    - {t}: {c}次 — 建议修改对应 SKILL.md 或 CLAUDE.md')
    else:
        print('  ✓ 未检测到系统性缺陷')
" 2>/dev/null || echo "  (python3 required for optimization analysis)"
}

# ── Main ─────────────────────────────────────────────────────────

main() {
  local mode="all"
  local suite_filter=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --suite) mode="suite"; suite_filter="$2"; shift 2 ;;
      --quick) mode="quick"; shift ;;
      --trend) mode="trend"; shift ;;
      --optimize) mode="optimize"; shift ;;
      --list) list_suites; exit 0 ;;
      --help|-h) show_help; exit 0 ;;
      *) echo "Unknown option: $1"; show_help; exit 1 ;;
    esac
  done

  # ── Trend / Optimize mode ──────────────────────────────────────

  if [[ "$mode" == "trend" ]]; then
    show_trend
    exit 0
  fi

  if [[ "$mode" == "optimize" ]]; then
    run_optimize
    exit 0
  fi

  # ── Test modes ─────────────────────────────────────────────────

  echo "╔══════════════════════════════════════════╗"
  echo "║   clark-typer 创作流程测试套件            ║"
  echo "╚══════════════════════════════════════════╝"
  echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""

  local suites_to_run=()
  case "$mode" in
    all)
      for suite in "$SUITES_DIR"/*.sh; do
        [[ -f "$suite" ]] && suites_to_run+=("$suite")
      done
      ;;
    suite)
      # Match by prefix (e.g. "05" → "05-workflow-e2e.sh")
      local sf
      sf=$(ls "$SUITES_DIR/${suite_filter}"*.sh 2>/dev/null | head -1)
      if [[ -z "$sf" ]]; then
        sf="$SUITES_DIR/$(basename "$suite_filter" .sh).sh"
      fi
      if [[ ! -f "$sf" ]]; then
        echo -e "${RED}[ERROR] Suite not found: $sf${NC}"
        echo "使用 --list 查看可用套件"
        exit 1
      fi
      suites_to_run+=("$sf")
      ;;
    quick)
      suites_to_run+=("$SUITES_DIR/01-state-machine.sh")
      suites_to_run+=("$SUITES_DIR/02-output-contracts.sh")
      ;;
  esac

  # Initialize aggregators
  local total_pass=0
  local total_fail=0
  local total_warn=0
  local suite_count=0
  local results_file="$REPORTS_DIR/.last_results"

  for suite in "${suites_to_run[@]}"; do
    ((suite_count++))
    run_suite "$suite" 2>&1 | tee "$results_file" || true

    # Parse results from output (grep exits 1 on 0 matches, don't use || fallback)
    local p=0 f=0 w=0
    p=$(grep -c "^    ✓\|\[PASS\]" "$results_file" 2>/dev/null || true)
    f=$(grep -c "^    ✗\|\[FAIL\]" "$results_file" 2>/dev/null || true)
    w=$(grep -c "^    ⚠\|\[WARN\]" "$results_file" 2>/dev/null || true)
    p=${p:-0}; f=${f:-0}; w=${w:-0}
    total_pass=$((total_pass + p))
    total_fail=$((total_fail + f))
    total_warn=$((total_warn + w))

    echo ""
    echo "────────────────────────────────────────"
    printf "  ${GREEN}✓ %d${NC}  ${RED}✗ %d${NC}  ${YELLOW}⚠ %d${NC}\n" "$p" "$f" "$w"
    echo ""
  done
  rm -f "$results_file"

  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║   测试完成                               ║"
  echo "╚══════════════════════════════════════════╝"
  printf "  总计: ${GREEN}✓ %d${NC}  ${RED}✗ %d${NC}  ${YELLOW}⚠ %d${NC}  (%d 套件)\n" \
    "$total_pass" "$total_fail" "$total_warn" "$suite_count"
  echo ""

  # Record trend
  if [[ ! -f "$TREND_FILE" ]]; then
    echo "timestamp,mode,pass,fail,warn" > "$TREND_FILE"
  fi
  echo "$TIMESTAMP,$mode,$total_pass,$total_fail,$total_warn" >> "$TREND_FILE"

  # Exit code
  if [[ "$total_fail" -gt 0 ]]; then
    exit 1
  fi
}

main "$@"
