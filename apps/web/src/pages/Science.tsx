import { SCIENCE_TIER_LABELS, type ScienceTier } from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { Markdown } from "../components/Markdown";
import { fetchContent } from "../lib/api";

const TIERS: { tier: ScienceTier; color: string; bg: string; note: string }[] = [
  { tier: "known", color: "#4caf7d", bg: "rgba(76,175,125,0.12)", note: "已被实验验证的真实理论" },
  { tier: "extrapolation", color: "#6090c0", bg: "rgba(96,144,192,0.12)", note: "基于现有科学路线的工程演进逻辑链" },
  { tier: "assumption", color: "#d4743c", bg: "rgba(212,116,60,0.12)", note: "故事的“科学虚构”基石（未验证但不证伪）" },
];

export function Science() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const [params] = useSearchParams();
  const science = content?.scienceSettings ?? [];
  const activeTier = params.get("tier");

  useEffect(() => {
    if (activeTier && content) {
      document.getElementById(`tier-${activeTier}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTier, content]);

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>科学设定</h2>
        <div className="page-header-actions">
          <span className="text-[13px] text-[var(--ink-tertiary)]">{science.length} 项 · 三层标注</span>
        </div>
      </div>
      <div className="page-body space-y-10">
        {TIERS.map(({ tier, color, bg, note }) => {
          const items = science.filter((s) => s.tier === tier);
          return (
            <section key={tier} id={`tier-${tier}`} className="scroll-mt-6">
              <div className="mb-4 flex items-baseline gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                  style={{ color, background: bg }}
                >
                  {SCIENCE_TIER_LABELS[tier]}
                </span>
                <span className="text-[12px] text-[var(--ink-tertiary)]">
                  {items.length} 项 · {note}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((s) => (
                  <div
                    key={s.name}
                    className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-5"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <h3 className="mb-2 font-display text-lg text-[var(--ink)]">{s.name}</h3>
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