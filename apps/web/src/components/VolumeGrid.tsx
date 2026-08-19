import type { Chapter, Volume } from "@clark-typer/content";
import { STATUS_COLOR, STATUS_LABEL } from "../lib/viz";

// 卷章节网格：各卷 → 章节状态色块（参考 novel-factory 的任务关系可视化）
export function VolumeGrid({ chapters, volumes }: { chapters: Chapter[]; volumes: Volume[] }) {
  const byVolume = new Map<number, Chapter[]>();
  for (const c of chapters) {
    const list = byVolume.get(c.volume) ?? [];
    list.push(c);
    byVolume.set(c.volume, list);
  }
  const volumeNos = [...byVolume.keys()].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4">
      {volumeNos.map((vno) => {
        const list = (byVolume.get(vno) ?? []).sort((a, b) => a.no - b.no);
        const title = volumes.find((v) => v.no === vno)?.title ?? "";
        return (
          <div
            key={vno}
            className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4"
          >
            <div className="mb-3 flex items-baseline gap-2">
              <span className="font-display text-[15px] text-[var(--ink)]">第{vno}卷</span>
              {title && <span className="text-[12px] text-[var(--ink-tertiary)]">{title}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((c) => (
                <span
                  key={c.no}
                  className="h-4 w-4 rounded-[3px]"
                  style={{ backgroundColor: STATUS_COLOR[c.status] }}
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