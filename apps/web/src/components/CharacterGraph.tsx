import type { ContentBundle } from "@clark-typer/content";
import { Background, Controls, type Edge, MarkerType, type Node, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { type Theme, useSettingsStore } from "../stores/useSettingsStore";

// 主角名（关系图谱中心节点）—— 换项目时在此修改
const PROTAGONIST = "陆辰";

const shorten = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

interface Palette {
  nodeBg: string;
  centerBg: string;
  centerText: string;
  text: string;
  border: string;
  edgeStroke: string;
  labelFill: string;
  labelBg: string;
  grid: string;
}

const PALETTES: Record<Theme, Palette> = {
  dark: {
    nodeBg: "#0b1a12",
    centerBg: "#39ff88",
    centerText: "#04140a",
    text: "#c8ffd4",
    border: "#2a5239",
    edgeStroke: "#2f6b47",
    labelFill: "#6aa37e",
    labelBg: "#07110b",
    grid: "#10241a",
  },
  light: {
    nodeBg: "#f4f9ee",
    centerBg: "#0f6b3a",
    centerText: "#f4f9ee",
    text: "#0b2e17",
    border: "#b9cdb3",
    edgeStroke: "#6f9079",
    labelFill: "#3f6b4b",
    labelBg: "#e9f1e2",
    grid: "#cfdcc9",
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
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      fontWeight: 500,
      textAlign: "center",
      background: p.name === PROTAGONIST ? pal.centerBg : pal.nodeBg,
      color: p.name === PROTAGONIST ? pal.centerText : pal.text,
      border: `1px solid ${p.name === PROTAGONIST ? "var(--accent)" : pal.border}`,
      borderRadius: 0,
      boxShadow:
        p.name === PROTAGONIST
          ? theme === "dark"
            ? "0 0 12px rgba(57,255,136,0.35)"
            : "0 0 10px rgba(15,107,58,0.15)"
          : undefined,
    },
  }));

  const edges: Edge[] = relations.map((r, i) => ({
    id: `${r.from}->${r.to}:${i}`,
    source: r.from,
    target: r.to,
    label: shorten(r.label, 8),
    labelStyle: { fill: pal.labelFill, fontSize: 10, fontFamily: "var(--font-mono)" },
    labelBgStyle: { fill: pal.labelBg },
    labelBgPadding: [3, 2] as [number, number],
    labelBgBorderRadius: 0,
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
    return (
      <div className="text-[14px] text-[var(--ink-tertiary)]">
        暂无关系数据（0-角色档案/关系图谱.md）
      </div>
    );
  }

  return (
    <div className="h-[560px] w-full overflow-hidden rounded-none border border-[var(--hairline)] bg-[var(--canvas)]">
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
