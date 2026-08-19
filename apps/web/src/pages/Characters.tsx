import { useQuery } from "@tanstack/react-query";
import { Markdown } from "../components/Markdown";
import { fetchContent } from "../lib/api";

export function Characters() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const characters = content?.characters ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>角色</h2>
        <div className="page-header-actions">
          <span className="text-[13px] text-[var(--ink-tertiary)]">{characters.length} 人</span>
        </div>
      </div>
      <div className="page-body">
        {characters.length === 0 ? (
          <div className="text-[13px] text-[var(--ink-tertiary)]">暂无人物档案（0-角色档案/核心人物.md）</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {characters.map((c) => (
              <div
                key={c.name}
                className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-5"
              >
                <h3 className="mb-3 font-display text-lg text-[var(--ink)]">{c.name}</h3>
                <Markdown>{c.raw}</Markdown>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}