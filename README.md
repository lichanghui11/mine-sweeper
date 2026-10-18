# 扫雷 Web

基于 Next.js App Router、React、TypeScript 与 Hono 的单机扫雷游戏。

## 开始使用

使用 Node.js 24 LTS 和 npm：

```sh
npm ci
npm run dev
```

打开 http://localhost:3000 。开发服务监听所有网卡，手机与电脑在同一局域网时，可通过电脑 IP 和端口访问。

## 保留的功能

- 默认 12 × 12 棋盘、26 枚地雷；首击时布雷，保护首击及相邻八格。
- 空白扩散、数字提示、旗帜与问号循环、双击数字快速开。
- 剩余雷数、用时、状态说明、重新开始。
- 五种音效、失败震动与闪光、爆炸格、错旗提示、胜利庆祝。
- 桌面与手机布局，键盘操作和减少动态效果支持。

鼠标左键翻格，右键循环标记；触屏轻点翻格、长按 450ms 标记，也可使用标记模式按钮。双击数字窗口为 250ms；旗数匹配时展开邻格，误标可能踩雷。旗数不匹配时不操作。

方向键移动焦点，Enter / 空格翻格，F 标记，C 快速开。所有非雷格翻开即胜利，无需插满旗帜。首次插旗不启动计时；切换标签页继续计时。刷新页面开启新局，未提供存档或排行榜。

## 架构

- `src/app`：Next.js 页面、全局样式、静态配置与状态文件导出。
- `src/features/minesweeper/engine.ts`：纯函数游戏引擎，独立于 React。
- `src/features/minesweeper/MinesweeperGame.tsx`：界面、手势、计时、音效和动画。
- `src/server/app.ts`：Hono API，包含 `/api/health` 和 `/api/config`。
- `src/shared/game-config.ts`：默认参数与配置校验。
- `public/audio`：原版五种音效。
- `tests/engine.test.ts`：核心规则和 API 测试。

棋盘状态保存在浏览器内存中，操作不依赖网络。配置从构建时生成的静态 JSON 读取；读取失败时使用内置默认配置，新配置仅在重新开始时应用。修改默认尺寸、雷数、问号开关可编辑共享配置文件，雷数必须允许首击九宫格保护。

相较旧版修正：已翻格不能插旗，胜利后保留数字，统一清理效果与计时器，以实际时间差计算用时，避免后台计时漂移。

## 验证和生产运行

```sh
npm test
npm run typecheck
npm run build
```

构建输出在 `out/`，由静态托管服务提供；不再使用 `next start`。本地开发仍使用 `npm run dev`。`/api/config.json` 与 `/api/health.json` 在构建时生成，不运行常驻 Hono 服务；健康文件只说明静态产物存在。

## GitHub Pages 部署

- 源码：https://github.com/lichanghui11/mine-sweeper
- 在线体验：https://lichanghui11.github.io/mine-sweeper/
- 仓库 `Settings → Pages → Build and deployment → Source` 选择 `GitHub Actions`。
- 推送到 `main` 自动运行 `.github/workflows/pages.yml`，也可在 Actions 手动运行。
- 工作流使用 Node.js 24、`npm ci` 与 `package-lock.json`，测试、类型检查和构建成功后发布 `out/`。
- `NEXT_PUBLIC_BASE_PATH` 由 Pages 配置提供，页面、配置文件和音效一起适配仓库子路径；无需添加个人 token 或仓库 Secret。
- 默认本地构建不带子路径。复现 Pages 构建时，在 PowerShell 设置 `$env:NEXT_PUBLIC_BASE_PATH = '/mine-sweeper'` 后执行 `npm run build`；完成后执行 `Remove-Item Env:NEXT_PUBLIC_BASE_PATH`。
- 修改游戏默认配置后需重新构建部署。自定义域名时，重新运行工作流以获取对应的路径配置。

## 许可证

沿用原项目约定，仅用于学习与内部演示。对外发布或商业化请先取得原作者许可。
