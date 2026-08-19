import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import type { ContentBundle, FileNode, Volume } from "./types.js";
import { readChapters } from "./read/chapters.js";
import { parseSnapshots } from "./parse/snapshot.js";
import { parseState } from "./parse/state.js";
import { parseBookMeta } from "./parse/meta.js";
import { parseScienceSettings } from "./parse/science.js";
import { parseCharacters, parseRelations } from "./parse/characters.js";
import { parseVolumeFile } from "./parse/volumes.js";
import { parseChapterOutlines } from "./parse/outline.js";

// clark-typer 的内容目录（编号目录，正文为纯文本 .txt）
const CONTENT_DIRS = [
  "0-角色档案",
  "1-思想实验",
  "2-世界观设定",
  "3-科学设定",
  "4-分卷大纲",
  "5-剧情单元",
  "6-分章大纲",
  "7-正文",
  "8-参考资料",
  "9-素材碎片",
] as const;

const SKIP_DIRS = new Set([
  "node_modules",
  ".claude",
  ".clark",
  ".git",
  "dist",
  "packages",
  "apps",
  "打包发布",
  ".trae",
  ".DS_Store",
]);

function tryRead(root: string, rel: string): string {
  try {
    return readFileSync(join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function listDirFiles(root: string, relDir: string): { name: string; raw: string }[] {
  const abs = join(root, relDir);
  const out: { name: string; raw: string }[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(abs);
  } catch {
    return out;
  }
  for (const name of entries.sort()) {
    if (!name.endsWith(".md") && !name.endsWith(".txt")) continue;
    try {
      out.push({ name, raw: readFileSync(join(abs, name), "utf8") });
    } catch {
      // ignore unreadable
    }
  }
  return out;
}

export function safeResolve(root: string, rel: string): string {
  const rootAbs = resolve(root);
  const abs = resolve(root, rel);
  if (abs !== rootAbs && !abs.startsWith(`${rootAbs}${sep}`)) {
    throw new Error(`Path escapes project root: ${rel}`);
  }
  return abs;
}

export function readTextFile(root: string, rel: string): string {
  return readFileSync(safeResolve(root, rel), "utf8");
}

export function writeTextFile(root: string, rel: string, content: string): void {
  const abs = safeResolve(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
}

export function readBundle(root: string): ContentBundle {
  const book = parseBookMeta(
    tryRead(root, "1-思想实验/选题.md"),
    tryRead(root, "1-思想实验/创作意图.md"),
    tryRead(root, "1-思想实验/写作风格.md"),
  );

  const progress = parseState(tryRead(root, ".claude/current-state.md"));

  const chaptersDir = join(root, "7-正文");
  const chapters = existsSync(chaptersDir)
    ? readChapters(chaptersDir, progress.chapterStatuses)
    : [];

  const snapshots = parseSnapshots(tryRead(root, ".claude/chapter-snapshot.md"));
  const scienceSettings = parseScienceSettings(tryRead(root, "3-科学设定/科学设定.md"));
  const characters = parseCharacters(tryRead(root, "0-角色档案/核心人物.md"));
  const relations = parseRelations(tryRead(root, "0-角色档案/关系图谱.md"));

  const volumes = listDirFiles(root, "4-分卷大纲")
    .map((f) => parseVolumeFile(f.name, f.raw))
    .filter((v): v is Volume => v !== null);

  // 章节归属：根据分卷大纲「各章概要」推断章节 → 卷
  const chapterToVolume = new Map<number, number>();
  for (const v of volumes) {
    for (const n of v.chapterNos) chapterToVolume.set(n, v.no);
  }
  for (const ch of chapters) {
    const vol = chapterToVolume.get(ch.no);
    if (vol !== undefined) ch.volume = vol;
  }

  // 原文透传，供前端以 Markdown/表格只读渲染
  const worldRaw = tryRead(root, "2-世界观设定/世界观.md");
  const relationsRaw = tryRead(root, "0-角色档案/关系图谱.md");
  const chapterOutlines = listDirFiles(root, "6-分章大纲").flatMap((f) => parseChapterOutlines(f.raw));

  return {
    book,
    chapters,
    snapshots,
    volumes,
    scienceSettings,
    characters,
    relations,
    progress,
    worldRaw,
    relationsRaw,
    chapterOutlines,
  };
}

function relPath(root: string, abs: string): string {
  return resolve(abs).slice(resolve(root).length + 1);
}

function listDir(root: string, dir: string): FileNode[] {
  const abs = resolve(root, dir);
  const nodes: FileNode[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(abs);
  } catch {
    return nodes;
  }
  for (const name of entries.sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const absPath = join(abs, name);
    const rel = relPath(root, absPath);
    let isDir = false;
    try {
      isDir = statSync(absPath).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      nodes.push({ name, path: rel, type: "dir", children: listDir(root, rel) });
    } else if (name.endsWith(".md") || name.endsWith(".txt")) {
      nodes.push({ name, path: rel, type: "file" });
    }
  }
  return nodes;
}

export function listContentFiles(root: string): FileNode[] {
  const dirs: FileNode[] = [];
  for (const d of CONTENT_DIRS) {
    const abs = join(root, d);
    if (!existsSync(abs)) continue;
    dirs.push({ name: d, path: d, type: "dir", children: listDir(root, d) });
  }
  return dirs;
}

// 打包发布目录下的成品文件（EPUB/PDF/TXT 等），供导出页只读预览。
export function listReleaseFiles(root: string): FileNode[] {
  const abs = join(root, "打包发布");
  if (!existsSync(abs)) return [];
  const nodes: FileNode[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(abs);
  } catch {
    return nodes;
  }
  for (const name of entries.sort()) {
    if (name.startsWith(".")) continue;
    const absPath = join(abs, name);
    try {
      if (statSync(absPath).isDirectory()) {
        nodes.push({ name, path: `打包发布/${name}`, type: "dir" });
      } else {
        nodes.push({ name, path: `打包发布/${name}`, type: "file" });
      }
    } catch {
      // ignore unreadable
    }
  }
  return nodes;
}