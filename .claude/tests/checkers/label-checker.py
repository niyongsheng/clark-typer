#!/usr/bin/env python3
"""
label-checker.py — 科学设定三层标签合规检查器 (Level 3)

检查 `科学设定.md` 中每项技术点是否被三层标签之一明确标记。
发现未标记条目 → FAIL

用法:
    python checkers/label-checker.py <science-settings-file>
    python checkers/label-checker.py --project  # 自动定位到项目 3-科学设定/
"""

import re
import sys
from pathlib import Path

VALID_LABELS = ['[已知科学]', '[合理外推]', '[核心假设]']
HEADING_PATTERN = re.compile(r'^##\s+(.+)$', re.MULTILINE)


def get_sections(text: str) -> list[dict]:
    """Extract all ## sections and their labels."""
    lines = text.split('\n')
    sections = []
    current_heading = None
    current_content = []

    for i, line in enumerate(lines):
        heading_match = HEADING_PATTERN.match(line)
        if heading_match:
            if current_heading is not None:
                sections.append({
                    'heading': current_heading,
                    'line': heading_line,
                    'content': '\n'.join(current_content),
                })
            heading_line = i + 1
            current_heading = heading_match.group(1).strip()
            current_content = []
        elif current_heading is not None:
            current_content.append(line)

    if current_heading is not None:
        sections.append({
            'heading': current_heading,
            'line': heading_line,
            'content': '\n'.join(current_content),
        })

    return sections


def check_labeling(text: str) -> dict:
    """Check that every ## section is properly labeled."""
    sections = get_sections(text)
    unlabeled = []
    correctly_labeled = []

    for sec in sections:
        heading = sec['heading']
        found_label = None
        for label in VALID_LABELS:
            if heading.startswith(label):
                found_label = label
                break

        if found_label:
            correctly_labeled.append({
                'heading': heading,
                'label': found_label,
                'line': sec['line'],
            })
        else:
            unlabeled.append({
                'heading': heading,
                'line': sec['line'],
            })

    return {
        'total_sections': len(sections),
        'labeled': correctly_labeled,
        'unlabeled': unlabeled,
        'pass': len(unlabeled) == 0,
    }


def check_file(path: Path) -> dict:
    text = path.read_text(encoding='utf-8')
    return check_labeling(text)


def main():
    if len(sys.argv) < 2:
        print('用法: python label-checker.py <file>')
        print('       python label-checker.py --project')
        sys.exit(1)

    if sys.argv[1] == '--project':
        # Auto-detect project science settings
        project_root = Path(__file__).resolve().parent.parent.parent.parent
        path = project_root / '3-科学设定' / '科学设定.md'
        if not path.exists():
            print(f'[ERROR] 科学设定文件不存在: {path}')
            sys.exit(1)
    else:
        path = Path(sys.argv[1])

    result = check_file(path)

    print(f'文件: {path}')
    print(f'总节数: {result["total_sections"]}')
    print()

    if result['labeled']:
        print('已标记:')
        for l in result['labeled']:
            label_icon = {'[已知科学]': '📖', '[合理外推]': '🔧', '[核心假设]': '💡'}
            icon = label_icon.get(l['label'], '?')
            print(f'  {icon} L{l["line"]}: {l["heading"]}')
        print()

    if result['unlabeled']:
        print(f'未标记 ({len(result["unlabeled"])} 处):')
        for u in result['unlabeled']:
            print(f'  ✗ L{u["line"]}: {u["heading"]}')
        print()
        print(f'FAIL: {len(result["unlabeled"])} 个技术点缺少三层标签')
        sys.exit(1)
    else:
        print('PASS: 所有技术点均已正确标记三层标签')


if __name__ == '__main__':
    main()
