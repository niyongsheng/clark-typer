import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { fetchContent } from "../lib/api";

export function Writing() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const [params, setParams] = useSearchParams();
  const chapters = content?.chapters ?? [];
  const no = Number(params.get("chapter")) || chapters[0]?.no || 0;
  const chapter = chapters.find((c) => c.no === no);

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>正文</h2>
        <div className="page-header-actions">
          <select
            className="h-8 rounded-md border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-2 text-[13px] text-[var(--ink)] outline-none"
            value={no}
            onChange={(e) => setParams({ chapter: e.target.value })}
          >
            {chapters.map((c) => (
              <option key={c.no} value={c.no}>
                第{c.no}章 {c.title}
              </option>
            ))}
          </select>
          {chapter && (
            <Link to={`/file?path=${encodeURIComponent(`7-正文/第${chapter.no}章.txt`)}`} className="btn-secondary h-8 px-3 text-[13px]">
              <Pencil className="h-3.5 w-3.5" />
              编辑源文件
            </Link>
          )}
        </div>
      </div>
      <div className="page-body">
        {chapter ? (
          <div className="mx-auto max-w-[var(--editor-max-w)]">
            <h3 className="mb-6 font-display text-2xl text-[var(--ink)]">
              第{chapter.no}章 {chapter.title}
            </h3>
            <div className="whitespace-pre-wrap font-editor text-[17px] leading-relaxed text-[var(--ink)]">
              {chapter.content}
            </div>
          </div>
        ) : (
          <div className="text-[13px] text-[var(--ink-tertiary)]">暂无正文（7-正文/*.txt）</div>
        )}
      </div>
    </div>
  );
}