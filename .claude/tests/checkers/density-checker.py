#!/usr/bin/env python3
"""
density-checker.py — 密度交替法则检查器 (Level 3)

扫描正文，检测高密度段落连续出现的情况。
违反条件：连续 3 个高密度段落之间无低密度缓冲段落。

用法:
    python checkers/density-checker.py <chapter-file>
    python checkers/density-checker.py --dir 7-正文/
"""

import re
import sys
from pathlib import Path

# 技术术语模式：工程、科学、数学领域常见术语
TECH_TERM_PATTERN = re.compile(
    r'(?:量子|熵|温度|压力|密度|频率|波长|能级|粒子|辐射|'
    r'算法|函数|变量|矩阵|向量|概率|迭代|收敛|'
    r'方程|定理|公式|定律|效应|机制|系统|结构|'
    r'数据|计算|模拟|建模|信号|噪声|阈值|'
    r'引擎|推进|能源|反应堆|电磁|引力|轨道)'
)

HIGH_DENSITY_THRESHOLD = 3  # 一个段落含 3+ 技术术语视为高密度
MAX_CONSECUTIVE_HIGH = 2     # 最多连续 2 个高密度段落


def check_density(text: str) -> list[dict]:
    """Analyze paragraph density and return violations."""
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    violations = []
    densities = []

    for i, para in enumerate(paragraphs):
        terms = TECH_TERM_PATTERN.findall(para)
        density = len(terms)
        is_high = density >= HIGH_DENSITY_THRESHOLD
        densities.append({
            'index': i,
            'is_high': is_high,
            'term_count': density,
            'preview': para[:80],
        })

    # Check for consecutive high-density
    consecutive_count = 0
    high_start = None
    for d in densities:
        if d['is_high']:
            if high_start is None:
                high_start = d['index']
            consecutive_count += 1
            if consecutive_count > MAX_CONSECUTIVE_HIGH:
                violations.append({
                    'type': 'consecutive_high_density',
                    'start_para': high_start,
                    'end_para': d['index'],
                    'count': consecutive_count,
                    'severity': 'FAIL',
                    'message': f'连续 {consecutive_count} 个高密度段落无缓冲'
                })
        else:
            consecutive_count = 0
            high_start = None

    return violations


def check_file(path: Path) -> dict:
    """Check a single file for density violations."""
    text = path.read_text(encoding='utf-8')
    violations = check_density(text)

    return {
        'file': str(path),
        'violations': violations,
        'pass': len(violations) == 0,
    }


def main():
    if len(sys.argv) < 2:
        print('用法: python density-checker.py <file> 或 --dir <directory>')
        sys.exit(1)

    if sys.argv[1] == '--dir':
        directory = Path(sys.argv[2])
        files = sorted(directory.glob('*.txt'))
    else:
        files = [Path(sys.argv[1])]

    total_violations = 0
    for f in files:
        if not f.exists():
            print(f'[SKIP] 文件不存在: {f}')
            continue
        result = check_file(f)
        status = 'PASS' if result['pass'] else 'FAIL'
        print(f'[{status}] {f.name}')
        for v in result['violations']:
            print(f'      段{v["start_para"]}-{v["end_para"]}: {v["message"]}')
            total_violations += 1

    if total_violations > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
