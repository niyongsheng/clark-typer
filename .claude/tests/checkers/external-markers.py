#!/usr/bin/env python3
"""
external-markers.py — 角色外化标记检查器 (Level 3)

解析 `核心人物.md`，提取每个角色的叙事外化标记。
验证条件：每个角色 ≥ 4 个标记，且至少 1 个非职业维度标记。

用法:
    python checkers/external-markers.py <character-file>
    python checkers/external-markers.py --project
"""

import re
import sys
from pathlib import Path

MARKER_HEADINGS = [
    '外化标记', '叙事外化', '外部特征', '习惯',
    '小动作', '仪式', '偏好', '标志性',
]
NON_PROFESSIONAL_INDICATORS = [
    '私人', '非理性', '强迫', '仪式', '小动作',
    '习惯性', '下意识', '不自觉', '紧张时',
]


def extract_characters(text: str) -> list[dict]:
    """Extract characters and their external markers from character file."""
    characters = []
    current_char = None
    in_marker_section = False

    for line in text.split('\n'):
        # Detect character sections (## Name or **姓名**：Name)
        heading_match = re.match(r'^##\s+(.+)$', line)
        name_match = re.match(r'\*\*姓名\*\*[：:]\s*(.+)$', line)

        if heading_match:
            if current_char and current_char.get('markers'):
                characters.append(current_char)
            current_char = {'name': heading_match.group(1).strip(), 'markers': []}
            in_marker_section = False
        elif name_match and current_char is None:
            current_char = {'name': name_match.group(1).strip(), 'markers': []}

        # Detect marker sections
        if current_char:
            for mh in MARKER_HEADINGS:
                if mh in line and ('#' in line or '**' in line):
                    in_marker_section = True
                    break

            # Collect markers (list items)
            if in_marker_section and line.strip().startswith('-'):
                marker_text = line.strip()[1:].strip()
                if marker_text:
                    current_char['markers'].append(marker_text)
            elif in_marker_section and line.strip().startswith('*'):
                marker_text = line.strip()[1:].strip()
                if marker_text:
                    current_char['markers'].append(marker_text)

    if current_char and current_char.get('markers'):
        characters.append(current_char)

    return characters


def classify_marker(marker: str) -> str:
    """Classify a marker as professional or non-professional."""
    for indicator in NON_PROFESSIONAL_INDICATORS:
        if indicator in marker:
            return 'non_professional'
    return 'professional'


def check_characters(path: Path) -> dict:
    """Validate external markers for all characters."""
    text = path.read_text(encoding='utf-8')
    characters = extract_characters(text)
    results = []

    for char in characters:
        markers = char['markers']
        marker_types = [classify_marker(m) for m in markers]
        non_professional_count = marker_types.count('non_professional')

        violations = []
        if len(markers) < 4:
            violations.append(f'外化标记仅 {len(markers)} 个 (需要 ≥4)')
        if non_professional_count < 1:
            violations.append(f'无非职业维度标记 (需要 ≥1 个)')

        results.append({
            'name': char['name'],
            'marker_count': len(markers),
            'non_professional_count': non_professional_count,
            'markers': markers[:8],  # show first 8
            'violations': violations,
            'pass': len(violations) == 0,
        })

    return {
        'characters': results,
        'total_characters': len(characters),
        'total_violations': sum(len(r['violations']) for r in results),
        'pass': all(r['pass'] for r in results) and len(characters) > 0,
    }


def main():
    if len(sys.argv) < 2:
        print('用法: python external-markers.py <character-file>')
        print('       python external-markers.py --project')
        sys.exit(1)

    if sys.argv[1] == '--project':
        project_root = Path(__file__).resolve().parent.parent.parent.parent
        path = project_root / '0-角色档案' / '核心人物.md'
        if not path.exists():
            print(f'[ERROR] 角色档案不存在: {path}')
            sys.exit(1)
    else:
        path = Path(sys.argv[1])

    result = check_characters(path)

    print(f'文件: {path}')
    print(f'角色数: {result["total_characters"]}')
    print()

    for char in result['characters']:
        status = 'PASS' if char['pass'] else 'FAIL'
        print(f'[{status}] {char["name"]}')
        print(f'      外化标记: {char["marker_count"]}个 (非职业: {char["non_professional_count"]}个)')
        if char['markers']:
            for m in char['markers'][:5]:
                print(f'        · {m[:60]}')
        if char['violations']:
            for v in char['violations']:
                print(f'        违反: {v}')

    if result['total_violations'] > 0:
        print(f'\nFAIL: {result["total_violations"]} 个违反')
        sys.exit(1)
    elif result['total_characters'] == 0:
        print('WARN: 未找到角色定义')
        sys.exit(0)
    else:
        print(f'\nPASS: 所有角色外化标记合规')


if __name__ == '__main__':
    main()
