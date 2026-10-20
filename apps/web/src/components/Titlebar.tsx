import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelLeft, RefreshCw, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { fetchContent } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useSidebarStore } from "../stores/useSidebarStore";

export function Titlebar() {
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useI18n();

  useEffect(
    () => () => {
      if (spinTimer.current) clearTimeout(spinTimer.current);
    },
    [],
  );

  const handleRefresh = () => {
    void queryClient.invalidateQueries();
    setSpinning(true);
    if (spinTimer.current) clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => setSpinning(false), 600);
  };

  return (
    <div className="flex h-[var(--titlebar-h)] shrink-0 select-none items-center gap-3 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 sm:px-5">
      <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
        <span className="h-2 w-2 rounded-none bg-[var(--accent)] shadow-[0_0_8px_var(--crt-glow)]" />
        <span className="terminal-wordmark cursor-pointer">
          <span className="text-[var(--accent)]">&gt;</span> clark-typer
        </span>
        <span className="terminal-cursor" aria-hidden="true" />
      </span>
      <span className="hidden h-[18px] w-px bg-[var(--hairline)] sm:block" />
      <span className="hidden min-w-0 truncate text-[14px] text-[var(--ink-secondary)] sm:inline">
        {content?.book.title || t("titlebar.fallback")}
      </span>
      <button
        type="button"
        className="tool-btn"
        title={t("titlebar.refresh")}
        onClick={handleRefresh}
      >
        <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
      </button>

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
