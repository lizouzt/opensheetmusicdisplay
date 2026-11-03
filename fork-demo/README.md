# Fork demo

这是本 fork 的公开 demo 构建，不是上游 OSMD 的 `demo/`。

上游 `demo/` 和 `webpack.common.js` 保持不动。开发服务器仍会把整个 `test/data` 挂到 `/samples`，所以公开站点不能部署上游 demo 或 `npm start`。

## 构建

1. 生成渲染库：`npm run build:webpack`（产物为 `build/opensheetmusicdisplay.min.js`）。
2. 生成页面：`node tools/build-fork-demo.mjs`。

`fork-demo/dist/` 被 git 忽略。其中的乐谱只从 `fork-docs/release-samples.csv` 复制，下拉列表由同一份清单生成。`.mxl` 以 Blob 交给 OSMD，`.xml` / `.musicxml` 以文本加载。

用任意静态服务器打开 `fork-demo/dist/index.html`。不要用 `file://`，浏览器会拦截页面去读取样例文件。地址栏加上 `?sample=文件名` 可以直接打开清单中的某一个样例。

`release` 分支上的样例检查通过后，同一份 `fork-demo/dist` 会发布到 <https://lizouzt.github.io/opensheetmusicdisplay/>。这不是上游的 <https://opensheetmusicdisplay.github.io/demo/>。

## 清单

作者列取 `git log --diff-filter=A --format='%an %ad' --date=iso -- <file>` 的最早一行。发布检查是 `node tools/check-release-samples.mjs`。
