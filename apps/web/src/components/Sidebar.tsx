import type { ChapterStatus } from "@clark-typer/content";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Download,
  FlaskConical,
  FolderTree,
  Globe,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  PenSquare,
  ScrollText,
  Users,
} from "lucide-react";
import { type CSSProperties, type MouseEvent as ReactMouseEvent, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { fetchContent } from "../lib/api";
import { type MessageKey, useI18n } from "../lib/i18n";
import { useIsMobile } from "../lib/useIsMobile";
import { STATUS_COLOR, STATUS_LABEL } from "../lib/viz";
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

function StatusBadge({ status }: { status: ChapterStatus }) {
  return (
    <span
      className="status-tag"
      style={{ "--status-color": STATUS_COLOR[status] } as CSSProperties}
    >
      [{STATUS_LABEL[status]}]
    </span>
  );
}

const ACTIVE_CLASS =
  "bg-[var(--accent-soft-bg)] text-[var(--accent-text)] shadow-[inset_2px_0_0_var(--accent)]";
const IDLE_CLASS =
  "text-[var(--ink-secondary)] hover:bg-[var(--canvas-pop)] hover:text-[var(--ink)]";

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const width = useSidebarStore((s) => s.width);
  const setWidth = useSidebarStore((s) => s.setWidth);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data: content } = useQuery({ queryKey: ["content"], queryFn: fetchContent });
  const { t } = useI18n();
  const [collapsedVols, setCollapsedVols] = useState<Set<number>>(new Set());
  const isMobile = useIsMobile();

  // 桌面端折叠时直接不渲染；移动端始终挂载以支持抽屉滑入/滑出过渡动画。
  if (collapsed && !isMobile) return null;

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
  const activeChapter = chapterParam ? Number(chapterParam) : Number.NaN;

  // 移动端点击导航后自动收起抽屉。
  const closeOnNavigate = () => {
    if (isMobile && !collapsed) toggleCollapsed();
  };

  const menu = (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
      {/* 卷章树 */}
      <div className="py-3">
        <div className="flex items-center gap-1.5 px-4 pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="text-[var(--accent)]">{"//"}</span>
          {t("nav.group.manuscript")}
        </div>
        {volumes.length === 0 ? (
          <div className="px-5 py-1 text-[14px] text-[var(--ink-mute)]">{t("nav.emptyVolume")}</div>
        ) : (
          volumes.map((vol) => (
            <div key={vol.no}>
              <button
                type="button"
                aria-expanded={!collapsedVols.has(vol.no)}
                className="mx-2 flex w-[calc(100%-1rem)] cursor-pointer select-none items-center gap-1.5 rounded-none px-2.5 py-2 text-left text-[14px] font-medium text-[var(--ink)] hover:bg-[var(--canvas-pop)]"
                onClick={() => toggleVolume(vol.no)}
              >
                <span
                  className={`text-[10px] text-[var(--ink-mute)] transition-transform duration-200 ${collapsedVols.has(vol.no) ? "-rotate-90" : ""}`}
                >
                  ▼
                </span>
                <span className="flex-1 truncate">{vol.title || `第${vol.no}卷`}</span>
              </button>
              {!collapsedVols.has(vol.no) &&
                chapters
                  .filter((c) => c.volume === vol.no)
                  .map((ch) => {
                    const active = location.pathname === "/writing" && activeChapter === ch.no;
                    return (
                      <Link
                        key={ch.no}
                        to={`/writing?chapter=${ch.no}`}
                        onClick={closeOnNavigate}
                        className={`mx-2 flex items-center gap-1.5 rounded-none py-1.5 pl-4 pr-2.5 text-[14px] ${active ? ACTIVE_CLASS : IDLE_CLASS}`}
                      >
                        <span className="flex-1 truncate">
                          {ch.title ? `第${ch.no}章 ${ch.title}` : `第${ch.no}章`}
                        </span>
                        <StatusBadge status={ch.status} />
                      </Link>
                    );
                  })}
            </div>
          ))
        )}
      </div>

      <div className="mx-3 h-px bg-[var(--hairline)]" />

      {/* 创作导航 */}
      <div className="py-3">
        <div className="px-4 pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          <span className="text-[var(--accent)]">{"//"}</span> {t("nav.group.create")}
        </div>
        {NAV_ITEMS.map((item) => {
          const active =
            (item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)) &&
            !(item.path === "/writing" && chapterParam !== null);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeOnNavigate}
              className={`mx-2 flex items-center gap-2 rounded-none px-2.5 py-2 text-[14px] ${active ? ACTIVE_CLASS : IDLE_CLASS}`}
            >
              <span className="w-2.5 shrink-0 font-mono text-[11px] leading-none text-[var(--accent-text)]">
                {active ? ">" : ""}
              </span>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* 遮罩层 */}
        <button
          type="button"
          aria-label="关闭侧栏"
          aria-hidden={collapsed}
          tabIndex={-1}
          className={`fixed inset-x-0 bottom-0 top-[var(--titlebar-h)] z-30 border-0 bg-[var(--overlay-bg)] p-0 transition-opacity duration-200 ${collapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}
          onClick={toggleCollapsed}
        />
        {/* 浮动抽屉 */}
        <aside
          className={`fixed bottom-0 left-0 top-[var(--titlebar-h)] z-40 flex w-[260px] flex-col border-r border-[var(--hairline)] bg-[var(--canvas-soft)] shadow-[0_0_40px_rgba(0,0,0,0.55)] transition-transform duration-200 ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
        >
          {menu}
        </aside>
      </>
    );
  }

  return (
    <aside
      className="relative flex shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--canvas-soft)]"
      style={{ width }}
    >
      {menu}

      {/* 拖拽调整宽度 */}
      <div
        className="absolute right-0 top-0 z-10 h-full w-[5px] cursor-col-resize transition-colors hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/70"
        onMouseDown={startResize}
      />
    </aside>
  );
}
