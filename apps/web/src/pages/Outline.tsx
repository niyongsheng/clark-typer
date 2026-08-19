import { useQuery } from "@tanstack/react-query";
import { Markdown } from "../components/Markdown";
import { fetchContent } from "../lib/api";

export function Outline() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const volumes = content?.volumes ?? [];
  const chapterOutlines = content?.chapterOutlines ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>大纲</h2>
      </div>
      <div className="page-body space-y-10">
        <section>
          <div className="dash-card-title">分卷大纲</div>
          <div className="space-y-4">
            {volumes.map((v) => (
              <div
                key={v.no}
                className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-5"
              >
                <h3 className="mb-3 font-display text-lg text-[var(--ink)]">{v.title}</h3>
                <Markdown>{v.raw}</Markdown>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="dash-card-title">分章大纲</div>
          <div className="space-y-4">
            {chapterOutlines.map((o) => (
              <div
                key={o.no}
                className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-5"
              >
                <h3 className="mb-3 font-display text-lg text-[var(--ink)]">
                  第{o.no}章 {o.title}
                </h3>
                <Markdown>{o.raw}</Markdown>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}