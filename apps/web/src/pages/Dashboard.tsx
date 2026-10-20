import { type ChapterStatus, SCIENCE_TIER_LABELS, type ScienceTier } from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { AsciiBar } from "../components/AsciiBar";
import { VolumeGrid } from "../components/VolumeGrid";
import { fetchContent } from "../lib/api";
import { SCIENCE_TIER_COLOR, STATUS_COLOR, STATUS_LABEL, characterDegrees } from "../lib/viz";

const TIERS: ScienceTier[] = ["known", "extrapolation", "assumption"];
const STATUSES: ChapterStatus[] = ["pending", "written", "reviewed", "edited"];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5">
      <div className="font-display text-[32px] font-medium leading-10 tracking-[-0.02em] tabular-nums text-[var(--ink)]">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
        {label}
      </div>
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
  const topDegrees = degrees.slice(0, 6);
  const remainingDegrees = degrees.slice(6);

  const distribution = STATUSES.map((status) => ({
    status,
    count: chapters.filter((c) => c.status === status).length,
  }));
  const pct = (n: number) => (chapters.length ? Math.round((n / chapters.length) * 100) : 0);

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>数据看板</h2>
        <div className="page-header-actions">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-[var(--ink-tertiary)]">
            <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--accent)] shadow-[0_0_6px_var(--crt-glow-soft)]" />
            [{progress?.workflowStep ?? "init"}]
          </span>
        </div>
      </div>
      <div className="page-body space-y-8">
        {/* 统计带 */}
        <section>
          <div className="grid grid-cols-2 divide-y divide-[color:var(--hairline)] overflow-hidden rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <Stat label="章节数" value={chapters.length} />
            <Stat label="已写" value={written} />
            <Stat label="已润色" value={edited} />
            <Stat label="分卷" value={volumes.length} />
          </div>
        </section>

        {/* 工作流 */}
        <section>
          <div className="dash-card-title">工作流</div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.4fr]">
            <div className="rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                当前阶段
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--accent)] shadow-[0_0_6px_var(--crt-glow-soft)]" />
                <span className="font-mono text-[18px] text-[var(--ink)]">
                  {progress?.workflowStep ?? "init"}
                </span>
              </div>
            </div>
            <div className="rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                进度位置
              </div>
              <div className="mt-2 font-display text-[18px] font-medium tracking-[-0.01em] text-[var(--ink)]">
                第{progress?.currentVolume ?? 1}卷 · 第{progress?.currentUnit ?? 1}单元
              </div>
            </div>
            <div className="overflow-hidden rounded-none border border-[var(--hairline)] bg-[var(--canvas)] shadow-[0_0_24px_var(--crt-glow-soft)]">
              <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-4 py-2 font-mono text-[10px] text-[var(--ink-mute)]">
                <span>[-]</span>
                <span>[o]</span>
                <span>[x]</span>
                <span className="ml-1">clark://next</span>
              </div>
              <div className="px-4 py-4 font-mono text-[13px] leading-6">
                <div>
                  <span className="text-[var(--accent-text)]">$</span>{" "}
                  <span className="text-[var(--ink-secondary)]">next --action</span>
                </div>
                <div className="mt-1 text-[var(--ink)]">{progress?.nextAction || "—"}</div>
              </div>
            </div>
          </div>
        </section>

        {/* 创作进度 */}
        <section>
          <div className="dash-card-title">创作进度</div>
          <div className="rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-[14px] font-medium text-[var(--ink)]">章节状态</div>
              <div className="font-mono text-[11px] text-[var(--ink-mute)]">
                {chapters.length} 章 · {pct(edited)}% 已润色
              </div>
            </div>
            <div className="mt-4">
              <AsciiBar
                label="章节状态分布"
                segments={distribution.map((d) => ({
                  value: d.count,
                  color: STATUS_COLOR[d.status],
                  label: STATUS_LABEL[d.status],
                  hatch: d.status === "pending",
                }))}
                total={chapters.length}
                progress={written}
                readout={`${pct(written)}%`}
                cursor
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {distribution.map((d) => (
                <span
                  key={d.status}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--ink-mute)]"
                >
                  <span
                    className="h-2 w-2 shrink-0"
                    style={
                      d.status === "pending"
                        ? {
                            backgroundImage:
                              "repeating-linear-gradient(135deg, var(--hatch-ink) 0 1px, transparent 1px 3px)",
                            boxShadow: "inset 0 0 0 1px var(--hatch-border)",
                          }
                        : {
                            background: STATUS_COLOR[d.status],
                            boxShadow: "0 0 5px var(--crt-glow-soft)",
                          }
                    }
                  />
                  {STATUS_LABEL[d.status]}
                  <span className="font-mono text-[11px] text-[var(--ink-tertiary)]">
                    {d.count}
                  </span>
                  <span className="font-mono text-[10px]">{pct(d.count)}%</span>
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
            <div className="rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] p-5">
              {degrees.length === 0 ? (
                <div className="text-[14px] text-[var(--ink-mute)]">暂无关系数据</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {topDegrees.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="w-5 shrink-0 font-mono text-[11px] text-[var(--ink-mute)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="w-20 shrink-0 truncate text-[14px] text-[var(--ink)]">
                        {d.name}
                      </span>
                      <div className="min-w-0 flex-1">
                        <AsciiBar
                          label={`${d.name} 关系中心度`}
                          size="sm"
                          cells={16}
                          value={d.total}
                          max={maxDegree}
                          color={i === 0 ? "var(--accent)" : "var(--ink-tertiary)"}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right font-mono text-[12px] text-[var(--ink-mute)]">
                        {d.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {remainingDegrees.length > 0 && (
                <div className="mt-3 font-mono text-[11px] text-[var(--ink-mute)]">
                  +{remainingDegrees.length} 人
                </div>
              )}
              <div className="mt-3 text-[11px] leading-5 text-[var(--ink-tertiary)]">
                按关系矩阵边的出/入度合计，反映角色在关系网中的中心地位
              </div>
            </div>
          </div>

          <div>
            <div className="dash-card-title">科学三层标注</div>
            <div className="rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] p-5">
              <AsciiBar
                label="科学三层标注"
                segments={TIERS.map((tier) => ({
                  value: science.filter((s) => s.tier === tier).length,
                  color: SCIENCE_TIER_COLOR[tier],
                  label: SCIENCE_TIER_LABELS[tier],
                }))}
                total={science.length}
                readout={`${science.length} 项`}
              />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {TIERS.map((tier) => {
                  const count = science.filter((s) => s.tier === tier).length;
                  return (
                    <Link
                      key={tier}
                      to={`/science?tier=${tier}`}
                      className="rounded-none p-2 transition-colors hover:bg-[var(--canvas-pop)]"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-mute)]">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-[1px]"
                          style={{
                            background: SCIENCE_TIER_COLOR[tier],
                            boxShadow: "0 0 5px var(--crt-glow-soft)",
                          }}
                        />
                        <span className="truncate">{SCIENCE_TIER_LABELS[tier]}</span>
                      </div>
                      <div className="mt-1.5 font-display text-[24px] font-medium leading-7 tracking-[-0.02em] tabular-nums text-[var(--ink)]">
                        {count}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--ink-tertiary)]">项设定</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
