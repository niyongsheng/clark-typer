import type { Chapter, ChapterStatus, Volume } from "@clark-typer/content";
import { STATUS_COLOR, STATUS_LABEL } from "../lib/viz";
import { AsciiBar } from "./AsciiBar";

const STATUSES: ChapterStatus[] = ["pending", "written", "reviewed", "edited"];

// 卷章节网格：卷头进度 + 章节状态格（Warp 式安静的数据陈列）
export function VolumeGrid({ chapters, volumes }: { chapters: Chapter[]; volumes: Volume[] }) {
  const byVolume = new Map<number, Chapter[]>();
  for (const c of chapters) {
    const list = byVolume.get(c.volume) ?? [];
    list.push(c);
    byVolume.set(c.volume, list);
  }
  const volumeNos = [...byVolume.keys()].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-3">
      {volumeNos.map((vno) => {
        const list = (byVolume.get(vno) ?? []).sort((a, b) => a.no - b.no);
        const title = volumes.find((v) => v.no === vno)?.title ?? "";
        const edited = list.filter((c) => c.status === "edited").length;
        const pct = list.length ? Math.round((edited / list.length) * 100) : 0;
        const written = list.filter((c) => c.status !== "pending").length;
        const writtenPct = list.length ? Math.round((written / list.length) * 100) : 0;
        return (
          <div
            key={vno}
            className="rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 text-[14px] font-medium text-[var(--ink)]">
                  第{vno}卷
                </span>
                {title && (
                  <span className="truncate text-[13px] text-[var(--ink-tertiary)]">{title}</span>
                )}
              </div>
              <div className="shrink-0 font-mono text-[11px] text-[var(--ink-mute)]">
                {list.length} 章 · {pct}% 已润色
              </div>
            </div>
            <div className="mt-3">
              <AsciiBar
                label={`第${vno}卷章节状态`}
                segments={STATUSES.map((status) => ({
                  value: list.filter((c) => c.status === status).length,
                  color: STATUS_COLOR[status],
                  label: STATUS_LABEL[status],
                  hatch: status === "pending",
                }))}
                total={list.length}
                progress={written}
                readout={`${writtenPct}%`}
                cursor
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {list.map((c) => (
                <span
                  key={c.no}
                  className="h-[18px] w-[18px] rounded-none transition-opacity hover:opacity-75"
                  style={
                    c.status === "pending"
                      ? {
                          backgroundColor: "transparent",
                          backgroundImage:
                            "repeating-linear-gradient(135deg, var(--hatch-ink) 0 1px, transparent 1px 4px)",
                          border: "1px solid var(--hairline)",
                        }
                      : {
                          backgroundColor: STATUS_COLOR[c.status],
                          border: "1px solid transparent",
                          boxShadow: "0 0 6px var(--crt-glow-soft)",
                        }
                  }
                  title={`第${c.no}章 ${c.title}（${STATUS_LABEL[c.status]}）`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
