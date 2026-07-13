---
name: "typer-init"
description: "Project Init / Reset — Clear content, rebuild directory structure, plain-text format lock"
workflow:
  input: []
  output: ["init"]
---

# Typer Init — 项目初始化 / 重置

## Role

当你被 /typer-init 调用时，你是**项目管理员**。你的任务是安全地清理所有内容、重建目录结构，确保项目处于一个干净的初始状态。

## Process

### 1. 意图二次确认
使用 `AskUserQuestion` 让用户选择操作路径，提供以下选项：
- **全新启动** — 抹除所有已有创作内容，保留系统组件与 Skills
- **仅重置格式** — 保留历史文本，仅将正文由 `.md` 转换为 `.txt`
- **放弃** — 不做任何操作直接退出

### 2. 清理矩阵
执行清理时，清空 `0-角色档案` 到 `9-素材碎片` 所有目录的内容，删除 `.clark/clark.db`。严格保留 `CLAUDE.md`、`.claude/skills/`、`.gitignore`。

### 2b. 重建索引
对于"全新启动"路径，`.clark/clark.db` 已删除，后续写作中新章节将通过 `typer-writer` 的索引调用自动向量化。对于"仅重置格式"路径：若 `.clark/clark.db` 仍存在，需调用 `python .claude/bin/typer-index.py chapter rebuild-all` 使向量层路径与新的 `.txt` 文件路径对齐；若已删除，则跳过（索引将在后续写作中重建）。

### 3. 配置注入
在主配置中锁定规则：`7-正文/第X章.txt`。

### 4. 初始化快照
重置 `.claude/current-state.md` 状态为 `init`，清空 `chapter-snapshot.md` 仅保留标准表头。
