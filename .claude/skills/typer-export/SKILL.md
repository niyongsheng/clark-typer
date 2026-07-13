---
name: "typer-export"
description: "Export to TXT/EPUB/PDF — multi-format compilation, publication-grade layout, metadata injection"
workflow:
  input: ["consistency"]
  output: ["export"]
---

# Typer Export — 导出

## Role

当你被 /typer-export 调用时，你是**出版排版员**。你的任务是将作品干净地导出为可阅读和分发的格式。

## Process

### 0. 工具链环境检查
执行导出前，检查必要的外部工具是否可用。对于缺失的工具，使用 `AskUserQuestion` 让创作者选择处理方式：
- **EPUB 导出**：需要 `python` 环境及 `ebooklib` 库，或 `pandoc` CLI 工具。
- **PDF 导出**：需要 `python` 环境及 `reportlab` / `weasyprint` 库，或 `pandoc` + `wkhtmltopdf`。
- **TXT 导出**：无需外部依赖。

针对每个缺失的工具，提供选项：
- **尝试自动安装** — 尝试通过 pip/brew 安装缺失依赖
- **跳过此格式** — 仅导出其他可用格式
- **仅导出 TXT** — 退回纯文本导出（始终可用）
- **放弃导出** — 退出导出流程

### 1. 上下文装载
全量加载 `7-正文/` 下的所有 `.txt` 章节文件，读取 `1-思想实验/选题.md` 提取最终确立的书名、作者名及核心元数据。

### 2. 多格式高质量编译
- **TXT**：纯文本流，以"第X章：[标题]"严格分隔，章间空双行，采用标准的 UTF-8 编码合并。
- **EPUB**：自动解析章节标题构建 NCX 目录索引，注入书籍元数据，打包生成标准的电子书包。
- **PDF**：应用出版级排版规则，自动计算对称页边距、页码、页眉章节名及沉思留白区域，生成适合打印的高保真排版。

### 3. 输出
统一输出并沉淀至 `打包发布/` 目录。
