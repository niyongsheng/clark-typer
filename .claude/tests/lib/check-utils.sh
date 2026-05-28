#!/bin/bash
# check-utils.sh — file existence, pattern matching, assertions for test scripts
#
# Usage: source lib/check-utils.sh
# Provides: assert_file_exists, assert_pattern_in_file, etc.

# Find project root by looking for CLAUDE.md (robust to any sourcing context)
_find_project_root() {
  local dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/CLAUDE.md" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  echo "."
}
PROJECT_ROOT="$(_find_project_root)"

# Resolve path: if relative, prepend project root
_resolve() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    echo "$path"
  else
    echo "$PROJECT_ROOT/$path"
  fi
}

# Colors
PASS="✓"
FAIL="✗"
WARN="⚠"

# Counters (exported so runner.sh can read them)
export TEST_PASS=0
export TEST_FAIL=0
export TEST_WARN=0

# Test state
_current_test=""

init_test_run() {
  TEST_PASS=0
  TEST_FAIL=0
  TEST_WARN=0
}

describe() {
  _current_test="$1"
  echo ""
  echo "  ▶ $1"
}

assert_file_exists() {
  local path="$1"
  local msg="${2:-Expected file to exist: $path}"
  local full_path="$(_resolve "$path")"

  if [[ -f "$full_path" ]]; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg"
    ((TEST_FAIL++))
  fi
}

assert_dir_exists() {
  local path="$1"
  local msg="${2:-Expected directory to exist: $path}"
  local full_path="$(_resolve "$path")"

  if [[ -d "$full_path" ]]; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg"
    ((TEST_FAIL++))
  fi
}

assert_file_not_exists() {
  local path="$1"
  local msg="${2:-Expected file to NOT exist: $path}"
  local full_path="$(_resolve "$path")"

  if [[ ! -f "$full_path" ]]; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg"
    ((TEST_FAIL++))
  fi
}

assert_pattern_in_file() {
  local pattern="$1"
  local path="$2"
  local msg="${3:-Expected pattern '$pattern' in file}"
  local full_path="$(_resolve "$path")"

  if [[ ! -f "$full_path" ]]; then
    echo "    $FAIL $msg (file not found: $full_path)"
    ((TEST_FAIL++))
    return 1
  fi

  if grep -q "$pattern" "$full_path" 2>/dev/null; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg"
    ((TEST_FAIL++))
  fi
}

assert_not_pattern_in_file() {
  local pattern="$1"
  local path="$2"
  local msg="${3:-Expected pattern '$pattern' NOT in file}"
  local full_path="$(_resolve "$path")"

  if [[ ! -f "$full_path" ]]; then
    echo "    $WARN $msg (file not found, skipping)"
    ((TEST_WARN++))
    return 0
  fi

  if ! grep -q "$pattern" "$full_path" 2>/dev/null; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg"
    ((TEST_FAIL++))
  fi
}

assert_dir_empty() {
  local path="$1"
  local msg="${2:-Expected directory to be empty: $path}"
  local full_path="$(_resolve "$path")"

  if [[ ! -d "$full_path" ]]; then
    echo "    $WARN $msg (directory not found, skipping)"
    ((TEST_WARN++))
    return 0
  fi

  local count
  count=$(find "$full_path" -mindepth 1 2>/dev/null | wc -l)
  if [[ "$count" -eq 0 ]]; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg ($count items found)"
    ((TEST_FAIL++))
  fi
}

assert_dir_not_empty() {
  local path="$1"
  local msg="${2:-Expected directory to be non-empty: $path}"
  local full_path="$(_resolve "$path")"

  if [[ ! -d "$full_path" ]]; then
    echo "    $WARN $msg (directory not found, skipping)"
    ((TEST_WARN++))
    return 0
  fi

  local count
  count=$(find "$full_path" -mindepth 1 2>/dev/null | wc -l)
  if [[ "$count" -gt 0 ]]; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg (empty)"
    ((TEST_FAIL++))
  fi
}

assert_file_pattern_exists() {
  local pattern="$1"
  local msg="${2:-Expected file matching pattern: $pattern}"
  local full_pattern="$(_resolve "$pattern")"

  # shellcheck disable=SC2086
  local matches
  matches=$(ls $full_pattern 2>/dev/null | head -1)
  if [[ -n "$matches" ]]; then
    echo "    $PASS $msg"
    ((TEST_PASS++))
  else
    echo "    $FAIL $msg"
    ((TEST_FAIL++))
  fi
}

print_test_summary() {
  echo ""
  echo "  ─────────────────────────────────────"
  echo "  Results: $PASS $TEST_PASS passed | $FAIL $TEST_FAIL failed | $WARN $TEST_WARN warnings"
  echo ""
}

# Returns 0 if all tests passed, 1 if any failed
test_ok() {
  [[ "$TEST_FAIL" -eq 0 ]]
}
