export function EmptyState({ title, description }: { title: string; description?: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <svg
                width="140"
                height="120"
                viewBox="0 0 140 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <rect
                    x="24"
                    y="36"
                    width="92"
                    height="68"
                    rx="8"
                    fill="var(--canvas-elevated)"
                    stroke="var(--hairline)"
                    strokeWidth="2"
                />
                <path d="M24 56h92" stroke="var(--hairline)" strokeWidth="2" />
                <path d="M56 36v20M84 36v20" stroke="var(--hairline)" strokeWidth="2" />
                <path
                    d="M46 88h48"
                    stroke="var(--accent-gold)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 7"
                    opacity="0.6"
                />
                <circle cx="42" cy="78" r="3" fill="var(--accent-gold)" opacity="0.5" />
                <circle cx="98" cy="78" r="3" fill="var(--accent-gold)" opacity="0.5" />
            </svg>
            <div className="space-y-1">
                <p className="text-[15px] font-medium text-[var(--ink-secondary)]">{title}</p>
                {description ? (
                    <p className="mx-auto max-w-sm text-[13px] leading-6 text-[var(--ink-mute)]">{description}</p>
                ) : null}
            </div>
        </div>
    );
}