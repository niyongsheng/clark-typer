import type { FileNode } from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Folder } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { fetchFiles } from "../lib/api";

function TreeItem({ node, depth }: { node: FileNode; depth: number }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(depth === 0 && node.type === "dir");

  if (node.type === "dir") {
    return (
      <div>
        <button
          type="button"
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[13px] text-[var(--ink-secondary)] hover:bg-[var(--canvas-mid)]"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
          <Folder className="h-3.5 w-3.5 shrink-0 text-[var(--accent-gold)]" />
          <span className="truncate">{node.name}</span>
        </button>
        {open &&
          node.children?.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[13px] text-[var(--ink-tertiary)] hover:bg-[var(--canvas-mid)] hover:text-[var(--ink)]"
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      onClick={() => navigate(`/file?path=${encodeURIComponent(node.path)}`)}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--ink-mute)]" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree() {
  const { data, isError, isLoading } = useQuery({ queryKey: ["files"], queryFn: fetchFiles });

  if (isLoading) {
    return <div className="p-3 text-[13px] text-[var(--ink-tertiary)]">加载目录…</div>;
  }
  if (isError) {
    return <div className="p-3 text-[13px] text-[var(--error)]">目录加载失败（仅开发模式可用）</div>;
  }

  return <div className="p-1">{data?.map((node) => <TreeItem key={node.path} node={node} depth={0} />)}</div>;
}