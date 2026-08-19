import {
  SCIENCE_TIER_LABELS,
  type ChapterStatus,
  type ScienceTier,
} from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { VolumeGrid } from "../components/VolumeGrid";
import { fetchContent } from "../lib/api";
import { STATUS_COLOR, STATUS_LABEL, characterDegrees } from "../lib/viz";

const TIERS: ScienceTier[] = ["known", "extrapolation", "assumption"];
const STATUSES: ChapterStatus[] = ["pending", "written", "reviewed", "edited"];

const TIER_STYLE: Record<ScienceTier, { border: string }> = {
  known: { border: "#4caf7d" },
  extrapolation: { border: "#6090c0" },
  assumption: { border: "#d4743c" },
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
      <div className="font-display text-2xl text-[var(--ink)]">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--ink-mute)]">{label}</div>
    </div>
  );
}

export function Dashboard() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const chapters = content?.chapters ?? [];
  const volumes = content?.volumes ?? [];
  const progress = content?.progress;
  const science = content?.scienceSettings ?? [];
  const relations = content?.relations ?? [];

  const written = chapters.filter((c) => c.status !== "pending").length;
  const edited = chapters.filter((c) => c.status === "edited").length;
  const degrees = characterDegrees(relations);
  const maxDegree = Math.max(1, ...degrees.map((d) => d.total));

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>数据看板</h2>
      </div>
      <div className="page-body space-y-6">
        {/* 统计卡片 */}
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="章节数" value={chapters.length} />
            <Stat label="已写" value={written} />
            <Stat label="已润色" value={edited} />
            <Stat label="分卷" value={volumes.length} />
          </div>
        </section>

        {/* 工作流状态 */}
        <section>
          <div className="dash-card-title">工作流</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--ink-mute)]">当前阶段</div>
              <div className="mt-1 font-display text-xl text-[var(--ink)]">
                {progress?.workflowStep ?? "init"}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--ink-mute)]">进度位置</div>
              <div className="mt-1 font-display text-xl text-[var(--ink)]">
                第{progress?.currentVolume ?? 1}卷 · 第{progress?.currentUnit ?? 1}单元
              </div>
            </div>
            <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--ink-mute)]">下一步</div>
              <div className="mt-1 line-clamp-2 text-[13px] text-[var(--ink-secondary)]">
                {progress?.nextAction || "—"}
              </div>
            </div>
          </div>
        </section>

        {/* 章节状态分布 */}
        <section>
          <div className="dash-card-title">章节状态分布</div>
          <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
            <div className="flex flex-wrap gap-1">
              {chapters.map((c) => (
                <div
                  key={c.no}
                  className="h-4 w-4 rounded-[3px]"
                  style={{ backgroundColor: STATUS_COLOR[c.status] }}
                  title={`第${c.no}章 ${c.title}（${STATUS_LABEL[c.status]}）`}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-[var(--ink-mute)]">
              {STATUSES.map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[s] }}
                  />
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 卷章节网格 */}
        <section>
          <div className="dash-card-title">卷章节进度</div>
          <VolumeGrid chapters={chapters} volumes={volumes} />
        </section>

        {/* 角色关系中心度 + 科学三层标注 */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="dash-card-title">角色关系中心度</div>
            <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
              <div className="flex flex-col gap-2.5">
                {degrees.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 truncate text-[13px] text-[var(--ink)]">
                      {d.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--canvas)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(d.total / maxDegree) * 100}%`, background: "var(--accent-gold)" }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[12px] text-[var(--ink-mute)]">
                      {d.total}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-[var(--ink-tertiary)]">
                按关系矩阵边的出/入度合计，反映角色在关系网中的中心地位
              </div>
            </div>
          </div>

          <div>
            <div className="dash-card-title">科学三层标注</div>
            <div className="grid grid-cols-3 gap-3">
              {TIERS.map((tier) => {
                const count = science.filter((s) => s.tier === tier).length;
                const style = TIER_STYLE[tier];
                return (
                  <Link
                    key={tier}
                    to={`/science?tier=${tier}`}
                    className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4 transition-colors hover:bg-[var(--canvas-elevated)]"
                    style={{ borderLeft: `3px solid ${style.border}` }}
                  >
                    <div className="text-[11px] uppercase tracking-wide text-[var(--ink-mute)]">
                      {SCIENCE_TIER_LABELS[tier]}
                    </div>
                    <div className="mt-2 font-display text-2xl text-[var(--ink)]">{count}</div>
                    <div className="mt-1 text-[11px] text-[var(--ink-tertiary)]">项设定</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}