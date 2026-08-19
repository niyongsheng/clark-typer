import { useSettingsStore, type Locale } from "../stores/useSettingsStore";

const messages = {
  zh: {
    "nav.dashboard": "数据看板",
    "nav.science": "科学设定",
    "nav.world": "世界观",
    "nav.characters": "角色",
    "nav.relations": "关系",
    "nav.outline": "大纲",
    "nav.writing": "正文",
    "nav.files": "文件",
    "nav.export": "导出",
    "nav.group.create": "创作",
    "nav.group.manuscript": "正文",
    "nav.emptyVolume": "暂无分卷",
    "titlebar.collapse": "折叠侧栏",
    "titlebar.settings": "设置",
    "titlebar.fallback": "克拉克打字机",
    "statusbar.status": "状态",
    "statusbar.chapters": "{n} 章",
    "statusbar.words": "约 {n} 字",
    "statusbar.position": "第{vol}卷 · 第{unit}单元",
    "settings.title": "设置",
    "settings.language": "语言",
    "settings.theme": "主题",
    "settings.theme.light": "亮色",
    "settings.theme.dark": "暗色",
    "settings.about": "关于",
    "settings.donate": "打赏支持",
    "settings.donate.desc": "如果这个工具对你有帮助，欢迎请我喝杯咖啡。",
    "settings.openSource": "开源地址",
    "settings.openSource.desc": "项目完全开源，欢迎 Star 与贡献。",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.science": "Science",
    "nav.world": "World",
    "nav.characters": "Characters",
    "nav.relations": "Relations",
    "nav.outline": "Outline",
    "nav.writing": "Manuscript",
    "nav.files": "Files",
    "nav.export": "Export",
    "nav.group.create": "Create",
    "nav.group.manuscript": "Manuscript",
    "nav.emptyVolume": "No volumes yet",
    "titlebar.collapse": "Toggle sidebar",
    "titlebar.settings": "Settings",
    "titlebar.fallback": "Writing Studio",
    "statusbar.status": "Status",
    "statusbar.chapters": "{n} chapters",
    "statusbar.words": "~{n} words",
    "statusbar.position": "Vol. {vol} · Unit {unit}",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.about": "About",
    "settings.donate": "Sponsor",
    "settings.donate.desc": "If this tool helps you, consider buying me a coffee.",
    "settings.openSource": "Open Source",
    "settings.openSource.desc": "Fully open source. Stars and contributions welcome.",
  },
} as const;

export type MessageKey = keyof (typeof messages)["zh"];

function interpolate(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function useI18n() {
  const locale = useSettingsStore((s) => s.locale) as Locale;
  const t = (key: MessageKey, vars?: Record<string, string | number>) =>
    interpolate(messages[locale][key] ?? key, vars);
  return { t, locale };
}