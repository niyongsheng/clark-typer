# Auto-Advance State Tracker
# This file is read/written by skills to determine the current workflow position.
# Update after each workflow step completes.
# Chapter status is CUMULATIVE — old entries persist when units advance.
# States: pending / written / reviewed / edited

current_volume: 2
current_unit: 12
unit_range_start: 7
unit_range_end: 12

# Chapter-level progress (cumulative, append-only — never delete old entries)
# States: pending / written / reviewed / edited

第1章 出征: written
第2章 辩论: written
第3章 接入: written
第4章 乡愁: written
第5章 结构: written
第6章 第一句话: written
第7章 听证: written
第8章 读: written
第9章 最后对话: written
第10章 抉择前夜: written
第11章 出发: written
第12章 回声: written

# Current workflow step
# 审稿: review（内含文学+科学两个维度，一次性产出整合报告）
# Values: init/topic/settings/character/style/structure/research/outline/write/review/editor/reader-review/consistency/export/wrap
workflow_step: wrap

# Last completed action
last_completed: "第二卷《沉默》完成 — U8-U12 全部 written；卷终工序完成（设定全息扫描/哲学主线审计/上下文收束）；全书 12 章完结"
next_action: "卷终（终态）：全书完结。可选后续：typer-consistency 全书正式扫描 / typer-export 打包导出 / 读者试读反馈"
