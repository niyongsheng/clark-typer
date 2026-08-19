import { useQuery } from "@tanstack/react-query";
import { Markdown } from "../components/Markdown";
import { fetchContent } from "../lib/api";

export function World() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const worldRaw = content?.worldRaw ?? "";

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>世界观</h2>
      </div>
      <div className="page-body">
        <div className="mx-auto max-w-3xl">
          {worldRaw ? <Markdown>{worldRaw}</Markdown> : (
            <div className="text-[13px] text-[var(--ink-tertiary)]">暂无世界观设定（2-世界观设定/世界观.md）</div>
          )}
        </div>
      </div>
    </div>
  );
}