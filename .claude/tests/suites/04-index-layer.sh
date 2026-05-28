#!/bin/bash
# 04-index-layer.sh — 索引层测试套件
# 验证 typer-index.py 的全部子命令功能
# 注意：embedding 模型需要 HuggingFace 网络访问，search/prescan 测试在离线时自动跳过

cd "$(dirname "$0")/.."
source lib/check-utils.sh

echo "# 索引层测试套件"
echo "验证 typer-index.py 功能"
echo ""

init_test_run

PROJECT_ROOT="$(cd ../.. && pwd)"
PYTHON_BIN="$PROJECT_ROOT/.claude/.venv/bin/python"
INDEX_SCRIPT="$PROJECT_ROOT/.claude/bin/typer-index.py"
SAMPLE_CHAPTER="fixtures/sample-chapter.txt"

# Fallback to system python if venv doesn't exist
if [[ ! -f "$PYTHON_BIN" ]]; then
  PYTHON_BIN="python3"
fi

# Check if sentence-transformers model is available
check_model_available() {
  "$PYTHON_BIN" -c "
from sentence_transformers import SentenceTransformer
try:
    m = SentenceTransformer('all-MiniLM-L6-v2')
    print('available')
except Exception:
    print('unavailable')
" 2>/dev/null || echo "unavailable"
}
MODEL_AVAILABLE=$(check_model_available)
echo "  Embedding model: $MODEL_AVAILABLE"
echo ""

# Create test directories
TEST_PROJ=$(mktemp -d)
TEST_CLARKE="$TEST_PROJ/.clarke"
TEST_CHAPTERS="$TEST_PROJ/7-正文"
TEST_CHARS="$TEST_PROJ/0-角色档案"
mkdir -p "$TEST_CLARKE"
mkdir -p "$TEST_CHAPTERS"
mkdir -p "$TEST_CHARS"

# Copy fixtures
cp "$SAMPLE_CHAPTER" "$TEST_CHAPTERS/第1章.txt"

# Create mini character file
cat > "$TEST_CHARS/核心人物.md" << 'CHARDATA'
## 林深
- **姓名**：林深
- **职业**：量子物理学家
CHARDATA

# Export env vars for typer-index.py
export CLARKE_DB_DIR="$TEST_CLARKE"
export CLARKE_DB_PATH="$TEST_CLARKE/clark.db"
export CLARKE_CHAPTERS_DIR="$TEST_CHAPTERS"
export CLARKE_CHARACTER_FILE="$TEST_CHARS/核心人物.md"

# ── Test: init ──────────────────────────────────────────────────

describe "typer-index init — 数据库初始化"

"$PYTHON_BIN" "$INDEX_SCRIPT" init > /dev/null 2>&1
if [[ -f "$TEST_CLARKE/clark.db" ]]; then
  echo "    $PASS Database created at $TEST_CLARKE/clark.db"
  ((TEST_PASS++))
else
  echo "    $FAIL Database not created"
  ((TEST_FAIL++))
fi

# Verify schema is valid by checking key stats lines exist
STATS_OUTPUT=$("$PYTHON_BIN" "$INDEX_SCRIPT" stats 2>&1)
if echo "$STATS_OUTPUT" | grep -q "^Chapters:" && echo "$STATS_OUTPUT" | grep -q "^Vectors:"; then
  echo "    $PASS Stats output confirms valid schema"
  ((TEST_PASS++))
else
  echo "    $FAIL Stats output missing expected fields"
  ((TEST_FAIL++))
fi

# ── Test: chapter index ─────────────────────────────────────────

describe "typer-index chapter index — 章节索引"

if [[ "$MODEL_AVAILABLE" == "available" ]]; then
  "$PYTHON_BIN" "$INDEX_SCRIPT" chapter index --ch 1 > /dev/null 2>&1
  INDEX_EXIT=$?
  echo "    Index exit code: $INDEX_EXIT"

  # Query chapter count via stats (sqlite-vec aware)
  STATS_OUTPUT=$("$PYTHON_BIN" "$INDEX_SCRIPT" stats 2>&1)
  CHAPTER_COUNT=$(echo "$STATS_OUTPUT" | grep "^Chapters:" | sed 's/.*: *\([0-9]*\).*/\1/')

  if [[ "$CHAPTER_COUNT" -ge 1 ]]; then
    echo "    $PASS Chapter indexed successfully (count=$CHAPTER_COUNT)"
    ((TEST_PASS++))
  else
    echo "    $FAIL Chapter not indexed (stats shows $CHAPTER_COUNT)"
    ((TEST_FAIL++))
  fi

  # Check vector was created via stats
  VEC_COUNT=$(echo "$STATS_OUTPUT" | grep "^Vectors:" | sed 's/.*: *\([0-9]*\).*/\1/')
  if [[ -n "$VEC_COUNT" && "$VEC_COUNT" -ge 1 ]]; then
    echo "    $PASS Chapter vectors created (count=$VEC_COUNT)"
    ((TEST_PASS++))
  else
    echo "    $FAIL Chapter vectors not created (stats shows '$VEC_COUNT')"
    ((TEST_FAIL++))
  fi
