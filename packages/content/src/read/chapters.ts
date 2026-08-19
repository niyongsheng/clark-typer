import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Chapter, ChapterStatus } from "../types.js";
import { parseChapterText } from "../parse/chapter-text.js";

const CHAPTER_FILE_RE = /^第(\d+)章\.txt$/;

export function listChapterNos(dir: string): number[] {
  const nos: number[] = [];
  for (const file of readdirSync(dir)) {
    const m = file.match(CHAPTER_FILE_RE);
    if (m) nos.push(Number(m[1]));
  }
  return nos.sort((a, b) => a - b);
}

export function readChapters(
  dir: string,
  statuses: Record<number, ChapterStatus>,
): Chapter[] {
  const chapters: Chapter[] = [];
  for (const no of listChapterNos(dir)) {
    const raw = readFileSync(join(dir, `第${no}章.txt`), "utf8");
    const { title, body } = parseChapterText(raw, no);
    chapters.push({
      no,
      title,
      // 卷/单元精确归属需结合分卷大纲推断；MVP 暂置 1，后续阶段完善
      volume: 1,
      unit: 1,
      status: statuses[no] ?? "pending",
      content: body,
    });
  }
  return chapters;
}