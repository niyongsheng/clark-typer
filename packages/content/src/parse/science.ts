import { SCIENCE_TIER_LABELS, type ScienceSetting, type ScienceTier } from "../types.js";

const TIER_MAP: Record<string, ScienceTier> = {
  已知科学: "known",
  合理外推: "extrapolation",
  核心假设: "assumption",
};

const HEADING_RE = /^##\s*\[(已知科学|合理外推|核心假设)\]\s*(.*)$/;

// 3-科学设定/科学设定.md 中的三层标注：`## [已知科学] 名称` 等。
export function parseScienceSettings(raw: string): ScienceSetting[] {
  const settings: ScienceSetting[] = [];
  let current: ScienceSetting | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(HEADING_RE);
    if (m) {
      if (current) settings.push(current);
      const tier = TIER_MAP[m[1]];
      current = {
        name: m[2].trim() || m[1],
        tier,
        tierLabel: SCIENCE_TIER_LABELS[tier],
        description: "",
      };
    } else if (current) {
      current.description += `${line}\n`;
    }
  }
  if (current) settings.push(current);

  return settings;
}