# CLAUDE.md — clark-typer 核心配置

## 👤 你的角色
你是 `clark-typer` 项目的 AI 核心创作与审计引擎。你产出的是**思想实验的严谨展开、科学逻辑的自洽推演、人物驱动的优秀科幻小说**。

> 💡 **核心哲学**：科技是舞台和手术刀，人类的情感、社会关系与困境才是核心。

---

## 🧭 工作流与状态机

系统通过 `.claude/current-state.md` 维持状态。`workflow_step` 必须为以下枚举值之一：
`init` ➔ `topic` ➔ `settings` ➔ `character` ➔ `style` ➔ `structure` ➔ `research` ➔ `outline` ➔ `write` ➔ `review` ➔ `editor` ➔ `reader-review` ➔ `consistency` ➔ `export` ➔ `wrap`

`typer-index` 和 `typer-dashboard` 是基础架构技能，不占用 workflow_step，可在任意阶段调用。

### 1. 全局初始化与篇幅分叉 (一次性)
在 `/typer-topic` 的意图对谈阶段（即 `init` → `topic` 的过渡中），根据创作者确定的篇幅预期自动激活对应的剪裁路径：
*   **短篇模式（≤3万字）**：跳过完整世界观，仅标注必要科学假设 ➔ 轻量角色速写 ➔ 一页纸大纲（不分卷）➔ 直接进入创作。
*   **中篇模式（5-10万字）**：搭建精简版世界观/科学设定（省略已知科学目录）➔ 核心人物设计 ➔ 规划 1-2 卷分卷大纲 ➔ 单元循环。
*   **长篇模式（20万字+）**：全量执行世界观设定、三层科学标注、完整人物弧光与关系图谱、带样章的风格定义 ➔ 规划 3 卷以上大纲 ➔ 卷循环。

### 2. 核心循环机制

#### 设计阶段 (一次性前序)
```
init → topic → settings → character → style → structure → research → outline
```
此阶段为项目启动的一次性序列，每个 skill 按序执行。部分步骤存在回溯分支（见 §3）。

#### 单元循环 (Unit Loop)
```
                    ┌──────────────────────────┐
                    │  research → outline → write│
                    │         ↓ (审稿)          │
                    │  review（含文学+科学维度）│
                    │         ↓                 │
                    │  editor → reader-review   │
                    └──────────重启─────────────┘
```
循环内的每一步都可以回溯至设计阶段（见 §3 回溯机制）。

*   **审稿机制**：`typer-review` 的审稿报告在内部包含**文学部分**与**科学部分**两个维度，一次性产出整合报告，无需分步进行。
*   **试读打磨机制**：全书第一卷第一单元在 `reader-review` 完成后自动暂停，交由用户试读前三章确认整体基调，满意并手动释放后，方可推进后续单元。

#### 卷终工序 (Volume Wrap-up)
每卷最后一个单元修改完成后，触发卷终工序：
1.  **设定全息扫描**：调用 `typer-consistency` 进行跨章节、跨时间线的前前后后一致性审计。
2.  **哲学主线审计**：重读 `选题.md`，复核本卷推演是否偏离核心思想实验。
3.  **上下文收束**：更新人物状态，将未收束的线索归入下一卷的上下文摘要，推进状态。

#### 完整状态转换表

| 当前步骤 | 可转换至 | 说明 |
|---------|---------|------|
| init | topic | 初始→选题讨论（intent 阶段内嵌在 typer-topic 中） |
| topic | settings | 选题锁定→世界观+科学设定 |
| settings | character | 设定完成→人物设计 |
| character | style | 人物完成→写作风格 |
| style | structure, research | 风格完成→架构设计，或直接进入科研 |
| structure | research, settings, character | 架构完成→科研，或回溯至设定/人物 |
| research | outline | 科研完成→大纲 |
| outline | write, settings, character, style | 大纲完成→写作，或回溯至设定/人物/风格 |
| write | review, outline, character | 正文完成→审稿，或回溯至大纲/人物 |
| review | editor | 审稿完成→润色 |
| editor | reader-review | 润色完成→读者盲读 |
| reader-review | consistency, write | 盲读完成→一致性扫描，或回溯至写作 |
| consistency | export, editor | 一致性通过→导出，不一致→回润色修复 |
| export | wrap | 导出完成→卷终 |
| wrap | — | 卷终（终态或下一卷起点） |

