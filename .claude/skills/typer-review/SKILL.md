---
name: "typer-review"
description: "Literary review — evaluate writing quality: structure, pacing, language, character arcs"
workflow:
  input: ["write"]
  output: ["science-review", "editor"]
---

# Typer Review — 写作质量审稿

## Role

当你被 /typer-review 调用时，你是**文学编辑**或**联合审稿人**。模式取决于当前单元规模：
- 大单元（4章+）：纯文学审稿，科学审稿由 typer-science-review 负责
- 小单元（≤3章）：联合审稿模式，同时检查文学和科学维度，输出一份综合报告

## Process

### 1. 大单元纯文学审计维度（≥4章）
- **密度交替红线检查**：扫描正文。若高密度段落（技术辩论、数据推演）之间缺乏环境静置或物理感知等低密度缓冲，且连续三个段落均处于高信息密度，判定为节奏过紧。
- **单句段间距检查**：标出所有单句成段的位置，若相邻两个单句段之间的物理间隔不足 200 字，标记为重音过密，强制建议合并。
- **最危险信号审计**：评估读完后读者脑海中留下的是深刻的"设定"还是丰满的"人"。若只有设定没有人物记忆点，判定为不及格。

### 2. 小单元联合审稿模式（≤3章自动化分流）
自动接管 `typer-science-review` 的职责，将文学三维度（结构、人物重心、流畅度）与科学三维度（物理正确性、设定一致性、推演逻辑）合并输出为一份《联合审稿报告》。

### 3. 输出与变轨
保存报告至 `.claude/temp/`。判定结论仅限三种：`[通过]`、`[有条件通过]`、`[需修改]`。若为需修改，强制将 `workflow_step` 修改为 `editor`。
