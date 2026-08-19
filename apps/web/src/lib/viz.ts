import type { ChapterStatus, Relation } from "@clark-typer/content";

export const STATUS_LABEL: Record<ChapterStatus, string> = {
  pending: "待写",
  written: "已写",
  reviewed: "已审",
  edited: "已润色",
};

export const STATUS_COLOR: Record<ChapterStatus, string> = {
  pending: "var(--pending)",
  written: "var(--info)",
  reviewed: "var(--warning)",
  edited: "var(--success)",
};

export interface CharacterDegree {
  name: string;
  in: number;
  out: number;
  total: number;
}

// 角色关系中心度：由关系矩阵边的出度/入度计算，反映角色在网络中的地位
export function characterDegrees(relations: Relation[]): CharacterDegree[] {
  const map = new Map<string, { in: number; out: number }>();
  for (const r of relations) {
    const a = map.get(r.from) ?? { in: 0, out: 0 };
    a.out += 1;
    map.set(r.from, a);
    const b = map.get(r.to) ?? { in: 0, out: 0 };
    b.in += 1;
    map.set(r.to, b);
  }
  return [...map.entries()]
    .map(([name, d]) => ({ name, ...d, total: d.in + d.out }))
    .sort((x, y) => y.total - x.total);
}