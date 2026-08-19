import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Markdown } from "../components/Markdown";
import { fetchFile, saveFile } from "../lib/api";

export function FileEditPage() {
  const [params] = useSearchParams();
  const path = params.get("path") ?? "";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["file", path],
    queryFn: () => fetchFile(path),
    enabled: path.length > 0,
  });

  if (isLoading) {
    return <div className="p-6 text-[var(--ink-tertiary)]">加载中…</div>;
  }
  if (isError || !data) {
    return <div className="p-6 text-[var(--ink-tertiary)]">未找到文件：{path}</div>;
  }

  return <FileEditor key={path} path={data.path} initialContent={data.content} />;
}

function FileEditor({ path, initialContent }: { path: string; initialContent: string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => saveFile(path, content),
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["file", path] });
    },
  });

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(timer);
  }, [saved]);

  const isMarkdown = path.endsWith(".md");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-2.5">
        <div className="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--ink-tertiary)]">{path}</div>
        <div className="flex shrink-0 items-center gap-2">
          {isMarkdown && (
            <div className="flex overflow-hidden rounded-md border border-[var(--hairline)] text-[13px]">
              <button
                type="button"
                className={mode === "edit" ? "bg-[var(--canvas-elevated)] px-3 py-1.5 text-[var(--ink)]" : "px-3 py-1.5 text-[var(--ink-tertiary)]"}
                onClick={() => setMode("edit")}
              >
                编辑
              </button>
              <button
                type="button"
                className={mode === "preview" ? "bg-[var(--canvas-elevated)] px-3 py-1.5 text-[var(--ink)]" : "px-3 py-1.5 text-[var(--ink-tertiary)]"}
                onClick={() => setMode("preview")}
              >
                预览
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn-primary h-8 px-4 text-[13px]"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            <Save className="h-3.5 w-3.5" />
            {save.isPending ? "保存中…" : saved ? "已保存" : "保存"}
          </button>
          {save.isError && <span className="text-[12px] text-[var(--error)]">保存失败</span>}
        </div>
      </div>
      {mode === "edit" || !isMarkdown ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none bg-[var(--canvas)] p-4 font-mono text-[13px] leading-6 text-[var(--ink)] outline-none"
          spellCheck={false}
        />
      ) : (
        <div className="page-body">
          <div className="mx-auto max-w-3xl">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}