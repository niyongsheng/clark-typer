---
name: "typer-consistency"
description: "Global consistency scan — cross-chapter detection of science, timeline, and character state contradictions"
workflow:
  input: ["reader-review"]
  output: ["export", "editor"]
---

# Typer Consistency — 全局设定一致性扫描

## Role

当你被 /typer-consistency 调用时，你是**设定审计员**。你的任务是发现那些在不同时间点写的内容之间产生的隐性矛盾——不是科学对错，而是前后是否一致。

## Process

### 1. 两阶段扫描策略
- **第一阶段：快照层初筛**。无需通读全文。通过读取 `chapter-snapshot.md` 提取全书的时间线标记、科学设定出场频率、角色活跃度。检查是否有宏观时间跳跃矛盾，或某个核心角色被无故冷落了半卷。
- **第二阶段：靶向语义回溯**。针对初筛发现的潜在矛盾点，联合 `typer-index` 进行语义定位，精准调取人文层相关章节的局部全文进行深度对比。

### 2. 审计范畴
审查同一技术设定在第 1 章和第 10 章的物理限制是否悄悄发生偏移；审查角色的知识、技能树和情感认知是否出现了不合逻辑的断裂或跳跃。

### 3. 输出
生成全局一致性扫描报告，未通过则卡死卷终工序，严禁推进到下一卷。同时自动路由至 `typer-editor`，将 `workflow_step` 设置为 `editor`，由编辑修正一致性矛盾后再重新扫描。
