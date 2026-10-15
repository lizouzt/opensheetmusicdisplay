# 阶段 0 基线

记录日期：2026-10-15。仓库为 `lizouzt/opensheetmusicdisplay`，提交 `a308225e74e8c760142ef9bfe8d3abe090ee1860`，与 `upstream/develop` 相同。`package.json` 版本 `2.2.1-dev`。

`upstream` remote 已指向 `https://github.com/opensheetmusicdisplay/opensheetmusicdisplay.git`。`release` 从该提交创建。把 `release` 设为 GitHub 默认分支需要仓库所有者在仓库设置里操作，Agent 不能代办。

## 环境

- Node `v22.14.0`（满足 ESLint 10 对 Node ≥ 22.13 的要求；上游 CI 使用 Node 24）。
- 没有 Firefox。单元测试使用 Karma 配置里的 `ChromeHeadlessNoSandbox`：`CHROME_BIN=$(which google-chrome) npx karma start --single-run --no-auto-watch --browsers ChromeHeadlessNoSandbox`。本次浏览器为 Chrome Headless 154.0.0.0。
- `npm run generate:blessed` 使用本机 `canvas` 与已构建的 `build/opensheetmusicdisplay.min.js`。

## 命令与结果

在干净的 `develop`（当时与 `upstream/develop` 相同，尚未加入本目录的文档）上执行。上游失败项不修。

| 命令 | 结果 |
|---|---|
| `npm install` | 退出码 0。809 个包，约 47 秒。`prepare` 依次跑 husky、`eslint .`（通过）和 webpack。webpack 5.111.1 约 20 秒，带 3 条性能建议，构建成功。 |
| `npm run lint` | 由上面的 `prepare` 执行 `eslint .`，通过。安装若 lint 失败会以非 0 退出。 |
| 单元测试（ChromeHeadlessNoSandbox） | 退出码 0。753 个测试全部通过，0 失败。Karma `Finished in 11.011 secs / 8.467 secs`。墙钟 03:37:41–03:38:05 UTC，含 webpack 打包约 9.7 秒。 |
| `npm run generate:blessed` | 退出码 0。墙钟 03:37:41–03:38:10 UTC。`visual_regression/blessed/` 有 446 张 PNG，外加 `source_commit.txt`（内容为 `develop a308225e`）。该目录被 `.gitignore` 忽略，不进入本提交。 |

## 预期中的报错输出

这些输出来自负向测试或上游样例，对应用例仍然通过，不作为基线失败：

- `Corrupted zip`：测试 “Corrupted file”。
- `can't find end of central directory`：测试 “load invalid MXL from string”。
- 请求 `does_not_exist.musicxml` 得到 404。
- `Could not parse MusicXML, no valid partwise element found`：加载非法 XML 的测试。
- `Not enough lines for SkyBottomLine calculation`：一次增量渲染测试中的警告，该测试通过。
- `generate:blessed` 对 Actor Prelude 样例警告：画布高度 37540.1 超过 CanvasBackend 上限 32767，乐谱被截断。日志中没有 `couldn't load` 或 `renderError`。

## 验收

本提交只增加 `fork-docs/` 下的文档。`release` 相对 `upstream/develop` 没有源码、测试数据或构建配置差异。
