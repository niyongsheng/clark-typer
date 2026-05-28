#!/usr/bin/env python3
"""
paragraph-checker.py — 单句段检查器 (Level 3)

统计正文中单句成段的数量。
违反条件：> 5 处单句成段 → FAIL
相邻单句段间距 < 200 字 → WARN

用法:
    python checkers/paragraph-checker.py <chapter-file>
    python checkers/paragraph-checker.py --dir 7-正文/
"""

import re
import sys
from pathlib import Path

MAX_SINGLE_SENTENCE_PARAGRAPHS = 5
MIN_GAP_BETWEEN_SINGLE_SENTENCE = 200


def is_single_sentence_paragraph(para: str) -> bool:
    """Check if a paragraph consists of a single sentence."""
    text = para.strip()
    if not text:
        return False
    # Count sentence-ending punctuation
    sentences = re.split(r'[。！？；\n]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    return len(sentences) == 1


def check_paragraphs(text: str) -> dict:
    """Analyze single-sentence paragraphs and return violations."""
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    single_sentence_indices = []
    violations = []
    warnings = []

    for i, para in enumerate(paragraphs):
        if is_single_sentence_paragraph(para):
            single_sentence_indices.append(i)

    # Count violation
    count = len(single_sentence_indices)
    if count > MAX_SINGLE_SENTENCE_PARAGRAPHS:
        violations.append({
            'type': 'too_many_single_sentence',
            'count': count,
            'limit': MAX_SINGLE_SENTENCE_PARAGRAPHS,
            'severity': 'FAIL',
            'message': f'单句成段 {count} 处 (限制 {MAX_SINGLE_SENTENCE_PARAGRAPHS})'
        })

    # Check gap between adjacent single-sentence paragraphs
    total_chars = 0
    for i, para in enumerate(paragraphs):
        if i in single_sentence_indices:
            if total_chars < MIN_GAP_BETWEEN_SINGLE_SENTENCE and len(warnings) < 5:
                warnings.append({
                    'type': 'single_sentence_too_close',
                    'para_index': i,
                    'gap_chars': total_chars,
                    'severity': 'WARN',
                    'message': f'单句段间距仅 {total_chars} 字 (< {MIN_GAP_BETWEEN_SINGLE_SENTENCE})'
                })
            total_chars = 0
        else:
            total_chars += len(para)

    return {
        'single_sentence_count': count,
        'single_sentence_indices': single_sentence_indices,
        'violations': violations,
        'warnings': warnings,
        'pass': len(violations) == 0,
    }


def check_file(path: Path) -> dict:
    text = path.read_text(encoding='utf-8')
    return check_paragraphs(text)


def main():
    if len(sys.argv) < 2:
        print('用法: python paragraph-checker.py <file> 或 --dir <directory>')
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
        print(f'[{status}] {f.name} (单句段: {result["single_sentence_count"]}处)')
        for v in result['violations']:
            print(f'      违反: {v["message"]}')
            total_violations += 1
        for w in result['warnings']:
            print(f'      警告: {w["message"]}')

    if total_violations > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
