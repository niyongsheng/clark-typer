#!/usr/bin/env python3
"""
typer-import: 导入外部作品 (TXT/EPUB/PDF) 并解析为章节结构化数据。

Usage:
    python .claude/bin/typer-import.py <file> [--out DIR] [--chunk N]

输出到 --out（默认 .claude/temp/import/）：
    - 第1章.txt / 第2章.txt ...（首行 `第N章 标题`，正文随后）
    - _summary.json（章节数、总字数、作品标题猜测、高频人名草案）
"""

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import zipfile
from collections import Counter
from pathlib import Path

# 常见中文姓氏（用于人名启发式抽取的起点）
SURNAMES = (
    "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎"
    "鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹"
)

# 章节标题识别（中文数字/阿拉伯数字章回节卷 + 英文 Chapter + 序/楔/尾声等）
HEAD_RE = re.compile(
    r"^\s*((?:第[0-9一二三四五六七八九十百千零〇]+[章回节卷])|(?:Chapter|CHAPTER)\s+\d+"
    r"|序章|楔子|引子|番外|尾声|后记|Prologue|Epilogue|Foreword|Afterword)\b[\s：:．.\-—]*(.*)$"
)


def read_txt(path: Path) -> str:
    for enc in ("utf-8", "gb18030", "gbk", "big5"):
        try:
            return path.read_text(encoding=enc)
        except (UnicodeDecodeError, ValueError):
            continue
    raise RuntimeError("无法识别 TXT 编码（已尝试 utf-8/gb18030/gbk/big5）")


def _strip_tags(html_text: str) -> str:
    html_text = re.sub(r"<script[\s\S]*?</script>", "", html_text, flags=re.I)
    html_text = re.sub(r"<style[\s\S]*?</style>", "", html_text, flags=re.I)
    # 块级标签转行
    html_text = re.sub(r"<(?:br|p|div|li|h[1-6]|tr|section|article)[^>]*>", "\n", html_text, flags=re.I)
    html_text = re.sub(r"<[^>]+>", "", html_text)
    return html.unescape(html_text)


def read_epub(path: Path) -> str:
    parts = []
    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
        htmls = [
            n for n in names
            if n.lower().endswith((".xhtml", ".html", ".htm")) and "__MACOSX" not in n
        ]
        # 按文件名中的数字先后排序，近似 spine 顺序
        htmls.sort(key=lambda n: [int(s) if s.isdigit() else s.lower() for s in re.split(r"(\d+)", n)])
        if not htmls:
            raise RuntimeError("EPUB 中未找到正文 HTML 文件")
        for n in htmls:
            parts.append(_strip_tags(zf.read(n).decode("utf-8", "ignore")))
    return "\n\n".join(parts)


def read_pdf(path: Path) -> str:
    # 优先 poppler 的 pdftotext（保真度较好）
    if shutil.which("pdftotext"):
        result = subprocess.run(
            ["pdftotext", "-layout", str(path), "-"],
            capture_output=True, text=True,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout
    try:
        from pypdf import PdfReader
    except ImportError:
        raise RuntimeError("PDF 解析需安装 poppler(pdftotext) 或 `pip install pypdf`")
    reader = PdfReader(str(path))
    return "\n\n".join((page.extract_text() or "") for page in reader.pages)


def detect_format(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".txt":
        return "txt"
    if suffix == ".epub":
        return "epub"
    if suffix == ".pdf":
        return "pdf"
    raise RuntimeError(f"不支持的格式：{suffix}（仅支持 TXT/EPUB/PDF）")


def extract_text(path: Path) -> str:
    fmt = detect_format(path)
    if fmt == "txt":
        return read_txt(path)
    if fmt == "epub":
        return read_epub(path)
    return read_pdf(path)


def split_chapters(text: str, chunk: int) -> list[tuple[str, str]]:
    """返回 [(标题, 正文), ...]；无章节标记时按字数均分。"""
    chapters: list[tuple[str, str]] = []
    cur_title = "前言"
    buf: list[str] = []

    def flush() -> None:
        if buf:
            chapters.append((cur_title, "\n".join(buf).strip()))
        buf.clear()

    for line in text.splitlines():
        stripped = line.strip()
        m = HEAD_RE.match(stripped)
        if m and len(stripped) <= 40:
            flush()
            cur_title = (m.group(2) or m.group(1)).strip()
        else:
            buf.append(line)
    flush()

    # 仅识别到 0~1 个章节标记者，视为无目录结构，按字数切分
    if len(chapters) <= 1:
        chapters = []
        rest = text.strip()
        while len(rest) > chunk:
            chapters.append((f"第{len(chapters) + 1}章", rest[:chunk].strip()))
            rest = rest[chunk:]
        if rest:
            chapters.append((f"第{len(chapters) + 1}章", rest.strip()))
    return chapters


def top_names(text: str, limit: int) -> list[str]:
    """中文人名启发式草案：常见姓氏开头 + 1~2 个汉字，取高频 TOP N（仅供草稿，需人工确认）。"""
    pat = re.compile(rf"[{SURNAMES}][\u4e00-\u9fa5]{{1,2}}")
    counter = Counter(m.group(0) for m in pat.finditer(text))
    return [name for name, _ in counter.most_common(limit)]


def guess_title(path: Path, text: str) -> str:
    # 优先取正文首行非空文本，否则回退文件名
    for line in text.splitlines():
        if line.strip() and not HEAD_RE.match(line.strip()):
            return line.strip()[:30]
    return path.stem


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="导入 TXT/EPUB/PDF 作品并解析为章节")
    parser.add_argument("file", help="待导入文件路径")
    parser.add_argument("--out", default=".claude/temp/import", help="章节输出目录")
    parser.add_argument("--chunk", type=int, default=4000, help="无目录时按字数切分的阈值")
    args = parser.parse_args(argv)

    src = Path(args.file).expanduser()
    if not src.exists():
        print(f"文件不存在：{src}", file=sys.stderr)
        return 1

    text = extract_text(src)
    if not text.strip():
        print("解析结果为空，请检查文件内容", file=sys.stderr)
        return 1

    chapters = split_chapters(text, args.chunk)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    for i, (title, body) in enumerate(chapters, start=1):
        (out / f"第{i}章.txt").write_text(f"第{i}章 {title}\n\n{body}\n", encoding="utf-8")

    total_chars = sum(len(b) for _, b in chapters)
    summary = {
        "source": str(src),
        "format": detect_format(src),
        "title": guess_title(src, text),
        "chapter_count": len(chapters),
        "total_chars": total_chars,
        "top_names": top_names(text, 20),
        "output_dir": str(out),
    }
    (out / "_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))