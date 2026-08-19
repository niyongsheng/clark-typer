const TITLE_RE = /^第(\d+)章\s*(.*)$/;

export interface ParsedChapterText {
  title: string;
  body: string;
}

export function parseChapterText(raw: string, fallbackNo: number): ParsedChapterText {
  const lines = raw.split(/\r?\n/);
  let title = `第${fallbackNo}章`;
  let start = 0;
  if (lines.length > 0) {
    const m = lines[0].match(TITLE_RE);
    if (m) {
      title = m[2].trim() || `第${m[1]}章`;
      start = 1;
    }
  }
  while (start < lines.length && lines[start].trim() === "") start += 1;
  return { title, body: lines.slice(start).join("\n") };
}