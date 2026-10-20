export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      {/* Warp 式终端窗口：品牌唯一的装饰系统 */}
      <div className="w-[280px] overflow-hidden rounded-none border border-[var(--hairline)] bg-[var(--canvas-card)] text-left shadow-[0_0_24px_var(--crt-glow-soft)]">
        <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-3 py-2 font-mono text-[10px] text-[var(--ink-mute)]">
          <span>[-]</span>
          <span>[o]</span>
          <span>[x]</span>
          <span className="ml-1">clark-typer</span>
        </div>
        <div className="px-4 py-5 font-mono text-[12px] leading-6">
          <div className="text-[var(--ink-tertiary)]">
            <span className="text-[var(--accent-text)]">$</span> status
          </div>
          <div className="text-[var(--ink-mute)]">no content yet</div>
          <span className="terminal-cursor mt-2" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[16px] font-medium text-[var(--ink-secondary)]">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-[14px] leading-6 text-[var(--ink-mute)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
