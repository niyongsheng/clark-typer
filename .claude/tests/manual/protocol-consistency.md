# 测试协议: typer-consistency

## 前置条件
- [ ] `workflow_step` 必须为 `consistency`
- [ ] 当前卷的所有章节已完成
- [ ] `chapter-snapshot.md` 完整

## 测试步骤
1. 执行 `/typer-consistency`
2. 第一阶段：快照层初筛（读取 chapter-snapshot.md）
3. 第一阶段输出：时间线标记、科学设定出场频率、角色活跃度
4. 第二阶段：靶向语义回溯（联合 typer-index）
5. 检查技术设定物理限制是否有偏移
6. 检查角色知识/情感是否有断裂
7. 输出审计报告

## 通过标准
- [ ] 一致性扫描报告已生成
- [ ] 快照初筛结果包含时间线、科学设定、角色活跃度
- [ ] 若发现矛盾，`workflow_step` 已被修改为 `editor`
- [ ] 若无矛盾，`workflow_step` 推进到 `export`
- [ ] 角色未被无故冷落超过半卷

## 失败模式
- 未通过时 workflow_step 未设置为 `editor` → 手动修正
- 快照初筛跳过 → 重新执行
- 有明显矛盾但报告未检出 → 补充扫描
- 使用了 `typer-index` 但未说明具体命令 → 补充命令参数
