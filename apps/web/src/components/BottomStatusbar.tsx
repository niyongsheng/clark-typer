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
    <div className="flex h-7 shrink-0 items-center gap-4 overflow-hidden border-t border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 font-mono text-[12px] text-[var(--ink-tertiary)]">
      <span className="hidden min-w-0 items-center gap-1 sm:inline-flex">
        <BookOpen className="h-3 w-3 shrink-0" />
        <span className="truncate">{content?.book.title || "clark-typer"}</span>
      </span>
      <span className="shrink-0 whitespace-nowrap">
        {t("statusbar.position", {
          vol: progress?.currentVolume ?? 1,
          unit: progress?.currentUnit ?? 1,
        })}
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-[var(--ink-tertiary)] sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--accent)] shadow-[0_0_6px_var(--crt-glow-soft)]" />
        {t("statusbar.status")}: [{progress?.workflowStep ?? "init"}]
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-4">
        <span className="hidden whitespace-nowrap sm:inline">
          {t("statusbar.chapters", { n: content?.chapters.length ?? 0 })}
        </span>
        <span className="whitespace-nowrap">
          {t("statusbar.words", { n: totalWords.toLocaleString() })}
        </span>
      </div>
    </div>
  );
}