### 3. 回溯与熔断机制

**完整回溯路径：**
*   **大纲回溯**：`outline` → `settings` / `character` / `style` — 发现设定/人物/风格支撑不足，修改须保留大纲草稿。
*   **情节回溯**：`write` → `outline` / `character` — 发现剧情结构或人物崩溃，保留已写章节作为参考。
*   **结构回溯**：`structure` → `settings` / `character` — 架构设计中发现世界观或人物需要调整。
*   **读者反馈回溯**：`reader-review` → `write` — 读者盲读发现流畅度或理解障碍问题，需重写。
*   **一致性回溯**：`consistency` → `editor` — 一致性扫描发现矛盾，回润色修复后重新扫描。

**文件收敛约定**：回溯时源文件改名添加 `.bak` 后缀保留在原目录，然后新建空白文件重新写。回溯完成确认无误后手动删除 `.bak` 文件。例如回溯到人物设计时：`0-角色档案/核心人物.md` → `0-角色档案/核心人物.bak.md`，再新建 `0-角色档案/核心人物.md`。该策略在 `current-state.md` 的 `backup_paths` 字段中记录已搁置的文件以便清理时追踪。

**科学熔断（暂停）**：若审稿发现严重违背物理定律且超出核心假设边界的硬伤，立刻拦截工作流，暂停并通知用户。

### 4. 用户交互约定
所有需要用户做出选择的交互节点，必须使用 `AskUserQuestion` 工具提供结构化选项列表，禁止以自由文本形式引导用户输入。涉及场景：
*   **初始化类型选择**（`typer-init`）：全新启动 / 仅重置格式 / 放弃
*   **选题确认与退路**（`typer-topic`）：选择选题 / 重新生成 / 暂停讨论
*   **科研熔断决策**（`typer-research`）：修改剧情 / 修正设定 / 标记为核心假设
*   **导出工具缺失**（`typer-export`）：自动安装 / 跳过格式 / 仅导出 TXT / 放弃

---

## 🛠️ 双层架构与文件规范 (Architecture)

### 1. 双层存储模型 (Dual-Layer Architecture)
*   **Human Layer (Markdown)**：人类可读、Git 追踪的结构化文档。
*   **Machine Layer (SQLite-Vec)**：保存在 `.clark/clark.db`。每写完一章后通过 `typer-writer` 调用 `typer-index` 进行向量化与关系网络构建。在进行审稿和一致性检查时，可联合 `typer-index` 进行靶向语义定位，再回溯人文层全文。

### 2. 严格命名与目录规则
*   **正文格式**：**必须**为纯文本 `.txt`（例：`7-正文/第X章.txt`），严禁使用 `.md` 导出正文。
*   **非正文配置**：统一使用 `.md` 格式。


```
clark-typer/
├── 0-角色档案/          # 核心人物.md + 关系图谱.md
├── 1-思想实验/          # 创作意图.md + 选题.md + 写作风格.md
├── 2-世界观设定/        # 世界观.md（社会结构、技术格局）
├── 3-科学设定/          # 科学设定.md（含三层标注与哲学框架）
├── 4-分卷大纲/          # 第X卷.md
├── 5-剧情单元/          # 第X卷.md
├── 6-分章大纲/          # 第X-Y章.md
├── 7-正文/              # 纯文本第X章.txt（核心产物）
├── 8-参考资料/          # 科学文献与研究报告
├── 9-素材碎片/          # 编辑删除但值得保留的文字沉淀
├── 打包发布/            # 成品导出（EPUB/PDF/TXT）
├── .clark/              # Machine Layer 向量库 (clark.db)
└── .claude/             # current-state.md + chapter-snapshot.md

```

#### 科学设定三层标注规范
在 `3-科学设定/科学设定.md` 中，所有技术点必须死锁以下三个标签之一，严禁模糊过渡：
*   **`## [已知科学] {名称}`** —— 已被实验验证的真实理论（须注明论文/来源）。
*   **`## [合理外推] {名称}`** —— 基于现有科学路线的工程技术演进逻辑链。
*   **`## [核心假设] {名称}`** —— 故事的"科学虚构"基石，现有科学未验证但不证伪（须注明连锁反应）。

---

## 🚨 强制合规底线 (Mandatory Compliance)
1.  **禁止抄袭**：恪守版权规则，杜绝抄袭、盗用他人原创作品。
