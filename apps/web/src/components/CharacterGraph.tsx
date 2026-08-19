import type { ContentBundle } from "@clark-typer/content";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { useSettingsStore, type Theme } from "../stores/useSettingsStore";

// 主角名（关系图谱中心节点）—— 换项目时在此修改
const PROTAGONIST = "陆辰";

const shorten = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

interface Palette {
  nodeBg: string;
  centerBg: string;
  text: string;
  border: string;
  edgeStroke: string;
  labelFill: string;
  labelBg: string;
  grid: string;
}

const PALETTES: Record<Theme, Palette> = {
  dark: {
    nodeBg: "#1c1a17",
    centerBg: "#2a241b",
    text: "#ece8dd",
    border: "#3a3733",
    edgeStroke: "#423d35",
    labelFill: "#8a867c",
    labelBg: "#12100e",
    grid: "#2a2721",
  },
  light: {
    nodeBg: "#ffffff",
    centerBg: "#fdeee1",
    text: "#1d1d1f",
    border: "#d1d1d6",
    edgeStroke: "#c7c7cc",
    labelFill: "#6e6e73",
    labelBg: "#ffffff",
    grid: "#d1d1d6",
  },
};

function buildGraph(content: ContentBundle | undefined, theme: Theme) {
  const pal = PALETTES[theme];
  const relations = content?.relations ?? [];

  const nameSet = new Set<string>();
  for (const r of relations) {
    nameSet.add(r.from);
    nameSet.add(r.to);
  }

  // 主角置中，其余环形分布
  const rest = Array.from(nameSet).filter((n) => n !== PROTAGONIST);
  const cx = 400;
  const cy = 300;
  const radius = 220;

  const positioned: { name: string; x: number; y: number }[] = [];
  if (nameSet.has(PROTAGONIST)) positioned.push({ name: PROTAGONIST, x: cx, y: cy });
  rest.forEach((name, i) => {
    const angle = (i / Math.max(rest.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positioned.push({ name, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  });

  const nodes: Node[] = positioned.map((p) => ({
    id: p.name,
    position: { x: p.x, y: p.y },
    data: { label: p.name },
    style: {
      width: 96,
      padding: "6px 8px",
      fontSize: 12,
      fontWeight: 500,
      textAlign: "center",
      background: p.name === PROTAGONIST ? pal.centerBg : pal.nodeBg,
      color: pal.text,
      border: `1px solid ${p.name === PROTAGONIST ? "var(--accent-gold)" : pal.border}`,
      borderRadius: 8,
    },
  }));

  const edges: Edge[] = relations.map((r, i) => ({
    id: `${r.from}->${r.to}:${i}`,
    source: r.from,
    target: r.to,
    label: shorten(r.label, 8),
    labelStyle: { fill: pal.labelFill, fontSize: 10 },
    labelBgStyle: { fill: pal.labelBg },
    labelBgPadding: [3, 2] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: pal.edgeStroke },
    markerEnd: { type: MarkerType.ArrowClosed, color: pal.edgeStroke, width: 14, height: 14 },
  }));

  return { nodes, edges };
}

export function CharacterGraph({ content }: { content?: ContentBundle }) {
  const theme = useSettingsStore((s) => s.theme);
  const pal = PALETTES[theme];
  const { nodes, edges } = useMemo(() => buildGraph(content, theme), [content, theme]);

  if (nodes.length === 0) {
    return <div className="text-[13px] text-[var(--ink-tertiary)]">暂无关系数据（0-角色档案/关系图谱.md）</div>;
  }

  return (
    <div className="h-[560px] w-full overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--canvas)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        colorMode={theme === "dark" ? "dark" : "light"}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={pal.grid} gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}