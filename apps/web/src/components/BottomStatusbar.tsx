import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { fetchContent } from "../lib/api";
import { useI18n } from "../lib/i18n";

export function BottomStatusbar() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const { t } = useI18n();
  const progress = content?.progress;
  const totalWords = content?.chapters.reduce((n, c) => n + c.content.length, 0) ?? 0;

  return (
    <div className="flex h-7 shrink-0 items-center gap-4 border-t border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 font-mono text-[11px] text-[var(--ink-mute)]">
      <span className="inline-flex items-center gap-1">
        <BookOpen className="h-3 w-3" />
        {content?.book.title || "clark-typer"}
      </span>
      <span>
        {t("statusbar.position", {
          vol: progress?.currentVolume ?? 1,
          unit: progress?.currentUnit ?? 1,
        })}
      </span>
      <span className="rounded-full border border-[var(--hairline)] bg-[var(--canvas-card)] px-[7px] py-[1px] text-[10px] text-[var(--ink-tertiary)]">
        {t("statusbar.status")}: {progress?.workflowStep ?? "init"}
      </span>
      <div className="ml-auto flex items-center gap-4">
        <span>{t("statusbar.chapters", { n: content?.chapters.length ?? 0 })}</span>
        <span>{t("statusbar.words", { n: totalWords.toLocaleString() })}</span>
      </div>
    </div>
  );
}