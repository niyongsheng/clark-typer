import type { LucideIcon } from "lucide-react";

export function PagePlaceholder({
  title,
  icon: Icon,
  description,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>{title}</h2>
      </div>
      <div className="page-body flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Icon className="h-8 w-8 text-[var(--ink-tertiary)]" />
          <div className="text-[13px] text-[var(--ink-tertiary)]">{description}</div>
        </div>
      </div>
    </div>
  );
}