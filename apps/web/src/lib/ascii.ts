export interface AsciiSegmentInput {
  value: number;
  color: string;
  label: string;
  hatch?: boolean;
}

export interface AsciiCell {
  segment: AsciiSegmentInput | null;
  segmentIndex: number;
  pct: number;
  firstOfSegment: boolean;
}

const clampValue = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/**
 * 按最大余数法把 cellCount 个格子分配给各状态段。
 * total 大于各段之和时，剩余部分作为末尾的空格（如未写章节）。
 */
export function allocateSegments(
  segments: AsciiSegmentInput[],
  cellCount: number,
  total?: number,
): AsciiCell[] {
  const cells = Math.max(0, Math.floor(cellCount));
  if (cells === 0) return [];

  const values = segments.map((s) => clampValue(s.value));
  const sum = values.reduce((a, b) => a + b, 0);
  const denom = Math.max(sum, clampValue(total ?? 0));

  if (denom <= 0) {
    return Array.from({ length: cells }, () => ({
      segment: null,
      segmentIndex: -1,
      pct: 0,
      firstOfSegment: false,
    }));
  }

  const remainderValue = Math.max(0, denom - sum);
  const allValues = remainderValue > 0 ? [...values, remainderValue] : values;
  const raw = allValues.map((v) => (v / denom) * cells);
  const counts = raw.map(Math.floor);
  const remaining = cells - counts.reduce((a, b) => a + b, 0);

  const byRemainder = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < remaining; i += 1) {
    counts[byRemainder[i % byRemainder.length].index] += 1;
  }

  // 非零段至少保留一格，避免极少量的待写章节在视觉上消失。
  const nonzero = allValues
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value > 0);
  if (cells >= nonzero.length) {
    for (const { index } of nonzero) {
      if (counts[index] > 0) continue;
      let donor = -1;
      for (let i = 0; i < counts.length; i += 1) {
        if (counts[i] > 1 && (donor === -1 || counts[i] > counts[donor])) donor = i;
      }
      if (donor === -1) continue;
      counts[donor] -= 1;
      counts[index] += 1;
    }
  }

  const result: AsciiCell[] = [];
  for (let index = 0; index < allValues.length; index += 1) {
    const isRemainder = remainderValue > 0 && index === allValues.length - 1;
    const segment = isRemainder ? null : segments[index];
    const pct = (allValues[index] / denom) * 100;
    for (let n = 0; n < counts[index]; n += 1) {
      result.push({
        segment,
        segmentIndex: isRemainder ? -1 : index,
        pct,
        firstOfSegment: n === 0,
      });
    }
  }

  return result.slice(0, cells);
}

export function countFilledCells(value: number, max: number, cellCount: number): number {
  const cells = Math.max(0, Math.floor(cellCount));
  const safeMax = clampValue(max);
  const safeValue = clampValue(value);
  if (cells === 0 || safeMax <= 0 || safeValue <= 0) return 0;
  return Math.min(cells, Math.max(1, Math.round((safeValue / safeMax) * cells)));
}

export function percent(value: number, max: number): number {
  const safeMax = clampValue(max);
  if (safeMax <= 0) return 0;
  return Math.round((clampValue(value) / safeMax) * 100);
}
