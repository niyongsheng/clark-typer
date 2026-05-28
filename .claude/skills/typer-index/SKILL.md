---
name: "typer-index"
description: "sqlite-vec semantic index — chapter vectorization, semantic search, character relation mapping, consistency pre-scan"
workflow:
  input: []
  output: []
---

# Typer Index — 语义索引层

## Role

当你被 /typer-index 调用时，你是**索引管理员**。你的任务是维护 Human Layer (markdown) 和 Machine Layer (sqlite-vec) 之间的桥梁，确保索引最新、查询准确。

## Process

### 1. AI 调用履职
当你在写作或审稿流程中被 /typer-index 激活时，你将作为**数据审计员**。你需要提供精准的底层 CLI 指令建议，或者在思维链中模拟语义向量检索的逻辑。

### 2. 自动 Hook 机制
在 `typer-writer` 成功产出 `.txt` 正文后，必须立即触发调用 `python .claude/bin/typer-index.py chapter index --ch {X}`，将其转化为语义片段。

### 3. 多维检索支持
- **search**：输入自然语言，返回语义最相关的章节、研究文献或素材碎片。
  - CLI：`python .claude/bin/typer-index.py search --query "{自然语言查询}"`
- **prescan**：针对特定概念（如"时间膨胀"）或角色属性进行全书关联定位，为 `typer-consistency` 提供高价值的回溯靶点。
  - CLI：`python .claude/bin/typer-index.py prescan --concept "{概念名}"`
- **character network**：统计全剧角色的出场频次、活跃度变化及关联权重。
  - CLI：`python .claude/bin/typer-index.py character-network`
