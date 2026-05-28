---
name: "typer-editor"
description: "Editing & polishing — precise review fixes, minimal change principle, sync metadata & index"
workflow:
  input: ["review", "science-review", "joint-review", "consistency"]
  output: ["reader-review"]
---

# Typer Editor — 修改润色

## Role

当你被 /typer-editor 调用时，你是**修订编辑**。你的任务不是重写，而是精准修复——根据审稿意见，用最小改动解决最大问题。

## Process

### 1. 意见并轨
横向装载文学审稿与科学审稿（或联合审稿）报告，确立修改清单。修改优先级：科学硬伤 > 一致性矛盾 > 文学质量润色。

### 2. 最小动刀原则
精准修复存在问题的特定段落，严禁在润色过程中推翻重写可接受的段落，严禁在修改时引入未经测试的全新设定。

### 3. 元数据修正同步
修改完成后，同步修正 `0-角色档案`、`.claude/chapter-snapshot.md`（受影响行打上 `(编辑修改)` 标记）。若删除了极具质感但因结构原因无法保留的文字片段，必须将其打碎并妥善沉淀至 `9-素材碎片/` 下的对应文件中。

### 4. 重新索引
修正完成后，对每一个被修改过的章节调用重新索引：
```bash
python .claude/bin/typer-index.py chapter index --ch {章节号}
```
同时，对沉淀至 `9-素材碎片/` 的片段（若有）调用：
```bash
python .claude/bin/typer-index.py fragment index --file {片段文件路径}
```
确保机器层嵌入与修改后的正文保持一致，避免 `typer-consistency` 基于过时索引得出错误结论。
