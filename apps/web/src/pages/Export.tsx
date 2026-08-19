import type { FileNode } from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import { Download, File as FileIcon, FileText } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Markdown } from "../components/Markdown";
import { fetchFile, fetchReleases } from "../lib/api";

const TEXT_RE = /\.(txt|md)$/i;

function isText(name: string): boolean {
  return TEXT_RE.test(name);
}

export function Export() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["releases"], queryFn: fetchReleases });
  const [selected, setSelected] = useState<FileNode | null>(null);

  const files = (data ?? []).filter((n) => n.type === "file");
  const previewable = selected?.type === "file" && isText(selected.name);

  const { data: preview, isFetching } = useQuery({
    queryKey: ["release-file", selected?.path],
    queryFn: () => fetchFile(selected!.path),
    enabled: !!previewable,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>导出</h2>
      </div>

      {isLoading ? (
        <div className="p-6 text-[var(--ink-tertiary)]">加载中…</div>
      ) : isError ? (
        <div className="p-6 text-[var(--error)]">打包文件加载失败（仅开发模式可用）</div>
      ) : files.length === 0 ? (
        <EmptyState
          title="暂无打包文件"
          description="当前 打包发布/ 目录为空。完成导出后，成品文件会出现在这里，点击即可预览。"
        />
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--hairline)]">
            <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
              {files.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setSelected(f)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] ${selected?.path === f.path
                    ? "bg-[var(--accent-gold-soft-bg)] text-[var(--accent-gold)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--canvas-mid)]"
                    }`}
                >
                  {isText(f.name) ? (
                    <FileText className="h-4 w-4 shrink-0" />
                  ) : (
                    <FileIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--ink-mute)]">
                选择左侧文件进行预览
              </div>
            ) : !previewable ? (
              <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--ink-mute)]">
                二进制文件暂不支持在线预览
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-4 py-2 font-mono text-[12px] text-[var(--ink-tertiary)]">
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{selected.path}</span>
                  {isFetching && <span className="text-[var(--ink-mute)]">加载中…</span>}
                </div>
                <div className="page-body min-h-0">
                  <div className="mx-auto max-w-3xl">
                    {selected.name.endsWith(".md") ? (
                      <Markdown>{preview?.content ?? ""}</Markdown>
                    ) : (
                      <pre className="whitespace-pre-wrap font-editor text-[15px] leading-7 text-[var(--ink)]">
                        {preview?.content ?? ""}
                      </pre>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}