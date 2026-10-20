import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import type { CSSProperties } from "react";
import { Link, useSearchParams } from "react-router";
import { fetchContent } from "../lib/api";
import { STATUS_COLOR, STATUS_LABEL } from "../lib/viz";

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
            className="form-select"
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
            <Link
              to={`/file?path=${encodeURIComponent(`7-正文/第${chapter.no}章.txt`)}`}
              className="btn-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
              编辑源文件
            </Link>
          )}
        </div>
      </div>
      <div className="page-body">
        {chapter ? (
          <article className="mx-auto max-w-[var(--editor-max-w)] border-x border-[var(--hairline)] px-6 py-10 sm:px-10">
            <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-[var(--ink-mute)]">
              <span>第{chapter.no}章</span>
              <span
                className="status-tag"
                style={{ "--status-color": STATUS_COLOR[chapter.status] } as CSSProperties}
              >
                [{STATUS_LABEL[chapter.status]}]
              </span>
              <span>{chapter.content.length.toLocaleString()} 字</span>
            </div>
            <h3 className="mb-6 font-editor text-[28px] font-semibold leading-10 tracking-[-0.01em] text-[var(--ink)]">
              第{chapter.no}章 {chapter.title}
            </h3>
            <div className="whitespace-pre-wrap font-editor text-[17px] leading-[1.9] text-[var(--ink)]">
              {chapter.content}
            </div>
          </article>
        ) : (
          <div className="text-[14px] text-[var(--ink-tertiary)]">暂无正文（7-正文/*.txt）</div>
        )}
      </div>
    </div>
  );
}
