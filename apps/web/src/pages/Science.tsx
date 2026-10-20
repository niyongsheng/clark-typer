import { SCIENCE_TIER_LABELS, type ScienceTier } from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { Markdown } from "../components/Markdown";
import { fetchContent } from "../lib/api";
import { SCIENCE_TIER_COLOR } from "../lib/viz";

const TIERS: { tier: ScienceTier; note: string }[] = [
  { tier: "known", note: "已被实验验证的真实理论" },
  { tier: "extrapolation", note: "基于现有科学路线的工程演进逻辑链" },
  { tier: "assumption", note: "故事的“科学虚构”基石（未验证但不证伪）" },
];

export function Science() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const [params] = useSearchParams();
  const science = content?.scienceSettings ?? [];
  const activeTier = params.get("tier");

  useEffect(() => {
    if (activeTier && content) {
      document
        .getElementById(`tier-${activeTier}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTier, content]);

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>科学设定</h2>
        <div className="page-header-actions">
          <span className="font-mono text-[11px] text-[var(--ink-mute)]">
            {science.length} 项 · 三层标注
          </span>
        </div>
      </div>
      <div className="page-body space-y-10">
        {TIERS.map(({ tier, note }) => {
          const items = science.filter((s) => s.tier === tier);
          const color = SCIENCE_TIER_COLOR[tier];
          return (
            <section key={tier} id={`tier-${tier}`} className="scroll-mt-6">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-[1px]"
                  style={{ background: color, boxShadow: "0 0 5px var(--crt-glow-soft)" }}
                />
                <span className="shrink-0 text-[14px] font-medium text-[var(--ink)]">
                  {SCIENCE_TIER_LABELS[tier]}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[var(--ink-mute)]">
                  {items.length} 项
                </span>
                <span className="truncate text-[12px] text-[var(--ink-tertiary)]">{note}</span>
                <span className="h-px flex-1 bg-[var(--hairline)]" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((s) => (
                  <div
                    key={s.name}
                    className="rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] p-6"
                    style={{ borderLeft: `2px solid ${color}` }}
                  >
                    <h3 className="mb-2 text-[18px] font-medium tracking-[-0.01em] text-[var(--ink)]">
                      {s.name}
                    </h3>
                    <Markdown>{s.description}</Markdown>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
