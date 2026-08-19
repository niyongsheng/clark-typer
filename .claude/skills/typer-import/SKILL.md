---
name: "typer-import"
description: "Import external works (TXT/EPUB/PDF) — parse into chapters and project scaffold to continue or remix via the workflow. Invoke when importing an existing book into clark-typer."
workflow:
  input: []
  output: ["init"]
---

# Typer Import — 外部作品导入

## Role

当你被 /typer-import 调用时，你是**档案入库员**。你的任务是把一部已有的外部作品（TXT / EPUB / PDF）干净地解析成项目可读的正文结构，并重置工作流，让创作者可以基于它继续创作或进行二创。

> 💡 **核心定位**：导入 ≠ 简单转码。你产出的是「结构化正文（`7-正文/第X章.txt`）+ 元数据/角色草稿 + 归位到 `init` 的工作流」，让后续 `typer-topic` → `typer-settings` → …→ `typer-writer` 链条无缝接力。

## Process

### 0. 文件定位与格式校验
- 从调用参数提取文件路径；若未提供，用 `Glob` 扫描项目根目录与 `待导入/` 下的 `*.txt` / `*.epub` / `*.pdf`。
- 若有多个候选，用 `AskUserQuestion` 让创作者选择具体文件。
- 校验扩展名 ∈ {`.txt`, `.epub`, `.pdf`}，否则提示并退出。

### 1. 冲突检测与备份确认
- 检查 `7-正文/`、`0-角色档案/`、`1-思想实验/` 等是否已有内容。
- 若已有内容（如现存 12 章正文），用 `AskUserQuestion` 让创作者选择：
  - **备份后导入** — 将现有内容目录整体改名为 `*.bak`（遵循 `.bak` 收敛约定），再接管为导入作品
  - **直接覆盖** — 清空相关目录后导入（危险，需二次确认）
  - **仅解析到临时目录** — 只运行解析，产出到 `.claude/temp/import/`，不部署、不动现有内容

### 2. 用途确认（续写 / 二创 / 仅入库）
用 `AskUserQuestion` 确认导入用途，结果记入 `1-思想实验/创作意图.md`：
- **续写续作** — 保留原作设定与人物，接着往下写
- **二创改编** — 保留骨架，重塑世界观/人物/风格
- **仅解析入库** — 只产出正文与元数据，不改动工作流方向

### 3. 解析抽取
调用解析脚本（需先确认 Python3 可用）：

```bash
python3 .claude/bin/typer-import.py "<文件路径>" --out .claude/temp/import
```

- **TXT**：自动尝试 utf-8 / gb18030 / gbk / big5 编码回退。
- **EPUB**：解包并剥离 HTML 标签，按 spine 近似顺序拼接正文。
- **PDF**：优先 `pdftotext`（poppler），回退 `pypdf`；缺失时报 `pip install pypdf` 或 `brew install poppler`。

脚本输出 `_summary.json`：章节数、总字数、作品标题猜测、高频人名草案。

### 4. 章节部署
- 读取 `_summary.json` 校验章节数与总字数非空。
- 将 `.claude/temp/import/` 下的 `第X章.txt` 逐个部署到 `7-正文/`，文件名与首行格式统一为 `第N章 标题`（沿用现有正文章节格式，纯文本 UTF-8）。
- 仅解析入库的路径：跳过部署，直接交付 `.claude/temp/import/` 结果即可。

### 5. 元数据与角色草稿
- 将 `_summary.json` 的标题写入 `1-思想实验/选题.md`（标注「导入作品：<原始路径>」），作者名若可推断则一并写入。
- 将高频人名草案写入 `0-角色档案/核心人物.md`（标注「导入解析草稿，待 typer-character 确认」），`0-角色档案/关系图谱.md` 留空占位。
- 在 `1-思想实验/创作意图.md` 记录本次导入的用途结论（步骤 2）。

### 6. 状态重置与索引
- 重置 `.claude/current-state.md`：`workflow_step: init`，`current_volume/current_unit` 归零，章节进度表清空（导入章节默认标记 `written` 或留 `pending`，按用途酌情）。
- 若 `.clark/clark.db` 存在，调用 `python3 .claude/bin/typer-index.py chapter rebuild-all` 使索引层对齐新章节路径。

### 7. 交接
输出导入摘要：来源、格式、章节数、总字数、作品标题、角色草案数量，并提示下一步可执行 `typer-topic`（续写/二创）或直接 `typer-writer` / Web 工作台预览。