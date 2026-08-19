import type { ReactNode } from "react";
import { ExternalLink, Github, Heart, Languages, Moon, Sun } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useSettingsStore } from "../stores/useSettingsStore";

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors ${active
              ? "bg-[var(--canvas-elevated)] text-[var(--ink)]"
              : "text-[var(--ink-mute)] hover:text-[var(--ink)]"
              }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function LinkCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4 transition-colors hover:bg-[var(--canvas-elevated)]"
    >
      <span className="mt-0.5 shrink-0" style={{ color: "var(--accent-gold)" }}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink)]">
          {title}
          <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-mute)]" />
        </span>
        <span className="mt-0.5 block text-[12px] text-[var(--ink-tertiary)]">{desc}</span>
      </span>
    </a>
  );
}

export function Settings() {
  const { t } = useI18n();
  const theme = useSettingsStore((s) => s.theme);
  const locale = useSettingsStore((s) => s.locale);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>{t("settings.title")}</h2>
      </div>
      <div className="page-body max-w-2xl space-y-6">
        {/* 语言 */}
        <section>
          <div className="dash-card-title">{t("settings.language")}</div>
          <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
            <Segmented
              value={locale}
              onChange={setLocale}
              options={[
                { value: "zh", label: "中文", icon: <Languages className="h-4 w-4" /> },
                { value: "en", label: "English", icon: <Languages className="h-4 w-4" /> },
              ]}
            />
          </div>
        </section>

        {/* 主题 */}
        <section>
          <div className="dash-card-title">{t("settings.theme")}</div>
          <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-card)] p-4">
            <Segmented
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: t("settings.theme.light"), icon: <Sun className="h-4 w-4" /> },
                { value: "dark", label: t("settings.theme.dark"), icon: <Moon className="h-4 w-4" /> },
              ]}
            />
          </div>
        </section>

        {/* 关于 */}
        <section>
          <div className="dash-card-title">{t("settings.about")}</div>
          <div className="flex flex-col gap-3">
            <LinkCard
              href="https://ifdian.net/a/nico2026"
              icon={<Heart className="h-5 w-5" />}
              title={t("settings.donate")}
              desc={t("settings.donate.desc")}
            />
            <LinkCard
              href="https://github.com/niyongsheng/clark-typer"
              icon={<Github className="h-5 w-5" />}
              title={t("settings.openSource")}
              desc={t("settings.openSource.desc")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}