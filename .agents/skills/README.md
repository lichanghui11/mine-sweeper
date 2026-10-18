# 项目 Skills

安装日期：2026-10-11。除下文注明的项目适配版外，各目录包含原始 SKILL.md 和配套文件，来源为安装时的 main 分支。原版技能行为说明保持原样；修正了上游参考文件中的相对链接，使其指向随附文件。项目适配规则在根目录 AGENTS.md。

| 目录 | 来源 |
| --- | --- |
| writing-plans | obra/superpowers / skills/writing-plans |
| verification-before-completion | obra/superpowers / skills/verification-before-completion |
| tdd | mattpocock/skills / skills/engineering/tdd |
| react-best-practices | vercel-labs/agent-skills / skills/react-best-practices |
| playwright-best-practices | currents-dev/playwright-best-practices-skill / playwright-best-practices |

React 技能的原始名称为 vercel-react-best-practices。支持 .agents/skills 的客户端可自动发现；其他客户端可指定 SKILL.md 路径读取。更新时检查规则和依赖变化。这些文件不安装 MCP，也不等于已安装测试运行依赖。

atomic-commits：2026-10-17 安装，来源 centitenka/atomic-commits（main）。已删除 Agent 共同作者署名规则；提交只使用仓库的人类 Git 用户。

executing-plans：2026-10-17 添加，项目维护的独立适配版，借鉴 [obra/superpowers executing-plans](https://github.com/obra/superpowers/tree/main/skills/executing-plans) 的方法，非上游原版。以当前 Agent 执行和单一权威文档为基线，复用已安装技能，无上游脚本或额外技能依赖。
