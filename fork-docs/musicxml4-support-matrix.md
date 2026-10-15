# MusicXML 4.0 / 4.1 支持矩阵

阶段 2 的运行时结论。WP-1、WP-3 与 WP-4 已按实现后的结果改过。除这三处外，引擎是 OSMD `2.2.1-dev` 提交 `a308225e`。打包三行在 `eea91c1f`（WP-1）上用单元测试重测。踏板两行在 `ac248c9d`（WP-3）上用单元测试和 SVG 重测。级数和弦在 `d299b30b`（WP-4）上用单元测试和 SVG 重测。

## 怎么测的

- 规范来源：W3C MusicXML 仓库的 [4.0 version history](https://www.w3.org/2021/06/musicxml40/version-history/40/) 与 [4.1 draft version history](https://w3c.github.io/musicxml/version-history/41/)，并对照 `schema/musicxml.xsd`。下面每一条 Schema 变更单独一行。文档变更不是 Schema 变更，列在最后，没有测试文件。
- 测试文件由本项目编写，放在 `test/data/test_mxl4_*`。`version` 为 `4.0` 或 `4.1`，预期渲染写在 `<identification><miscellaneous>`。2026-10-15 用 `xmllint --nonet --schema` 校验：全部 `test_mxl4_*.musicxml` 通过 `musicxml.xsd`；`test_mxl4_packaging.mxl` 里的 `META-INF/container.xml` 通过 `container.xsd`，其中的 `score.musicxml` 与 `P1.musicxml` 通过 `musicxml.xsd`。`mimetype` 是压缩包的第一个条目，存储方式为不压缩，内容为 `application/vnd.recordare.musicxml`。
- 运行方式：用构建产物 `build/opensheetmusicdisplay.min.js`，在 jsdom 里以 SVG 后端加载并渲染。记录控制台 error/warn、`SheetErrors`、声部移调、和弦文本、踏板与波浪线等表达式、音符上的变音记号、演奏乐器、琶音类型、连线和符干方向。渲染图在 `fork-docs/evidence/`。
- 空的 `<multiple-rest>` 不能通过 XSD，仓库里只保留内容为 `2` 的合法文件。空元素只在内存中探测，不提交。
- 判定只用这五档：完整支持、部分支持、不支持、忽略但不报错、报错。完整支持目前包括 `<metronome print-object>` 的印刷行为、多个 rootfile 时选中第一份 MusicXML、踏板 `discontinue` / `resume`，以及级数和弦的排列、低音分隔和弃用的 `<function>`。明细见文末汇总。

版权：这些文件是本项目自写的最小乐谱，按 `SAMPLE_COPYRIGHT_AUDIT.md` 为 A 级。没有复制受版权保护的乐谱。

## 4.0 打包

[Packaging Changes](https://www.w3.org/2021/06/musicxml40/version-history/40/)。[Issue 278](https://github.com/w3c-cg/musicxml/issues/278) 是总谱与分谱打进同一个 `.mxl`，拆成下面三行。XML catalog 与 DTD 换 XSD 是规范发行物，OSMD 不读取它们。

| 条目 | 规范 | 测试文件 | 判定 | 证据 | 工作包 |
|---|---|---|---|---|---|
| `mimetype` 条目 | [40.md Packaging](https://www.w3.org/2021/06/musicxml40/version-history/40/) | `test/data/test_mxl4_packaging.mxl`；单元测试在 `Mxl_Test.ts` 里用同样的未压缩 `mimetype` 打包 | 忽略但不报错 | 有 `mimetype` 时解压并读到主乐谱。OSMD 不校验该文件的内容，缺了它的旧 `.mxl` 也能读。 | WP-1 |
| 多个 `rootfile` 时选择第一个 MusicXML 媒体类型 | [container.xsd](https://www.w3.org/2021/06/musicxml40/listings/container.xsd/)，[Issue 278](https://github.com/w3c-cg/musicxml/issues/278) | `test/data/test_mxl4_packaging.mxl`；断言在 `Mxl_Test.ts` | 完整支持 | 第一个 rootfile 是 `cover.pdf`，第二个是 `score.musicxml`（`application/vnd.recordare.musicxml+xml`），第三个是分谱。读出的 XML 含 “MXL4 Main Score”，不含 “MXL4 Part Only”，也不含 `%PDF`。没有 media-type 的第一个 rootfile 仍被当成主乐谱。旧的 Mozart `.mxl` 和 UTF-16 `.mxl` 测试通过。 | WP-1 |
| `<part-link>` | [part-link](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/part-link/)，[Issue 278](https://github.com/w3c-cg/musicxml/issues/278) | `test/data/test_mxl4_part_link.musicxml`（`xlink:href="P1.musicxml"`；目标文件在上面的 `.mxl` 内） | 部分支持 | `Instrument.PartLinks[0]` 为 href `P1.musicxml`、instrument id `P1-I1`、group `parts`。`MXLHelper.readEntry` 从同一个 zip 读出标题 “MXL4 Part Only”。`load` 不会改去渲染分谱，调用方需要自己留着 zip。未压缩文件的画面仍是主乐谱，见 [evidence](evidence/test_mxl4_part_link.svg)。 | WP-1 |
| XML catalog | [Issue 259](https://github.com/w3c-cg/musicxml/issues/259) | 无。这是规范自带的 catalog，不是乐谱语义 | 不适用 | OSMD 不做 XSD 校验，不读取 catalog。 | — |
| container / sounds 的 DTD 改为 XSD；midixml DTD 弃用且不再提供 XSD | [Issue 401](https://github.com/w3c-cg/musicxml/issues/401) | 无。发行物，不是乐谱语义 | 不适用 | OSMD 不消费这些 DTD/XSD。与下面“已删除和弃用”中的同一条是同一件事。 | — |

## 4.0 新元素

| 条目 | 规范 | 测试文件 | 判定 | 证据 | 工作包 |
|---|---|---|---|---|---|
| `<assess>` | [assess](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/assess/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listen.musicxml` | 忽略但不报错 | `type="no"` 未进入音符模型。加载与渲染成功，无控制台错误。[evidence](evidence/test_mxl4_listen.svg) | WP-8 |
| `<bass-separator>` | [bass-separator](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/bass-separator/)，[Issue 307](https://github.com/w3c-cg/musicxml/issues/307) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | 分隔文本是 “on”，低音是 G。画出的第一行是 “bV6 on G”，不是默认的斜线。[evidence](evidence/test_mxl4_numeral.svg) | WP-4 |
| `<concert-score>` | [concert-score](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/concert-score/)，[Issue 39](https://github.com/w3c-cg/musicxml/issues/39) / [279](https://github.com/w3c-cg/musicxml/issues/279) | `test/data/test_mxl4_concert_score.musicxml` | 忽略但不报错 | 谱号路径与另一份高音谱号单簧管文件相同，乐器 `transpose` 为 0。没有音乐会调标记，也没有分谱视图。谱面文字只有 “Clarinet”。[evidence](evidence/test_mxl4_concert_score.svg) | WP-2 |
| `<first>` | [first](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/first/)，[Issue 283](https://github.com/w3c-cg/musicxml/issues/283) | `test/data/test_mxl4_swing.musicxml` | 忽略但不报错 | 方向文字 “Swing” 被画出来，那是 `<words>`，不是摇摆比例。表达式上没有 `first`/`second` 数值。[evidence](evidence/test_mxl4_swing.svg) | WP-8 |
| `<for-part>` | [for-part](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/for-part/)，[Issue 279](https://github.com/w3c-cg/musicxml/issues/279) | `test/data/test_mxl4_concert_score.musicxml` | 忽略但不报错 | 与 `<concert-score>` 同一文件。没有分谱移调或分谱谱号。 | WP-2 |
| `<instrument-change>` | [instrument-change](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/instrument-change/)，[Issue 293](https://github.com/w3c-cg/musicxml/issues/293) | `test/data/test_mxl4_instrument_change.musicxml` | 忽略但不报错 | 谱面有 “picc. cl.”，来自旁边的 `<words>`。子乐器仍是 Clarinet，MIDI 71，没有换成短笛单簧管。[evidence](evidence/test_mxl4_instrument_change.svg) | WP-8 |
| `<line-detail>` | [line-detail](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/line-detail/)，[Issue 305](https://github.com/w3c-cg/musicxml/issues/305) | `test/data/test_mxl4_line_detail.musicxml` | 忽略但不报错 | 五行谱线都在，笔画颜色只有 `#000000`，没有 `#AA0000`，也没有少一条线。同一文件里的 `staff-size` 见属性表。[evidence](evidence/test_mxl4_line_detail.svg) | WP-6 |
| `<listen>` | [listen](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/listen/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listen.musicxml` | 忽略但不报错 | 容器及其子元素都没有进入音符。渲染成功，无控制台错误。 | WP-8 |
| `<listening>` | [listening](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/listening/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listening.musicxml` | 忽略但不报错 | 谱面文字 “follow” 来自 `<words>`。没有 sync 的 type 或 latency。[evidence](evidence/test_mxl4_listening.svg) | WP-8 |
| 一个 `<note>` 内多个 `<instrument>` | [instrument](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/instrument/)，[Issue 277](https://github.com/w3c-cg/musicxml/issues/277) | `test/data/test_mxl4_multiple_instrument.musicxml` | 部分支持 | 声部上两个乐器都在（Oboe 1 / Oboe 2，MIDI 68）。音符的 `PlaybackInstrumentId` 只有最后一个 `P1-I2`。只画了一个符头。[evidence](evidence/test_mxl4_multiple_instrument.svg) | WP-8 |
| `<numeral>` | [numeral](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/numeral/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | 同一 `<harmony>` 里两个 numeral 都在。第一行 “bV6 on G”，下一行 “/ ii”。[evidence](evidence/test_mxl4_numeral.svg) | WP-4 |
| `<numeral-alter>` | [numeral-alter](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/numeral-alter/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | 测试值是 `0`，存在 `HarmonyChord.NumeralAlter` 且断言为 0。0 不印变音，画面上没有多出来的记号。非 0 的值用和弦变音记号画在级数右侧；`location="left"` 时画在左侧。 | WP-4 |
| `<numeral-fifths>` | [numeral-fifths](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/numeral-fifths/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | `-1` 存在模型里。`print-object="yes"` 时在级数前写出一个降号，SVG 文本以 “bV6” 开头。 | WP-4 |
| `<numeral-key>` | [numeral-key](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/numeral-key/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | `print-object="yes"`。调号按 `numeral-fifths` 画成升降号文字，不是单独的谱号图形。`print-object="no"` 时不画。 | WP-4 |
| `<numeral-mode>` | [numeral-mode](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/numeral-mode/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | `major` 存在模型里。大调不另写 “major”。其他调式会写在调号和级数之间。 | WP-4 |
| `<numeral-root>` | [numeral-root](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/numeral-root/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | 两个 root 的 `text` 都在：`V` 和 `ii`。SVG 里都能看到。 | WP-4 |
| `<other-listen>` | [other-listen](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/other-listen/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listen.musicxml` | 忽略但不报错 | `type="cue"`、文本 “breath” 不在模型或 SVG 中。 | WP-8 |
| `<other-listening>` | [other-listening](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/other-listening/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listening.musicxml` | 忽略但不报错 | `type="section"`、文本 “verse” 不在模型或 SVG 中。 | WP-8 |
| `<part-clef>` | [part-clef](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/part-clef/)，[Issue 55](https://github.com/w3c-cg/musicxml/issues/55) | `test/data/test_mxl4_concert_score.musicxml` | 忽略但不报错 | 文件要求分谱低音谱号（F4）。画出的谱号路径与高音谱号单簧管文件一致，不是低音谱号。 | WP-2 |
| `<part-link>` | 见打包表 | `test/data/test_mxl4_part_link.musicxml` | 部分支持 | 见打包表。元素定义在 Schema Additions，行为与打包是同一条。 | WP-1 |
| `<part-transpose>` | [part-transpose](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/part-transpose/)，[Issue 279](https://github.com/w3c-cg/musicxml/issues/279) | `test/data/test_mxl4_concert_score.musicxml` | 忽略但不报错 | `chromatic` 为 `-2`。乐器 `transpose` 仍是 0，`PlaybackTranspose` 没有变成 -2。写在谱上的 C 仍按 C 画。 | WP-2 |
| `<player>` | [player](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/player/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listen.musicxml` | 忽略但不报错 | `id="PL1"` 没有挂到乐器上。乐器只有 `P1-I1`。 | WP-8 |
| `<second>` | [second](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/second/)，[Issue 283](https://github.com/w3c-cg/musicxml/issues/283) | `test/data/test_mxl4_swing.musicxml` | 忽略但不报错 | 与 `<first>` 相同：没有摇摆比例字段。 | WP-8 |
| `<straight>` | [straight](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/straight/)，[Issue 283](https://github.com/w3c-cg/musicxml/issues/283) | `test/data/test_mxl4_swing_straight.musicxml` | 忽略但不报错 | 加载成功，表达式列表为空，没有 straight 标记。音符按谱面时值画，这是原有行为，不是读到了该元素。[evidence](evidence/test_mxl4_swing_straight.svg) | WP-8 |
| `<swing>` | [swing](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/swing/)，[Issue 283](https://github.com/w3c-cg/musicxml/issues/283) | `test/data/test_mxl4_swing.musicxml` | 忽略但不报错 | 容器没有被保存。谱面上的 “Swing” 是 `<words>`。 | WP-8 |
| `<swing-style>` | [swing-style](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/swing-style/)，[Issue 283](https://github.com/w3c-cg/musicxml/issues/283) | `test/data/test_mxl4_swing.musicxml` | 忽略但不报错 | “swing eighths” 不在 SVG 文本里。 | WP-8 |
| `<swing-type>` | [swing-type](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/swing-type/)，[Issue 283](https://github.com/w3c-cg/musicxml/issues/283) | `test/data/test_mxl4_swing.musicxml` | 忽略但不报错 | `eighth` 没有单独存储。 | WP-8 |
| `<sync>` | [sync](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/sync/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listening.musicxml` | 忽略但不报错 | `type="tempo"`、`latency="40"` 不在模型中。 | WP-8 |
| `<wait>` | [wait](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/wait/)，[Issue 294](https://github.com/w3c-cg/musicxml/issues/294) | `test/data/test_mxl4_listen.musicxml` | 忽略但不报错 | 等待点没有挂到音符上，也没有警告。 | WP-8 |

## 4.0 新属性

| 条目 | 规范 | 测试文件 | 判定 | 证据 | 工作包 |
|---|---|---|---|---|---|
| `<double above>` | [double](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/double/)，[Issue 368](https://github.com/w3c-cg/musicxml/issues/368) | `test/data/test_mxl4_double_above.musicxml` | 忽略但不报错 | `chromatic` 为 0 且被读到，`PlaybackTranspose` 为 0。`above="yes"` 没有把高八度重叠加进移调。谱面仍是 C4。[evidence](evidence/test_mxl4_double_above.svg) | WP-6 |
| `<bass arrangement>` | [bass](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/bass/)，[Issue 307](https://github.com/w3c-cg/musicxml/issues/307) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | 测试值是 `horizontal`：低音 “on G” 跟在 “bV6” 同一行。`vertical` 把低音放到下一行，`diagonal` 放到下一行并以 “/ ” 开头。 | WP-4 |
| `<harmony arrangement>` | [harmony](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/harmony/)，[Issue 307](https://github.com/w3c-cg/musicxml/issues/307) | `test/data/test_mxl4_numeral.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | 测试值是 `diagonal`：第二级 “ii” 在下一行，行首是 “/ ”。单元测试另断言 `horizontal` 为 “V / ii”，`vertical` 为 “V”、横线、“ii” 三行。 | WP-4 |
| `<repeat after-jump>` | [repeat](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/repeat/)，[Issue 322](https://github.com/w3c-cg/musicxml/issues/322) | `test/data/test_mxl4_repeat_after_jump.musicxml` | 忽略但不报错 | SVG 文本含 “D.C.”，来自反复文字。反复指令对象存在，但没有 `after-jump` 字段。反复括号本身是原有图形。[evidence](evidence/test_mxl4_repeat_after_jump.svg) | WP-6 |
| `<figured-bass halign>` | [figured-bass](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/figured-bass/)，[Issue 362](https://github.com/w3c-cg/musicxml/issues/362) | `test/data/test_mxl4_figured_bass.musicxml` | 不支持 | 数字 “6” 不在 SVG 文本里，也没有数字低音图形。对齐属性没有可观察的效果。[evidence](evidence/test_mxl4_figured_bass.svg) | WP-6 |
| `<figured-bass valign>` | 同上，[Issue 362](https://github.com/w3c-cg/musicxml/issues/362) | `test/data/test_mxl4_figured_bass.musicxml` | 不支持 | 与 `halign` 同一文件。没有数字可对齐。 | WP-6 |
| `<figured-bass placement>` | 同上，[Issue 336](https://github.com/w3c-cg/musicxml/issues/336) | `test/data/test_mxl4_figured_bass.musicxml` | 不支持 | `placement="below"` 没有产生谱表下方的数字。 | WP-6 |
| `<measure-numbering multiple-rest-always>` | [measure-numbering](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/measure-numbering/)，[Issue 310](https://github.com/w3c-cg/musicxml/issues/310) | `test/data/test_mxl4_measure_numbering.musicxml` | 忽略但不报错 | 多小节休止画出来了（`vf-multirest`），但没有一直显示在休止上的编号范围。SVG 文本只有一个 “3”，那是被保留的演奏小节上的原有小节号。[evidence](evidence/test_mxl4_measure_numbering.svg) | WP-5 |
| `<measure-numbering multiple-rest-range>` | 同上，[Issue 310](https://github.com/w3c-cg/musicxml/issues/310) | `test/data/test_mxl4_measure_numbering.musicxml` | 忽略但不报错 | 没有 “1-2” 这样的范围文本。 | WP-5 |
| `<measure-numbering staff>` | 同上，[Issue 23](https://github.com/w3c-cg/musicxml/issues/23) | `test/data/test_mxl4_measure_numbering.musicxml` | 忽略但不报错 | 单谱表，无法从画面上单独证明 `staff="1"` 被读取。源码不读 `measure-numbering`，模型里也没有该元素。 | WP-5 |
| `<measure-numbering system>` | 同上，[Issue 37](https://github.com/w3c-cg/musicxml/issues/37) | `test/data/test_mxl4_measure_numbering.musicxml` | 忽略但不报错 | 值是 `system`。画面不是“每个系统只在顶端标一次”的专门格式，只有原有的 “3”。 | WP-5 |
| `<release offset>` | [release](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/release/)，[Issue 203](https://github.com/w3c-cg/musicxml/issues/203) | `test/data/test_mxl4_bend_release.musicxml` | 忽略但不报错 | 与没有推弦的四音小节相比，没有多出来的推弦或回位曲线。`offset="0.5"` 没有图形。[evidence](evidence/test_mxl4_bend_release.svg) | WP-6 |
| `<metronome print-object>` | [metronome](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/metronome/)，[Issue 355](https://github.com/w3c-cg/musicxml/issues/355) | `test/data/test_mxl4_metronome_print_object.musicxml` | 完整支持 | SVG 文本只有 “ = 72”。`print-object="no"` 的 96 没有印出来，随后 `print-object="yes"` 的 72 印出来了。没有检查隐藏速度是否仍作为播放速度保存。[evidence](evidence/test_mxl4_metronome_print_object.svg) | WP-6 |
| `<staff-size scaling>` | [staff-size](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/staff-size/)，[Issue 305](https://github.com/w3c-cg/musicxml/issues/305) | `test/data/test_mxl4_line_detail.musicxml` | 忽略但不报错 | `scaling="80"`。谱表线间距仍是 10（y = 163.5 到 203.5），与未缩放的测试文件相同。 | WP-6 |
| `<bend shape>` | [bend](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/bend/)，[Issue 306](https://github.com/w3c-cg/musicxml/issues/306) | `test/data/test_mxl4_bend_release.musicxml` | 忽略但不报错 | `curved` 与 `angled` 都没有对应曲线。音符模型里没有推弦字段。 | WP-6 |
| `<effect smufl>` | [effect](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/effect/)，[Issue 403](https://github.com/w3c-cg/musicxml/issues/403) | `test/data/test_mxl4_percussion_smufl.musicxml` | 忽略但不报错 | `pictAnvil` 不在 SVG 文本或模型中。没有打击乐象形谱号替换。[evidence](evidence/test_mxl4_percussion_smufl.svg) | WP-6 |
| `<membrane smufl>` | [membrane](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/membrane/)，[Issue 403](https://github.com/w3c-cg/musicxml/issues/403) | `test/data/test_mxl4_percussion_smufl.musicxml` | 忽略但不报错 | `pictSnareDrum` 未出现。 | WP-6 |
| `<metal smufl>` | [metal](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/metal/)，[Issue 403](https://github.com/w3c-cg/musicxml/issues/403) | `test/data/test_mxl4_percussion_smufl.musicxml` | 忽略但不报错 | `pictCrashCymbals` 未出现。 | WP-6 |
| `<timpani smufl>` | [timpani](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/timpani/)，[Issue 403](https://github.com/w3c-cg/musicxml/issues/403) | `test/data/test_mxl4_percussion_smufl.musicxml` | 忽略但不报错 | `pictTimpani` 未出现。 | WP-6 |
| `<wood smufl>` | [wood](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/wood/)，[Issue 403](https://github.com/w3c-cg/musicxml/issues/403) | `test/data/test_mxl4_percussion_smufl.musicxml` | 忽略但不报错 | `pictWoodBlock` 未出现。 | WP-6 |
| `<wavy-line smufl>` | [wavy-line](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/wavy-line/)，[Issue 397](https://github.com/w3c-cg/musicxml/issues/397) | `test/data/test_mxl4_wavy_line_smufl.musicxml` | 部分支持 | 颤音波浪线有起点和终点，谱表上方有一条二次曲线波浪。表达式对象没有 `smufl` 字段，`wiggleTrill` 没有被选用；画出的是原有默认波浪。[evidence](evidence/test_mxl4_wavy_line_smufl.svg) | WP-6 |
| `<direction system>` | [direction](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/direction/)，[Issue 37](https://github.com/w3c-cg/musicxml/issues/37) | `test/data/test_mxl4_system_attribute.musicxml` | 忽略但不报错 | “Solo” 按原有方式画出。只有一个系统，看不出 `only-top` 与默认有什么差别，模型里也没有该属性。[evidence](evidence/test_mxl4_system_attribute.svg) | WP-6 |
| `<ending system>` | [ending](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/ending/)，[Issue 37](https://github.com/w3c-cg/musicxml/issues/37) | `test/data/test_mxl4_system_attribute.musicxml` | 报错 | 加载没有整体失败，SVG 里没有结尾编号 “1”。控制台 error：`RepetitionCalculator: calculateRepetitions TypeError: Cannot read properties of undefined (reading 'LastRepetitionInstructions')`。 | WP-6 |
| `<harmony system>` | [harmony](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/harmony/)，[Issue 37](https://github.com/w3c-cg/musicxml/issues/37) | `test/data/test_mxl4_system_attribute.musicxml` | 忽略但不报错 | 和弦文本 “C” 画出。`system` 没有单独存储；单系统文件上看不出 only-top。 | WP-6 |
| `<inversion text>` | [inversion](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/inversion/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_numeral.musicxml` | 忽略但不报错 | `text="6"` 不在 SVG 中。绘制结果只有 “V”。 | WP-4 |
| `<level type>` | [level](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/level/)，[Issue 288](https://github.com/w3c-cg/musicxml/issues/288) | `test/data/test_mxl4_level_type.musicxml` | 忽略但不报错 | 方向文字 “dolce” 画出。“source A” 和 `type="start"` 都没有出现。[evidence](evidence/test_mxl4_level_type.svg) | WP-6 |
| `<arpeggiate unbroken>` | [arpeggiate](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/arpeggiate/)，[Issue 281](https://github.com/w3c-cg/musicxml/issues/281) | `test/data/test_mxl4_arpeggiate_unbroken.musicxml` | 部分支持 | 和弦三个音的琶音类型都是 7（无方向）。修饰符路径里有琶音曲线，所以记号本身画了。琶音对象没有 `unbroken` 字段。[evidence](evidence/test_mxl4_arpeggiate_unbroken.svg) | WP-6 |

## 4.0 新取值

| 条目 | 规范 | 测试文件 | 判定 | 证据 | 工作包 |
|---|---|---|---|---|---|
| `smufl` 允许中世纪/文艺复兴与基辅方形记号名（`<accidental>`、`<accidental-mark>`、`<accidental-text>`、`<key-accidental>`） | [smufl-accidental-glyph-name](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/smufl-accidental-glyph-name/)，[Issue 330](https://github.com/w3c-cg/musicxml/issues/330) | `test/data/test_mxl4_smufl_accidental.musicxml` | 忽略但不报错 | 元素内容里的标准名被读取：音符 `AccidentalXml` 为 `flat`。`medRenSharp1`、`kievanAccidentalFlat`、`medRenFlat1`、`kievanAccidentalSharp`、`medRenNatura1` 都没有进入模型或 SVG 文本。[evidence](evidence/test_mxl4_smufl_accidental.svg) | WP-6 |
| `<credit-type>` 的 `part name` | [credit-type](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/credit-type/)，[Issue 282](https://github.com/w3c-cg/musicxml/issues/282) | `test/data/test_mxl4_credit_part_name.musicxml` | 忽略但不报错 | 原有的 `<part-name>` “Clarinet” 画在谱前。credit 文字 “Clarinet in B-flat” 不在 SVG 中。[evidence](evidence/test_mxl4_credit_part_name.svg) | WP-6 |
| `enclosure="inverted-bracket"` | [enclosure-shape](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/enclosure-shape/)，[Issue 308](https://github.com/w3c-cg/musicxml/issues/308) | `test/data/test_mxl4_enclosure_inverted_bracket.musicxml` | 忽略但不报错 | 文字 “INV” 画出。与普通四音小节相比没有多出的外框路径。[evidence](evidence/test_mxl4_enclosure_inverted_bracket.svg) | WP-6 |
| 八个新的 `<instrument-sound>` id | [Issue 289](https://github.com/w3c-cg/musicxml/issues/289)、[Issue 363](https://github.com/w3c-cg/musicxml/issues/363) | `test/data/test_mxl4_instrument_sounds.musicxml` | 忽略但不报错 | 八个 `<instrument-name>` 都在（Tin whistle、Tabor、Tamborim、Handchimes、Cavaquinho、D clarinet、G clarinet、Piccolo clarinet）。MIDI 是按名字猜测的：单簧管类为 71，其余为 0。模型里没有这些 sound id 字符串。[evidence](evidence/test_mxl4_instrument_sounds.svg) | WP-8 |
| `<ipa>` 使用 IPA 2015 / Unicode 13 | [ipa](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/ipa/)，[Issue 345](https://github.com/w3c-cg/musicxml/issues/345) | `test/data/test_mxl4_ipa.musicxml` | 忽略但不报错 | 歌词 “ah” 画出。IPA “əɓ” 不在 SVG 中。[evidence](evidence/test_mxl4_ipa.svg) | WP-8 |
| `number-level` 上限从 6 提到 16 | [number-level](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/number-level/)，[Issue 297](https://github.com/w3c-cg/musicxml/issues/297) | `test/data/test_mxl4_number_level_16.musicxml` | 不支持 | 连线 `number="16"`。四个音的 `slurs` 长度都是 0，SVG 没有连线。文件没有因此崩溃。[evidence](evidence/test_mxl4_number_level_16.svg) | WP-6 |
| 踏板 `type="discontinue"` | [pedal-type](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/pedal-type/)，[Issue 302](https://github.com/w3c-cg/musicxml/issues/302) | `test/data/test_mxl4_pedal_discontinue_resume.musicxml`；断言在 `PedalType_Test.ts` | 完整支持 | 两段踏板。第一段 `OpenEnd`，样式 `BRACKET_OPEN_END`：从 C4 的下钩连到 E4（x 约 203.7 到 257.8，y=228.25），E4 处没有抬起钩。[evidence](evidence/test_mxl4_pedal_discontinue_resume.svg) | WP-3 |
| 踏板 `type="resume"` | 同上，[Issue 335](https://github.com/w3c-cg/musicxml/issues/335) | `test/data/test_mxl4_pedal_discontinue_resume.musicxml`；断言在 `PedalType_Test.ts` | 完整支持 | 第二段 `OpenBegin`，样式 `BRACKET_OPEN_BEGIN`：从 G4 起笔（x 约 288.0），没有下钩，连到 C5 后有抬起钩（x 约 324.1）。与第一段之间断开。跨系统时中间各段仍在系统边界断开，最后一段是否抬起由结束类型决定。`line` 不是 `yes` 时仍画 `Ped.` / `*`。既有样本 `test_clef_change_on_invisible_note_norma_fantasy_1605` 里的 `resume` 现在画出没有下钩的线，页面高度从 992 变为 1046，音符和谱号不变。 | WP-3 |

## 4.0 已删除和弃用

| 条目 | 规范 | 测试文件 | 判定 | 证据 | 工作包 |
|---|---|---|---|---|---|
| DTD 弃用，改用 XSD | [Issue 401](https://github.com/w3c-cg/musicxml/issues/401) | 无 | 不适用 | 与打包表中的同一条规范发行物。 | — |
| 空的 `<multiple-rest>` 不再合法 | [multiple-rest](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/multiple-rest/)，[Issue 249](https://github.com/w3c-cg/musicxml/issues/249) | 合法文件 `test/data/test_mxl4_multiple_rest.musicxml`（内容 `2`）。空元素只在内存中探测 | 忽略但不报错 | 内容为 2 的文件画出 `vf-multirest`，其中有数字字形路径，加载无错误。[evidence](evidence/test_mxl4_multiple_rest.svg)。内存中的空元素：加载并渲染成功，一个休止，`SheetErrors` 为空，没有 `log.warn`。空文件不能通过 XSD，所以不放进仓库。WP-9 要求的警告目前没有。 | WP-9 |
| `<function>` 弃用 | [function](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/function/)，[Issue 295](https://github.com/w3c-cg/musicxml/issues/295) | `test/data/test_mxl4_function.musicxml`；断言在 `HarmonyNumeral_Test.ts` | 完整支持 | 不崩溃。文字 “V” 加上 `kind` 的 `text` “7”，画出 “V7”。加载时 `log.warn`，提示改用 `<numeral>`。[evidence](evidence/test_mxl4_function.svg) | WP-4、WP-9 |
| 谱号 `sign="none"` 弃用 | [clef-sign](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/clef-sign/)，[Issue 304](https://github.com/w3c-cg/musicxml/issues/304) | `test/data/test_mxl4_clef_sign_none.musicxml` | 部分支持 | 不抛错。小节 1 的 `SheetErrors` 为 `Unsupported clef. Using default.` 谱号路径与高音谱号同类，音符仍画出。这不是静默忽略，也还不是 WP-9 要求的 `log.warn`。[evidence](evidence/test_mxl4_clef_sign_none.svg) | WP-9 |

## 4.1 草案

4.1 仍是草案。本表没有新取值（41.md 写明 New Values: None）。

| 条目 | 规范 | 测试文件 | 判定 | 证据 | 工作包 |
|---|---|---|---|---|---|
| `<part-symbol>` 基数改为 0..N | [part-symbol](https://w3c.github.io/musicxml/musicxml-reference/elements/part-symbol/)，[Issue 572](https://github.com/w3c-cg/musicxml/issues/572) | `test/data/test_mxl4_part_symbol_multiple.musicxml`（`version="4.1"`） | 部分支持 | 三行谱表都画出来了（3 条 `staffline`、3 个谱号）。只有 1 个 `vf-brace`，没有括号。第 3 行单独的 bracket 没有出现。三行谱的默认花括号是原有行为。[evidence](evidence/test_mxl4_part_symbol_multiple.svg) | WP-7 |
| `<barline>` 内多个 `<coda>` / `<segno>` | [Issue 653](https://github.com/w3c-cg/musicxml/issues/653) | `test/data/test_mxl4_barline_coda_segno.musicxml` | 忽略但不报错 | 加载成功，无控制台错误。路径数量与没有这些记号的四音小节相同，SVG 文本里没有 coda/segno。两个记号都没有画出来。[evidence](evidence/test_mxl4_barline_coda_segno.svg) | WP-7 |
| `<accidental>` / `<key-accidental>` 基数改为 0..N | [Issue 605](https://github.com/w3c-cg/musicxml/issues/605) | `test/data/test_mxl4_multiple_accidentals.musicxml` | 部分支持 | 音符上先 `sharp` 再 `quarter-sharp`。模型里 `AccidentalXml` 只有 `quarter-sharp`，第一个升号丢掉了。调号上的两个 `key-accidental` 没有进入音符摘要，SVG 文本里也没有叠在一起的变音记号。[evidence](evidence/test_mxl4_multiple_accidentals.svg) | WP-7 |
| `<voice-direction>` / `<voice-directions>` | [Issue 662](https://github.com/w3c-cg/musicxml/issues/662) | `test/data/test_mxl4_voice_direction.musicxml` | 忽略但不报错 | 文件要求第 1 声部向下、第 2 声部向上，且没有 `<stem>`。实际符干是第 1 声部向上、第 2 声部向下，与 OSMD 的默认声部方向一致，与文件相反。没有报错。[evidence](evidence/test_mxl4_voice_direction.svg) | WP-7 |
| `<harmonic number>` | [Issue 529](https://github.com/w3c-cg/musicxml/issues/529) | `test/data/test_mxl4_harmonic_number.musicxml` | 忽略但不报错 | 加载成功。音符摘要里没有泛音数据，SVG 没有泛音圆圈或编号。路径数少于普通四音小节，没有多出来的记号。[evidence](evidence/test_mxl4_harmonic_number.svg) | WP-7 |
| `<score-timewise>` 弃用 | [Issue 483](https://github.com/w3c-cg/musicxml/issues/483) | `test/data/test_mxl4_score_timewise.musicxml` | 报错 | `load` 拒绝。控制台 error：`Could not parse MusicXML, no valid partwise element found`。异常文本：`OpenSheetMusicDisplay: Document is not a valid 'partwise' MusicXML`。没有说明这是已弃用的 timewise 格式，也没有转换后再加载。没有 SVG。 | WP-7 |

## 文档变更（不是 Schema 变更）

这些条目只改说明文字，没有新的元素、属性或取值，所以没有测试文件。

4.0：[Issue 353](https://github.com/w3c-cg/musicxml/issues/353)、[280](https://github.com/w3c-cg/musicxml/issues/280)、[62](https://github.com/w3c-cg/musicxml/issues/62)、[287](https://github.com/w3c-cg/musicxml/issues/287)、[204](https://github.com/w3c-cg/musicxml/issues/204)、[106](https://github.com/w3c-cg/musicxml/issues/106)、[53](https://github.com/w3c-cg/musicxml/issues/53)、[333](https://github.com/w3c-cg/musicxml/issues/333)、[43](https://github.com/w3c-cg/musicxml/issues/43)、[291](https://github.com/w3c-cg/musicxml/issues/291)、[352](https://github.com/w3c-cg/musicxml/issues/352)、[349](https://github.com/w3c-cg/musicxml/issues/349)、[146](https://github.com/w3c-cg/musicxml/issues/146)、[351](https://github.com/w3c-cg/musicxml/issues/351)、[261](https://github.com/w3c-cg/musicxml/issues/261)、[254](https://github.com/w3c-cg/musicxml/issues/254)、[382](https://github.com/w3c-cg/musicxml/issues/382)、[8](https://github.com/w3c-cg/musicxml/issues/8)（number-level 与 start-stop 两处说明）、[28](https://github.com/w3c-cg/musicxml/issues/28)、[311](https://github.com/w3c-cg/musicxml/issues/311)、[292](https://github.com/w3c-cg/musicxml/issues/292)、[205](https://github.com/w3c-cg/musicxml/issues/205)、[339](https://github.com/w3c-cg/musicxml/issues/339)。

4.1：Hello World 教程改为推荐 XSD；[Issue 663](https://github.com/w3c-cg/musicxml/issues/663)、[643](https://github.com/w3c-cg/musicxml/issues/643)、[681](https://github.com/w3c-cg/musicxml/issues/681)、[641](https://github.com/w3c-cg/musicxml/issues/641)、[664](https://github.com/w3c-cg/musicxml/issues/664)、[573](https://github.com/w3c-cg/musicxml/issues/573)。

## 汇总

上表一共 79 行。`<part-link>` 在打包和新元素里各有一行，DTD 换 XSD 在打包和弃用里各有一行，因为规范自己把它们写了两次。

| 判定 | 行数 | 说明 |
|---|---|---|
| 完整支持 | 14 | `<metronome print-object>`、多个 rootfile 时选中第一份 MusicXML、踏板 `discontinue` / `resume`，以及级数和弦的十行（含弃用的 `<function>`） |
| 部分支持 | 8 | 多乐器、波浪线、琶音、谱号 none、多声部符号、多个变音记号，以及两行 `<part-link>` |
| 不支持 | 4 | 数字低音的三个对齐属性，以及 number 16 的连线 |
| 忽略但不报错 | 48 | 文件能加载，新数据没有进入模型或画面，也没有控制台错误 |
| 报错 | 2 | `ending system` 的内部 TypeError、`score-timewise` 被拒绝 |
| 不适用 | 3 | XML catalog，以及 DTD 换 XSD（打包和弃用各一行，是同一件事） |

WP-1 已在 `feat/mxl4-packaging` 实现，WP-3 已在 `feat/mxl4-pedal` 实现，WP-4 已在 `feat/mxl4-numeral` 实现，三者都合并进 `release`。WP-2 与 WP-8 仍要先完成计划里的 H5（向上游开 issue 或 discussion）。把 `release` 设为 GitHub 默认分支仍要仓库所有者在设置里操作。
