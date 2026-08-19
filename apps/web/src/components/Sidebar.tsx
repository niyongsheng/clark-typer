import type { ChapterStatus } from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  Download,
  FlaskConical,
  FolderTree,
  Globe,
  LayoutDashboard,
  Link2,
  PenSquare,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { fetchContent } from "../lib/api";
import { useI18n, type MessageKey } from "../lib/i18n";
import { useSidebarStore } from "../stores/useSidebarStore";

interface NavItem {
  path: string;
  label: MessageKey;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "nav.dashboard", icon: LayoutDashboard },
  { path: "/science", label: "nav.science", icon: FlaskConical },
  { path: "/world", label: "nav.world", icon: Globe },
  { path: "/characters", label: "nav.characters", icon: Users },
  { path: "/relations", label: "nav.relations", icon: Link2 },
  { path: "/outline", label: "nav.outline", icon: ScrollText },
  { path: "/writing", label: "nav.writing", icon: PenSquare },
  { path: "/files", label: "nav.files", icon: FolderTree },
  { path: "/export", label: "nav.export", icon: Download },
];

const STATUS_MAP: Record<ChapterStatus, { label: string; bg: string; text: string; done?: boolean }> = {
  pending: { label: "待写", bg: "var(--pending-soft)", text: "var(--pending)" },
  written: { label: "已写", bg: "var(--info-soft)", text: "var(--info)" },
  reviewed: { label: "已审", bg: "var(--warning-soft)", text: "var(--warning)" },
  edited: { label: "已润色", bg: "var(--success-soft)", text: "var(--success)", done: true },
};

function StatusBadge({ status }: { status: ChapterStatus }) {
  const c = STATUS_MAP[status];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-[7px] py-[1px] font-sans text-[10px] font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {c.done && <Check className="h-2.5 w-2.5" />}
      {c.label}
    </span>
  );
}

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const width = useSidebarStore((s) => s.width);
  const setWidth = useSidebarStore((s) => s.setWidth);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const { t } = useI18n();
  const [collapsedVols, setCollapsedVols] = useState<Set<number>>(new Set());

  if (collapsed) return null;

  const startResize = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const onMove = (ev: MouseEvent) => setWidth(startWidth + (ev.clientX - startX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleVolume = (no: number) => {
    setCollapsedVols((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
  };

  const volumes = content?.volumes ?? [];
  const chapters = content?.chapters ?? [];
  const chapterParam = searchParams.get("chapter");
  const activeChapter = chapterParam ? Number(chapterParam) : NaN;

  return (
    <aside
      className="relative flex shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--canvas-soft)]"
      style={{ width }}
    >
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {/* 卷章树 */}
        <div className="py-3">
          <div className="flex items-center gap-1.5 px-4 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-mute)]">
            <BookOpen className="h-3.5 w-3.5" />
            {t("nav.group.manuscript")}
          </div>
          {volumes.length === 0 ? (
            <div className="px-5 py-1 text-[13px] text-[var(--ink-mute)]">{t("nav.emptyVolume")}</div>
          ) : (
            volumes.map((vol) => (
              <div key={vol.no}>
                <div
                  className="flex cursor-pointer select-none items-center gap-1.5 px-3 py-1.5 font-display text-[15px] font-medium text-[var(--ink)]"
                  onClick={() => toggleVolume(vol.no)}
                >
                  <span
                    className={`text-[10px] text-[var(--ink-mute)] transition-transform duration-200 ${collapsedVols.has(vol.no) ? "-rotate-90" : ""}`}
                  >
                    ▼
                  </span>
                  <span className="flex-1">{vol.title || `第${vol.no}卷`}</span>
                </div>
                {!collapsedVols.has(vol.no) &&
                  chapters
                    .filter((c) => c.volume === vol.no)
                    .map((ch) => (
                      <Link
                        key={ch.no}
                        to={`/writing?chapter=${ch.no}`}
                        className={`flex items-center gap-1.5 py-1 pl-5 pr-4 text-[13px] ${location.pathname === "/writing" && activeChapter === ch.no
                          ? "bg-[var(--accent-gold-soft-bg)] text-[var(--accent-gold)]"
                          : "text-[var(--ink-secondary)] hover:bg-[var(--canvas-card)]"
                          }`}
                      >
                        <span className="flex-1 truncate">{ch.title ? `第${ch.no}章 ${ch.title}` : `第${ch.no}章`}</span>
                        <StatusBadge status={ch.status} />
                      </Link>
                    ))}
              </div>
            ))
          )}
        </div>

        <div className="mx-3 h-px bg-[var(--hairline)]" />

        {/* 创作导航 */}
        <div className="py-3">
          <div className="px-4 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-mute)]">
            {t("nav.group.create")}
          </div>
          {NAV_ITEMS.map((item) => {
            const active =
              (item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)) &&
              !(item.path === "/writing" && chapterParam !== null);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-1 text-[13px] ${active
                  ? "bg-[var(--accent-gold-soft-bg)] text-[var(--accent-gold)]"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--canvas-mid)] hover:text-[var(--ink)]"
                  }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{t(item.label)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 拖拽调整宽度 */}
      <div
        className="absolute right-0 top-0 z-10 h-full w-[5px] cursor-col-resize transition-colors hover:bg-[var(--accent-gold)]/50 active:bg-[var(--accent-gold)]/80"
        onMouseDown={startResize}
      />
    </aside>
  );
}