import type { ChapterStatus, ProgressState, WorkflowStep } from "../types.js";

const STATUS_VALUES: readonly ChapterStatus[] = ["pending", "written", "reviewed", "edited"];

const STEP_VALUES: readonly WorkflowStep[] = [
  "init",
  "topic",
  "settings",
  "character",
  "style",
  "structure",
  "research",
  "outline",
  "write",
  "review",
  "editor",
  "reader-review",
  "consistency",
  "export",
  "wrap",
];

// .claude/current-state.md 状态追踪器。
export function parseState(raw: string): ProgressState {
  const state: ProgressState = {
    currentVolume: 1,
    currentUnit: 1,
    unitRangeStart: 1,
    unitRangeEnd: 1,
    workflowStep: "init",
    lastCompleted: "",
    nextAction: "",
    chapterStatuses: {},
  };

  for (const line of raw.split(/\r?\n/)) {
    // 章节级累计状态（兼容两种格式：chN: status 与 `第N章 标题: status`）
    const ch = line.match(/^ch(\d+):\s*(\w+)\s*$/);
    if (ch) {
      const val = ch[2].toLowerCase() as ChapterStatus;
      if (STATUS_VALUES.includes(val)) {
        state.chapterStatuses[Number(ch[1])] = val;
      }
      continue;
    }

    const chZh = line.match(/^第(\d+)章\s*.+?:\s*(pending|written|reviewed|edited)\s*$/);
    if (chZh) {
      state.chapterStatuses[Number(chZh[1])] = chZh[2] as ChapterStatus;
      continue;
    }

    const kv = line.match(/^([a-zA-Z_]+):\s*(.+?)\s*$/);
    if (kv) {
      const value = kv[2].replace(/^["']|["']$/g, "");
      switch (kv[1]) {
        case "current_volume":
          state.currentVolume = Number(value) || state.currentVolume;
          break;
        case "current_unit":
          state.currentUnit = Number(value) || state.currentUnit;
          break;
        case "unit_range_start":
          state.unitRangeStart = Number(value) || state.unitRangeStart;
          break;
        case "unit_range_end":
          state.unitRangeEnd = Number(value) || state.unitRangeEnd;
          break;
        case "workflow_step":
          if (STEP_VALUES.includes(value as WorkflowStep)) {
            state.workflowStep = value as WorkflowStep;
          }
          break;
        case "last_completed":
          state.lastCompleted = value;
          break;
        case "next_action":
          state.nextAction = value;
          break;
      }
    }
  }

  return state;
}