import type { OutlineChapter } from "../types.js";

const HEADING_RE = /^##\s*第(\d+)章\s*(.*)$/;

// 6-分章大纲/*.md 中每条 `## 第N章 标题` → OutlineChapter（标题下内容归 raw）。
export function parseChapterOutlines(raw: string): OutlineChapter[] {
  const outlines: OutlineChapter[] = [];
  let current: OutlineChapter | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(HEADING_RE);
    if (m) {
      if (current) outlines.push(current);
      current = { no: Number(m[1]), title: m[2].trim() || `第${m[1]}章`, raw: "" };
    } else if (current) {
      current.raw += `${line}\n`;
    }
  }
  if (current) outlines.push(current);

  return outlines;
}