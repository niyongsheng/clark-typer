import type { Volume } from "../types.js";

const CN_DIGITS: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

// 支持阿拉伯数字与中文数字卷号（第一卷 / 第2卷 / 第十二卷 …）
function parseCnNumber(s: string): number | null {
  if (/^\d+$/.test(s)) return Number(s);
  if (s === "十") return 10;
  if (/^十[一二三四五六七八九]$/.test(s)) return 10 + CN_DIGITS[s[1]];
  if (/^[一二三四五六七八九]十[一二三四五六七八九]$/.test(s)) return CN_DIGITS[s[0]] * 10 + CN_DIGITS[s[2]];
  if (/^[一二三四五六七八九]十$/.test(s)) return CN_DIGITS[s[0]] * 10;
  if (/^[一二三四五六七八九]$/.test(s)) return CN_DIGITS[s];
  return null;
}

const FILE_RE = /^第(.+?)卷\.md$/;
const CHAPTER_RE = /^###\s*第\s*(\d+)\s*章/;

function pickTitle(raw: string, fallback: string): string {
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const base = t.replace(/^#+\s*/, "").replace(/^第(?:[0-9]+|[一二三四五六七八九十]+)卷[：:]\s*/, "");
    if (base) return base;
  }
  return fallback;
}

// 4-分卷大纲/ 下每个「第X卷.md」→ Volume（卷号兼容中文数字）
export function parseVolumeFile(name: string, raw: string): Volume | null {
  const m = name.match(FILE_RE);
  if (!m) return null;
  const no = parseCnNumber(m[1].trim());
  if (no === null) return null;

  const chapterNos: number[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const cm = line.match(CHAPTER_RE);
    if (cm) chapterNos.push(Number(cm[1]));
  }

  return { no, title: pickTitle(raw, `第${no}卷`), raw, chapterNos };
}