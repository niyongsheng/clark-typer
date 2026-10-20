import type { CSSProperties, ReactNode } from "react";
import { type AsciiSegmentInput, allocateSegments, countFilledCells } from "../lib/ascii";

export type AsciiSegment = AsciiSegmentInput;

interface BaseProps {
  label: string;
  cells?: number;
  size?: "sm" | "md";
  readout?: ReactNode;
  className?: string;
  ariaValueText?: string;
  /** 是否在最后一个已填充格上显示闪烁光标 */
  cursor?: boolean;
}

interface StackedProps extends BaseProps {
  segments: AsciiSegment[];
  total?: number;
  /** aria-valuenow；默认取各段之和 */
  progress?: number;
}

interface ValueProps extends BaseProps {
  value: number;
  max: number;
  color?: string;
}

export type AsciiBarProps = StackedProps | ValueProps;

interface CellView {
  id: string;
  segment: AsciiSegment | null;
  title: string;
}

const clampPercent = (value: number, max: number) =>
  max > 0 ? Math.round((Math.max(0, value) / max) * 100) : 0;

function buildStackedCells(props: StackedProps, cellCount: number): CellView[] {
  let runIndex = 0;
  return allocateSegments(props.segments, cellCount, props.total).map((cell) => {
    if (cell.firstOfSegment) runIndex = 0;
    return {
      id: `${cell.segmentIndex}-${runIndex++}`,
      segment: cell.segment,
      title: cell.segment
        ? `${cell.segment.label} · ${cell.segment.value}（${Math.round(cell.pct)}%）`
        : "空位",
    };
  });
}

function buildValueCells(props: ValueProps, cellCount: number): CellView[] {
  const filled = countFilledCells(props.value, props.max, cellCount);
  return Array.from({ length: cellCount }, (_, index) =>
    index < filled
      ? {
          id: `filled-${index}`,
          segment: {
            value: props.value,
            color: props.color ?? "var(--accent)",
            label: props.label,
          },
          title: `${props.label} · ${props.value}/${props.max}`,
        }
      : { id: `empty-${index}`, segment: null, title: "空位" },
  );
}

function findCursorIndex(cells: CellView[]): number {
  for (let i = cells.length - 1; i >= 0; i -= 1) {
    if (cells[i].segment && !cells[i].segment?.hatch) return i;
  }
  for (let i = cells.length - 1; i >= 0; i -= 1) {
    if (cells[i].segment) return i;
  }
  return -1;
}

export function AsciiBar(props: AsciiBarProps) {
  const { label, size = "md", className, readout, ariaValueText, cursor } = props;
  const cellCount = props.cells ?? (size === "sm" ? 16 : 28);
  const stacked = "segments" in props;

  let cells: CellView[];
  let ariaMax: number;
  let ariaNow: number;
  let valueText: string;

  if (stacked) {
    const sum = props.segments.reduce((n, segment) => n + Math.max(0, segment.value), 0);
    const denom = Math.max(sum, props.total ?? 0);
    cells = buildStackedCells(props, cellCount);
    ariaMax = denom > 0 ? denom : 1;
    ariaNow = props.progress ?? sum;
    valueText =
      ariaValueText ??
      (denom > 0
        ? props.segments.map((segment) => `${segment.label} ${segment.value}`).join("，")
        : "暂无数据");
  } else {
    cells = buildValueCells(props, cellCount);
    ariaMax = props.max > 0 ? props.max : 1;
    ariaNow = props.value;
    valueText =
      ariaValueText ??
      `${props.label} ${props.value} / ${props.max}（${clampPercent(props.value, props.max)}%）`;
  }

  const cursorIndex = cursor ? findCursorIndex(cells) : -1;
  const rootClass = ["ascii-bar", size === "sm" ? "ascii-bar--sm" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: progressbar 是只读展示，不应进入 Tab 序列
    <div
      className={rootClass}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={ariaMax}
      aria-valuenow={Math.max(0, Math.min(ariaNow, ariaMax))}
      aria-valuetext={valueText}
    >
      <div className="ascii-bar__row">
        <span className="ascii-bar__bracket" aria-hidden="true">
          [
        </span>
        <span className="ascii-bar__track" aria-hidden="true">
          {cells.map((cell, index) => {
            const cellClass = ["ascii-bar__cell"];
            if (cell.segment) {
              cellClass.push(
                cell.segment.hatch ? "ascii-bar__cell--hatched" : "ascii-bar__cell--filled",
              );
            } else {
              cellClass.push("ascii-bar__cell--empty");
            }
            if (index === cursorIndex) cellClass.push("ascii-bar__cell--cursor");
            return (
              <span
                key={cell.id}
                className={cellClass.join(" ")}
                title={cell.title}
                style={
                  cell.segment
                    ? ({ "--cell-color": cell.segment.color } as CSSProperties)
                    : undefined
                }
              />
            );
          })}
        </span>
        <span className="ascii-bar__bracket" aria-hidden="true">
          ]
        </span>
        {readout !== undefined && readout !== null && (
          <span className="ascii-bar__readout">{readout}</span>
        )}
      </div>
    </div>
  );
}
