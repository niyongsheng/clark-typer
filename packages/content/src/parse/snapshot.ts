import type { ChapterSnapshot } from "../types.js";

function splitCells(s: string): string[] {
  return s
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((x) => x.trim());
}

function splitNames(s: string): string[] {
  return s
    .split(/[、,，/]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

// .claude/chapter-snapshot.md 的 8 列表格：
// | 章节 | 关键事件 | 科学设定出场 | 角色出场 | 角色-科学感知 | 时间标记 | 思想实验推进 | 节拍 |
// append-only，同一章多次追加时取最后一次。
export function parseSnapshots(raw: string): ChapterSnapshot[] {
  const byNo = new Map<number, ChapterSnapshot>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.includes("第")) continue;

    const cells = splitCells(trimmed);
    if (cells.length < 8) continue;

    const noMatch = cells[0].match(/第(\d+)章/);
    if (!noMatch) continue; // 跳过表头/分隔行

    byNo.set(Number(noMatch[1]), {
      no: Number(noMatch[1]),
      events: cells[1],
      scienceSettings: splitNames(cells[2]),
      characters: splitNames(cells[3]),
      characterPerceptions: cells[4],
      time: cells[5],
      thoughtProgress: cells[6],
      beat: cells[7],
    });
  }

  return [...byNo.values()].sort((a, b) => a.no - b.no);
}