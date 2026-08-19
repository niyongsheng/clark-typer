export type WorkflowStep =
  | "init"
  | "topic"
  | "settings"
  | "character"
  | "style"
  | "structure"
  | "research"
  | "outline"
  | "write"
  | "review"
  | "editor"
  | "reader-review"
  | "consistency"
  | "export"
  | "wrap";

export type ChapterStatus = "pending" | "written" | "reviewed" | "edited";

export type ScienceTier = "known" | "extrapolation" | "assumption";

export const SCIENCE_TIER_LABELS: Record<ScienceTier, string> = {
  known: "已知科学",
  extrapolation: "合理外推",
  assumption: "核心假设",
};

export interface BookMeta {
  title: string;
  englishTitle: string;
  author: string;
  genre: string;
  tags: string[];
  topicRaw: string;
  intentRaw: string;
  styleRaw: string;
}

export interface Chapter {
  no: number;
  title: string;
  volume: number;
  unit: number;
  status: ChapterStatus;
  content: string;
}

// chapter-snapshot.md 的 8 列表格行（append-only，同一章取最后一次）
export interface ChapterSnapshot {
  no: number;
  events: string;
  scienceSettings: string[];
  characters: string[];
  characterPerceptions: string;
  time: string;
  thoughtProgress: string;
  beat: string;
}

export interface Volume {
  no: number;
  title: string;
  raw: string;
  // 卷内章节号（由「各章概要」推断，用于把章节归属到卷）
  chapterNos: number[];
}

// 6-分章大纲/*.md 中每条 `## 第N章 标题`
export interface OutlineChapter {
  no: number;
  title: string;
  raw: string;
}

// 3-科学设定/科学设定.md 中每条 `## [标签] 名称`
export interface ScienceSetting {
  name: string;
  tier: ScienceTier;
  tierLabel: string;
  description: string;
}

export interface Character {
  name: string;
  raw: string;
}

export interface Relation {
  from: string;
  to: string;
  label: string;
}

export interface ProgressState {
  currentVolume: number;
  currentUnit: number;
  unitRangeStart: number;
  unitRangeEnd: number;
  workflowStep: WorkflowStep;
  lastCompleted: string;
  nextAction: string;
  chapterStatuses: Record<number, ChapterStatus>;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
}

export interface ContentBundle {
  book: BookMeta;
  chapters: Chapter[];
  snapshots: ChapterSnapshot[];
  volumes: Volume[];
  scienceSettings: ScienceSetting[];
  characters: Character[];
  relations: Relation[];
  progress: ProgressState;
  // 原文透传，供前端以 Markdown/表格只读渲染
  worldRaw: string;
  relationsRaw: string;
  chapterOutlines: OutlineChapter[];
}