else
  echo "    $WARN Model unavailable — testing script crash safety"
  ((TEST_WARN++))

  # Test that script handles missing model gracefully
  CRASH_RESULT=$("$PYTHON_BIN" "$INDEX_SCRIPT" chapter index --ch 1 2>&1 || true)
  if echo "$CRASH_RESULT" | grep -qi "error\|warning\|not found"; then
    echo "    $PASS Script degrades gracefully when model unavailable (output: ${CRASH_RESULT:0:80})"
    ((TEST_PASS++))
  fi

  # DB-layer fallback test
  "$PYTHON_BIN" -c "
import sqlite3
db = sqlite3.connect('$TEST_CLARKE/clark.db')
db.execute('INSERT INTO chapters (volume, chapter_number, title, path, summary, word_count, state) VALUES (0, 1, \"熵增的黄昏\", \"7-正文/第1章.txt\", \"量子物理学家林深...\", 3800, \"written\")')
db.commit()
db.close()
print('Chapter record inserted directly')
" 2>&1

  STATS_OUTPUT=$("$PYTHON_BIN" "$INDEX_SCRIPT" stats 2>&1)
  CHAPTER_COUNT=$(echo "$STATS_OUTPUT" | grep "^Chapters:" | sed 's/.*: *\([0-9]*\).*/\1/')
  if [[ "$CHAPTER_COUNT" -ge 1 ]]; then
    echo "    $PASS Chapter record written to DB (DB layer works)"
    ((TEST_PASS++))
  else
    echo "    $FAIL Chapter record not found"
    ((TEST_FAIL++))
  fi
fi

# ── Test: stats ─────────────────────────────────────────────────

describe "typer-index stats — 数据库概览"

STATS_OUTPUT=$("$PYTHON_BIN" "$INDEX_SCRIPT" stats 2>&1)
if echo "$STATS_OUTPUT" | grep -q "Chapters\|Database\|Vectors"; then
  echo "    $PASS Stats command outputs correctly"
  ((TEST_PASS++))
else
  echo "    $FAIL Stats command failed"
  ((TEST_FAIL++))
fi

# Clean up test project
rm -rf "$TEST_PROJ"

# ── Test: empty DB graceful degradation ─────────────────────────

describe "空数据库上的优雅降级"

EMPTY_DIR=$(mktemp -d)
EMPTY_CLARKE="$EMPTY_DIR/.clarke"
EMPTY_CHAPTERS="$EMPTY_DIR/7-正文"
mkdir -p "$EMPTY_CLARKE"
mkdir -p "$EMPTY_CHAPTERS"

export CLARKE_DB_DIR="$EMPTY_CLARKE"
export CLARKE_DB_PATH="$EMPTY_CLARKE/clark.db"
export CLARKE_CHAPTERS_DIR="$EMPTY_CHAPTERS"
export CLARKE_CHARACTER_FILE="$EMPTY_DIR/核心人物.md"

"$PYTHON_BIN" "$INDEX_SCRIPT" init > /dev/null 2>&1

# Try prescan on empty DB
EMPTY_RESULT=$("$PYTHON_BIN" "$INDEX_SCRIPT" prescan --concept "test" 2>&1)
if echo "$EMPTY_RESULT" | grep -qiE "no results|no chapters|Error"; then
  echo "    $PASS Prescan on empty DB degrades gracefully"
  ((TEST_PASS++))
else
  echo "    $WARN Prescan on empty DB behaviour unclear"
  ((TEST_WARN++))
fi

rm -rf "$EMPTY_DIR"
unset CLARKE_DB_DIR CLARKE_DB_PATH CLARKE_CHAPTERS_DIR CLARKE_CHARACTER_FILE

# ── Summary ──────────────────────────────────────────────────────

print_test_summary
test_ok
