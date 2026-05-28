#!/bin/bash
# state-utils.sh — read/write/validate current-state.md
#
# Usage: source lib/state-utils.sh
# Provides: read_step, set_step, validate_step, get_transitions

# Find project root by walking up to CLAUDE.md
_find_state_root() {
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
STATE_FILE="$(_find_state_root)/.claude/current-state.md"

# Read current workflow_step from state file
read_step() {
  grep "^workflow_step:" "$STATE_FILE" 2>/dev/null | sed 's/.*: *//' | tr -d ' '
}

# Read any key=value from state file
read_state_key() {
  local key="$1"
  grep "^${key}:" "$STATE_FILE" 2>/dev/null | sed 's/.*: *//' | tr -d ' '
}

# Validate that a step is in the allowed workflow_steps list
validate_step() {
  local step="$1"
  local config_file="$(_find_state_root)/.claude/tests/config.json"

  if command -v python3 &>/dev/null; then
    python3 -c "
import json, sys
with open('$config_file') as f:
    cfg = json.load(f)
steps = cfg['workflow_steps']
if '$step' in steps:
    sys.exit(0)
else:
    print(f'Invalid step: $step (valid: {\", \".join(steps)})')
    sys.exit(1)
"
  else
    # Fallback: hardcoded list from CLAUDE.md
    case "$step" in
      init|topic|settings|character|style|structure|research|outline|write|review|science-review|joint-review|editor|reader-review|consistency|export|wrap) return 0 ;;
      *) echo "Unknown step: $step"; return 1 ;;
    esac
  fi
}

# Get valid next steps for a given step from config
get_valid_transitions() {
  local step="$1"
  local config_file="$(_find_state_root)/.claude/tests/config.json"

  python3 -c "
import json, sys
with open('$config_file') as f:
    cfg = json.load(f)
transitions = cfg.get('valid_transitions', {}).get('$step', [])
if transitions:
    print(' '.join(transitions))
else:
    print('')
" 2>/dev/null || echo ""
}

# Check if current step allows advancing to target
can_transition_to() {
  local target="$1"
  local current
  current=$(read_step)
  local valid
  valid=$(get_valid_transitions "$current")
  [[ " $valid " == *" $target "* ]]
}
