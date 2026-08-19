import { useQuery } from "@tanstack/react-query";
import { CharacterGraph } from "../components/CharacterGraph";
import { Markdown } from "../components/Markdown";
import { fetchContent } from "../lib/api";

export function Relations() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const relationsRaw = content?.relationsRaw ?? "";

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>关系</h2>
      </div>
      <div className="page-body space-y-6">
        <CharacterGraph content={content} />
        <section>
          <div className="dash-card-title">关系矩阵</div>
          <div className="max-w-4xl">{relationsRaw ? <Markdown>{relationsRaw}</Markdown> : null}</div>
        </section>
      </div>
    </div>
  );
}