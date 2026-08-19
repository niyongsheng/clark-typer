import type { Character, Relation } from "../types.js";

const CHAR_HEADING_RE = /^#{2,3}\s*(.+)$/;

// 0-角色档案/核心人物.md：以二级/三级标题识别人物，标题下内容归为该人物的 raw。
export function parseCharacters(raw: string): Character[] {
  const chars: Character[] = [];
  let current: Character | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(CHAR_HEADING_RE);
    if (m) {
      if (current) chars.push(current);
      const name = m[1].trim();
      // 仅保留人物标题（含年龄括号或「·标签」）；跳过「人物关系速览」等元节
      const isPerson = /[（(]/.test(name) || /[·•]/.test(name);
      current = isPerson ? { name, raw: "" } : null;
    } else if (current) {
      current.raw += `${line}\n`;
    }
  }
  if (current) chars.push(current);

  return chars;
}

function clean(name: string): string {
  return name.replace(/["[\]()]/g, "").trim();
}

// 解析 Mermaid 边（A --> B 或 A -->|label| B）
function parseMermaidRelations(raw: string): Relation[] {
  const relations: Relation[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.includes("-->")) continue;

    const labeled = t.match(/^(\S+)\s*-->\s*\|([^|]+)\|\s*(\S+)\s*$/);
    if (labeled) {
      relations.push({ from: clean(labeled[1]), to: clean(labeled[3]), label: labeled[2].trim() });
      continue;
    }

    const dashed = t.match(/^(\S+)\s*--(.+?)-->\s*(\S+)\s*$/);
    if (dashed) {
      relations.push({ from: clean(dashed[1]), to: clean(dashed[3]), label: dashed[2].trim() });
      continue;
    }

    const plain = t.match(/^(\S+)\s*-->\s*(\S+)\s*$/);
    if (plain) {
      relations.push({ from: clean(plain[1]), to: clean(plain[2]), label: "" });
    }
  }

  return relations;
}

// 解析 Markdown 关系矩阵表格（行=源人物，列=目标人物，单元格=关系描述）
function parseMatrixRelations(raw: string): Relation[] {
  const relations: Relation[] = [];
  let columns: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;

    const cells = t.split("|").map((s) => s.trim());
    if (cells[0] === "") cells.shift();
    if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
    if (cells.length === 0) continue;

    // 分隔行 |---|---|
    if (cells.every((c) => /^-+$/.test(c))) continue;

    // 表头：首列为空 → 记录列名
    if (columns.length === 0 && cells[0] === "") {
      columns = cells.slice(1).map((s) => s.replace(/\*\*/g, ""));
      continue;
    }

    // 数据行：首列为行名（加粗），其余为关系到列
    const rowName = cells[0].replace(/\*\*/g, "").trim();
    if (!rowName || columns.length === 0) continue;

    for (let i = 1; i < cells.length; i++) {
      const colName = columns[i - 1] ?? "";
      const label = cells[i].trim();
      if (!colName || label === "" || label === "—" || label === "---") continue;
      relations.push({ from: rowName, to: colName, label });
    }
  }

  return relations;
}

// 0-角色档案/关系图谱.md：优先 Mermaid，否则解析关系矩阵表格。
export function parseRelations(raw: string): Relation[] {
  const mermaid = parseMermaidRelations(raw);
  return mermaid.length > 0 ? mermaid : parseMatrixRelations(raw);
}