# Auto-Advance State Tracker
# This file is read/written by skills to determine the current workflow position.
# Update after each workflow step completes.
# Chapter status is CUMULATIVE — old entries persist when units advance.
# States: pending / written / reviewed / science-reviewed / edited

current_volume: 1
current_unit: 1
unit_range_start: 1
unit_range_end: 1

# Chapter-level progress (cumulative, append-only — never delete old entries)
# States: pending / written / reviewed / science-reviewed / edited

# (empty — no chapters yet)

# Current workflow step
# 审稿分流: ≤3章用 joint-review（合并报告）; ≥4章用 review → science-review（分步审稿）
# Values: init/topic/settings/character/style/structure/research/outline/write/review/science-review/joint-review/editor/reader-review/consistency/export/wrap
workflow_step: init

# Last completed action
last_completed: "typer-init — 全新启动"
next_action: "开始新选题讨论：/typer-topic"
