# DSH Superagent · 独立 Neo 任务面板

这是一个基于 DeepSeek Harness（DSH）的 AI 任务编排研究原型：监听 GitHub（可选飞书），根据授权建立工单，为每个工单启动执行会话，并在网页中查看与管理任务。

本项目不是 DeepSeek 官方产品。代码包含当前本地开发快照；尚未验证生产环境完整工作流。

## 三部分分别负责什么

- **DSH Host，127.0.0.1:3082**：运行模型调用、主 Agent、执行 Agent 和持久化工单。
- **独立 Neo 网页，127.0.0.1:5179**：通过同源反向代理访问 `/orchestrator/api/*`，不注册 DSH 的 `ui-*` 插件。
- **GitHub / 飞书**：任务来源和后续讨论渠道。主 Agent 负责接单、派工；执行 Agent 负责具体工作。

DSH 必须运行，前端才能读写任务。Host 已运行时不要再启动第二份；`EADDRINUSE :3082` 表示端口已被占用。

## 新增：人工任务状态

独立页面打开“任务”；完整管理面板在工单详情打开“任务处理”。

- **已完成**：人工确认本次任务完成，结束本工单的执行。
- **推迟**：暂停本工单并保留记录，不会定时自动恢复；点击“恢复此任务”继续。
- **未完成**：结果尚未满足要求，保留为未完成并停止继续执行；确认要继续时手动恢复。

这三个状态记录在 Host 数据库中，刷新或正常重启后仍保留。它们只影响选中的工单，不会暂停其他工单、自动合并 PR 或发送 GitHub / 飞书消息。

恢复推迟或未完成的任务时会重新检查原授权；已完成的任务不能通过恢复按钮继续。需要新范围的工作请新建请求。页面操作需要二次确认。

API：

```text
PUT  /orchestrator/api/tickets/:id/status
     { "status": "completed" | "deferred" | "incomplete", "note"?: "说明" }
POST /orchestrator/api/tickets/:id/resume
```

每次请求都必须携带 `x-orchestrator-request: 1`。静态页通过本地反向代理访问 Host，不能使用 file:// 直接打开。

## 安装和启动

要求：Node.js ^22.19.0 或 >=24、pnpm（项目锁定版本见 package.json）、Git，以及兼容本项目的 DSH。GitHub 功能需要安装并登录 `gh`。

```powershell
cd D:\DSH-Superagent
pnpm install --frozen-lockfile
pnpm build
cd apps\neo-standalone
pnpm install --frozen-lockfile
pnpm dev
```

另一个终端启动 Host（已运行则跳过）：

```powershell
dsh --profile superagent --no-open
```

浏览器打开 http://127.0.0.1:5179/ 。Home / State / Overview 查看真实状态，“任务”处理工单，Pause 暂停或恢复全局调度。

首次安装 DSH 或新电脑部署，请遵循 [SETUP.md](SETUP.md) 和 [部署说明](docs/006-deployment.md)。本源码包不携带可直接复制使用的账号凭据、API Key 或个人 Host profile。

Windows 注意：`stateDir` 使用带盘符的完整路径（例如 `C:/Users/你的用户名/.dsh/state/superagent`），不要使用 `/Users/...`。模型服务地址、密钥和角色模型在自己的 DSH 环境中配置。

## 第一次如何派任务

1. 在 GitHub 来源设置仓库 `owner/repo` 和可用的 GitHub CLI 路径。路径是 `gh.exe` 或账号包装脚本，不是 `gh repo clone ...` 命令。
2. 确认机器人账号具有所需仓库权限；把你自己的 GitHub 用户名加入“能发起工作的 GitHub 账号”。
3. 在仓库 Issue 中发出明确的小任务，例如：`@机器人账号 请把 README 的 xxx 改为 yyy，提交 PR，不要合并。`
4. 等待来源轮询和接单，在任务页查看结果。检查实际变更后选择已完成、推迟或未完成。

不要将“服务在线”当作“模型已正确完成任务”；首次使用仍需真实验证模型、工具调用、仓库准备和 PR 交付。

## 本地目录与数据

- 新项目源码目录：`D:\DSH-Superagent`。
- 工单、配置和历史数据保存在 DSH profile 的 `stateDir`，不是源码目录；迁移源码不会清空这些数据。
- 本机 profile 通过 link 依赖引用项目，移动源码后必须同步修改 profile/package.json、相关 lockfile 和 node_modules 中的链接。本轮已处理本机已有的引用。
- 不要把整个 `.dsh`、数据库、日志或账号包装脚本提交到 GitHub。

## 检查与构建

```powershell
# 根目录
pnpm typecheck
pnpm test
pnpm build
# 独立前端目录
cd apps\neo-standalone
pnpm typecheck
pnpm test
pnpm build
```

仓库部分既有测试依赖 POSIX shell、符号链接和文件权限，Windows 全量检查可能失败；交付说明记录实际通过项目和剩余问题，不将其标为全部通过。

## 上传 GitHub

使用同目录的 `GITHUB_UPLOAD.md`。源代码 ZIP 已排除 node_modules、构建产物、Git 内部目录、运行日志、数据库和凭据。ZIP 解压后应把里面的项目文件上传，不能只上传 ZIP 代替源码。

当前工作目录包含此前已有的未提交本地改动，已保留在本地和完整源码包中；本轮 Git commit 仅包含本次任务状态、文档与迁移相关变更。上传前用 `git status` 和 `git diff` 一起审阅这些原有改动。

本次没有自动推送 GitHub，也没有变更版本号或创建 tag。

## 进一步阅读

- [原项目英文说明](README.en.md)
- [领域模型](docs/001-domain.md)
- [授权机制](docs/002-authorization.md)
- [执行机制](docs/003-execution.md)
- [完整管理面板](docs/005-panel.md)
- [独立页面说明](apps/neo-standalone/README.md)
- [MIT License](LICENSE)
