# 整套视觉回归

比对时间：2026-11-03 09:47（Asia/Taipei）。

基线是 `upstream/develop` 的 `a308225e`，用该提交自己的 `build/opensheetmusicdisplay.min.js` 渲染 `test/data`。当前是 `release` 的 `a43dca0c`。两边都用 `generateImages_browserless.mjs`，页面宽高为 0（不分页），模式 `--osmdtesting`。比对用 `node test/Util/visualRegression.mjs ./visual_regression`，像素差为 0 才算相同。

图片在被 git 忽略的 `visual_regression/` 里，只用于内部比对。这里不贴上游样例的渲染图。

## 结果

上游样例 446 张：429 张 0 像素差异，17 张有差异。没有加载失败，也没有渲染报错。`ActorPreludeSample.xml` 在两边都超过 CanvasBackend 的 32767 像素高度上限而被截断：基线警告高度 37540.1，当前警告高度 38166.1。

41 个 `test_mxl4_*` 都生成了 PNG，加载成功。它们不在 `a308225e` 里，所以比对把它们记成警告，而不是差异。

webpack 对当前源码做了一次生产构建，输出与已有的 `build/opensheetmusicdisplay.min.js` 内容相同，因此没有重写该文件。生成日志里“构建比 `src/` 里 13 个文件旧”来自这 13 个文件的修改时间，不是另一套源码。

## 17 张差异

都来自已经合进 `release` 的行为，音符和谱号没有另外一套改动。

`<measure-numbering>` 现在会生效。`system` 只在系统开头标号，`none` 不标号。页面因此变矮，或只少了几个数字：

| 图片 | 像素差 | 看到的变化 |
|---|---:|---|
| `Dichterliebe01.xml_1` | 3998880 | 高度 2777 变为 2769 |
| `Beethoven_AnDieFerneGeliebte.xml_1` | 1991520 | 高度 1383 变为 1376。`_bboxVexFlowGraphicalNote` 和 `_skybottomline` 两张同样 |
| `Mozart_AnChloe.xml_1` | 1844640 | 高度 1281 变为 1273 |
| `Saltarello.xml_1` | 930240 | 高度 646 变为 630。`Saltarello.mxl_1` 同样 |
| `Debussy_Mandoline.xml_1` | 2559 | 尺寸不变。中段小节号 3、5 不再画出，音符还在 |
| `Mozart_DasVeilchen.xml_1` | 558 | 尺寸不变，少了中段小节号 |
| `Mozart_Clarinet_Quintet_Excerpt.mxl_1` | 479 | 压缩包里有 `system` 和 `none`。小节号 7、10、12、13、15 不再画出 |
| `OSMD_function_test_measuresToDraw_Beethoven_AnDieFerneGeliebte.xml_1` | 63 | 小节号 11 不再画出 |
| `test_drum_tuplet_flat_beams_Siebener_Endstreich_testFlam.musicxml_1` | 48 | 小节号不再画出 |

另外两份文件含有 `<measure-numbering>`，画面仍是 0 像素差异：`test_drum_tuplet_beams_measure1.musicxml` 的值是 `system`，它只有一个系统，开头的号本来就在；`test_tabs_4_strings_bass_guitar.musicxml` 的值是 `none`。

`<staff-size>` 现在按百分比缩放谱表。高度变化会让整页像素都算作差异：

| 图片 | 像素差 | 看到的变化 |
|---|---:|---|
| `ActorPreludeSample.xml_1` | 8274190 | 同时有 `system` / `none` 和多处 `<staff-size>`。截断后的画布里，内容整体上下错开 |
| `test_slide_glissando.musicxml_1` | 1995840 | 高度 1351 变为 1386 |
| `test_wedge_overlap_1477.musicxml_1` | 920160 | 高度 639 变为 637。音符、力度记号和谱表还在，只是间距少了 2 像素 |
| `test_tabs_x-align_vertically.musicxml_1` | 7816 | 尺寸不变。六线谱的线距变小，上方五线谱仍在 |

踏板 `resume` 现在画出没有下钩的线：

| 图片 | 像素差 | 看到的变化 |
|---|---:|---|
| `test_clef_change_on_invisible_note_norma_fantasy_1605.musicxml_1` | 1506240 | 高度 992 变为 1046 |

## 没有算作意外的范围

阶段 4 里用 MuseScore、Dorico、Sibelius、Finale 自写导出的兼容样例，以及大乐谱的性能对比，这次没有做。
