import { useQuery } from "@tanstack/react-query";
import { PanelLeft, Settings } from "lucide-react";
import { Link } from "react-router";
import { fetchContent } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useSidebarStore } from "../stores/useSidebarStore";

export function Titlebar() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const { t } = useI18n();

  return (
    <div className="flex h-[var(--titlebar-h)] shrink-0 select-none items-center gap-3 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-4">
      <span className="ml-1 cursor-pointer font-display text-[13px] uppercase tracking-[0.04em] text-[var(--ink-tertiary)]">
        clark-typer
      </span>
      <span className="h-[18px] w-px bg-[var(--hairline)]" />
      <span className="text-[13px] text-[var(--ink-secondary)]">
        {content?.book.title || t("titlebar.fallback")}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className="tool-btn"
          title={t("titlebar.collapse")}
          onClick={toggleCollapsed}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <Link to="/settings" className="tool-btn" title={t("titlebar.settings")}>
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}