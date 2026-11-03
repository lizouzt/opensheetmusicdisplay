
<!--img alt="Brought to you by PhonicScore" src="https://phonicscore.com/neu/wp-content/uploads/2018/06/phonicscore_brown.svg"/-->


# OpenSheetMusicDisplay 的 MusicXML 4 fork
<!--# <img alt="OSMD logo" align="center" src="https://opensheetmusicdisplay.org/wp-content/uploads/2016/05/OSMD_3_icon_only.svg"/> OpenSheetMusicDisplay (OSMD)-->
<!--- # <img alt="OSMD logo" align="center" src="https://opensheetmusicdisplay.org/wp-content/uploads/sites/2/2021/02/OSMD_logo_box.svg" height="40"/> OpenSheetMusicDisplay (OSMD) -->

<!--table style="table-layout: fixed; width:100%; border: none; border-collapse: collapse;">
  <tr>
    <td><img id="osmdlogo" alt="OpenSheetMusicDisplay (OSMD)" src="https://opensheetmusicdisplay.org/wp-content/uploads/2016/05/OSMD_3_icon_only.svg"/></td>
   <td style="text-align: center"><h1>OpenSheetMusicDisplay (OSMD)</h1></td>
    <td></td>
  </tr>
</table-->

本仓库是 [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay)（OSMD，PhonicScore）的 fork。它在上游引擎上补上 MusicXML 4.0 和 4.1 草案的读取与绘制，改动只放在本仓库的 `release` 分支，不作为官方 OSMD 发布。

上游基线是 `develop` 的 `a308225e`（2.2.1-dev）。那个版本渲染 MusicXML 3.x，4.0 / 4.1 新增的元素和属性大多没有读。本 fork 补上的是这些缺口，例如：`.mxl` 里多个 rootfile 时选取第一份 MusicXML、`part-link`、音乐会调与分谱视图、`<measure-numbering>`、踏板 `discontinue` / `resume`、级数和弦、`<line-detail>`、`<staff-size>`、`<staff-divide>`，以及 4.1 草案的多次 `part-symbol`、叠置变音、`voice-direction` 和 timewise 转 partwise。听音、摇摆、演奏者、乐器声响、换乐器和 IPA 只写入模型。逐条结论在 [支持矩阵](fork-docs/musicxml4-support-matrix.md)：80 行里完整支持 59、部分支持 16、不支持 0。没有重写渲染引擎，也没有更换 VexFlow。

`develop` 只跟随上游 `develop`。这些 4.0 / 4.1 改动不再向原项目提交拉取请求。

`test/data` 和 `demo/` 中的乐谱样例来自上游 OSMD 仓库，仅用于测试。它们的版权归各自权利人所有，不属于本项目的发布内容，也不在本项目许可证的覆盖范围内。

Scores in `test/data` and `demo/` come from the upstream OSMD repository and are kept for tests only. Copyright stays with the rightsholders. Those scores are not published content of this project and are not covered by this project's license.

公开 demo、npm 包和我们发布的图片只使用 [`fork-docs/release-samples.csv`](fork-docs/release-samples.csv) 列出的乐谱。上游样例的视觉回归结果只作文字说明。对外发布的截图只来自本 fork 的 `test_mxl4_*` 文件。公开 demo 由 [`fork-demo/`](fork-demo/README.md) 构建，不部署上游 `demo/`，也不使用把整个 `test/data` 挂到 `/samples` 的开发服务器。`package.json` 的包名仍是上游的 `opensheetmusicdisplay`，本 fork 还没有单独的 npm 包名。

从下一节起是上游 README 的原文，讲的是 PhonicScore 的 OSMD。其中的演示站、赞助和联系方式属于原项目。

## About OSMD

<img title="How OSMD can look in the browser&#xA;(Mockup, OSMD on its own does not support playback)" src="https://user-images.githubusercontent.com/33069673/106186552-bd191300-61a4-11eb-8814-07019fcf1d5b.png" style="max-width: 100%; max-height: 100vh; width: auto; margin: auto;">

OpenSheetMusicDisplay renders MusicXML sheet music in the browser. It is the missing link between [MusicXML](https://www.musicxml.com/) and [VexFlow](https://www.vexflow.com/). Built upon many years of experience in both sheet music interactivity and engraving, it is the perfect solution for app developers seeking to build digital sheet music services.

[MusicXML](https://www.musicxml.com/) is the de facto standard for exchanging sheet music between music software.<br>
[VexFlow](https://www.vexflow.com/) is widely used for rendering sheet music. It features an extensive library of musical elements, but each measure and symbol has to be created and positioned by hand in Javascript.

OpenSheetMusicDisplay brings the two together and offers an open source turnkey solution for your digital sheet music project.

## Demo

Try the [Public Demo](https://opensheetmusicdisplay.github.io/demo/) to see what OSMD can do.<br>
[Learn more about the demo](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo) and OSMD in [the OSMD Wiki](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki).

Developers can also run a [local development demo (see Wiki)](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Debugging-(VSCode)):

<img title="Local OSMD Development/Debug demo" alt="Local OSMD Developer Demo" src="https://user-images.githubusercontent.com/33069673/106189263-5695f400-61a8-11eb-901f-aafc853af497.png" style="max-width: 100%; max-height: 100vh; width: auto; margin: auto;">


## Key Features

* Displays MusicXML sheet music in a browser(less) environment (Javascript, Typescript, server-side: headless/browserless NodeJS script)
* *Soon: Audio Playback (work in progress, early access build available for [Github sponsors](https://github.com/sponsors/opensheetmusicdisplay))*
* Uses [Vexflow](https://www.vexflow.com/) for rendering and (partly) layout
* Parses most MusicXML tags and integrates it into an accessible and modifiable data model (e.g. to change a note's color)
* Offers many options ([OSMDOptions](https://opensheetmusicdisplay.github.io/classdoc/classes/OSMDOptions.html) / [EngravingRules](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/master/src/MusicalScore/Graphical/EngravingRules.ts)): Page Format, Font Family, Positioning, not rendering certain elements like the title or lyrics, etc.
* Allows modification of the displayed score, like hiding parts or instruments, hiding instrument names, title or composer, a more compact layout, or coloring notes
* Outputs SVG or PNG, also via nodejs script in the command line, completely headless/browserless (e.g. for server-side rendering - see generateImages script)
* Written in [Typescript](https://www.typescriptlang.org/) with complete type information, 100% compatible with Javascript (minified build is .js)
* Can display tablature (guitar tabs) from MusicXML, including effects like bends and glissandi. Can be combined with treble clef.
<img src="https://user-images.githubusercontent.com/33069673/127324371-b7c5f137-a1b8-4127-95b0-38e6a185c906.png" height="130">


<p align="left">
  <img title="OSMD in the Browser"  src="https://user-images.githubusercontent.com/33069673/106321958-64fe1180-6275-11eb-8632-3b22beaa0829.jpg" width="66.4%">
&nbsp;
  <img title="OSMD on Mobile (or server-side rendering)" src="https://user-images.githubusercontent.com/33069673/106321963-67606b80-6275-11eb-8fdd-2acf273586df.jpg" width="25%">
</p>

## Limitations

Not all MusicXML tags and attributes are (fully) supported:
* Advanced Pedal marks (down/up brackets and lift wedge currently in early access for sponsors, "Ped." and "*" signs supported)
* Some attributes like special drums noteheads/glyphs

Also, **OSMD is a renderer, not a full interactive sheet music editor.** Rendering takes some time for long scores, and you can't easily/quickly move notes, place new notes, etc.<br>
There are however limited editing features like making notes invisible, coloring, hiding some instruments/staffs, not showing key or time signatures, and so on, see IOSMDOptions and EngravingRules<br>
(You can manipulate the SVG nodes for instant changes like note re-coloring, see [Exploring the Demo | Wiki](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo))

## How to Use OSMD

* Available as [NPM module](https://www.npmjs.com/package/opensheetmusicdisplay), can be used with plain javascript or module managers like webpack
* [Getting Started: Detailed instructions in our Wiki](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Getting-Started)
* If you have further technical questions, you can:
  * [Leave a comment in our Discussions section](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/discussions/950) (especially for questions of understanding)
  * [Browse through our Issues](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues?&q=is%3Aissue)
  * [Open a new issue](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/new/choose) (may be moved to Discussions).

## Sponsor OSMD and get early access to the audio player and more

<a href="https://github.com/sponsors/opensheetmusicdisplay/" alt="OSMD on Github Sponsors">
<!--img src="https://user-images.githubusercontent.com/33069673/104042293-99ccfa80-51da-11eb-9dc9-fac075a33224.png" height="200" alt="OSMD on Github Sponsors"--><img src="https://user-images.githubusercontent.com/33069673/109203612-a9150100-77a4-11eb-9b91-6692850dccab.png" style="max-width: 100%; max-height: 100vh; width: auto; margin: auto;">
</a><br>

It would be great if free software were sustainable on its own. But to keep on improving and developing OpenSheetMusicDisplay we need your support. Your monthly sponsorship subscription - especially if you are already actively using OSMD - would mean everything to us - it’s a stable way of enabling us to continue our work, and improve and expand OSMD.<br>
Features already available in early access:
* OSMD Audio Player
* Native modules + example projects (React Native, Kotlin/Android, Swift/iOS) - NEW!
* Jianpu Display (Numbered Musical Notation), with playback

Features in the making, potentially available in future:

* Annotations (Add custom text, music symbols, etc. to the score and export to and import from XML)
* and more (we're always working on OSMD improvements or additional features, just look at our release history / [changelog](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/blob/develop/CHANGELOG.md)!)

Besides the early access features, you can get other perks like a personal postcard from the team in Vienna. Check them out at [our GitHub sponsors page](https://github.com/sponsors/opensheetmusicdisplay).

<p align="left">
  <img title="OSMD Sponsor perks like this t-shirt" src="https://user-images.githubusercontent.com/33069673/106322343-084f2680-6276-11eb-985b-3aaa483db206.jpg" width="35%">
&nbsp;
  <img title="OSMD button sponsor perk" src="https://user-images.githubusercontent.com/33069673/106320576-5a427d00-6273-11eb-96b0-d2c7c4b19927.jpg" width="28.5%">
</p>

And there are other ways to contribute to the community - we plan on starting a blog and newsletter, and sharing our knowledge. We encourage our sponsors to bring up their desired features and pitch blog post ideas.

Though we highly recommend the sponsor route, you can also donate via Paypal:<br>

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FPHCYVV2HH8VU)<br>
Any support is highly appreciated.

## About Us

OSMD is made by [Phonicscore](https://phonicscore.com/) - a music-tech company based in Vienna. We create solutions for musicians, sheet music publishers, app developers, music stores and researchers:

* Open source software
* Sheet Music Rendering Software
* Native & web apps: [PracticeBird for iOS](https://itunes.apple.com/us/app/practice-bird-pro/id1253492926?ls=1&mt=8) and [Android](https://play.google.com/store/apps/details?id=phonicscore.phonicscore_lite)

Our mission is to provide state of the art software solutions for building MusicXML apps and to include the community in a constant thrive for improvement. We want to take away the pain of building music software from scratch and offer a shortcut when it comes to building your next MusicXML sheet music application.

We also want to thank [our Github Contributors](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/graphs/contributors), who show that with open source many people come together to not only share but improve software.

## Get In Touch

<a href="https://twitter.com/osmdengine"><img title="OSMD on Twitter" src="https://img.shields.io/twitter/url?label=%40osmdengine&style=social&url=https%3A%2F%2Ftwitter.com%2Fosmdengine" align="center"></a> <a alt="OSMD on Facebook" href="https://www.facebook.com/opensheetmusicdisplay/"><img title="OSMD on Facebook" src="https://img.shields.io/twitter/url?label=Facebook&logo=facebook&style=social&url=https%3A%2F%2Fwww.facebook.com%2Fopensheetmusicdisplay%2F" align="center"></a> <a href="https://www.instagram.com/open_sheet_music_display/"><img title="OSMD on Instagram" src="https://img.shields.io/twitter/url?label=Instagram&logo=instagram&style=social&url=https%3A%2F%2Fwww.instagram.com%2Fopen_sheet_music_display%2F" align="center"></a> <a href="https://fwd.osmd.org/discord"><img title="OSMD Discord (chat) Server" src="https://img.shields.io/twitter/url?label=Discord&logo=discord&style=social&url=https%3A%2F%2Ffwd.osmd.org%2Fdiscord" align="center"></a>
<!-- the social button images were created via https://shields.io, search twitter in the top search bar, click on twitter url, set named logo e.g. to facebook -->

To contact us directly, you can:
* Use the [Contact form on opensheetmusicdisplay.org](https://opensheetmusicdisplay.org/contact/) to send a mail
* Send a mail to support@opensheetmusicdisplay.org
* Leave a (public) comment in our [Discussions section](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/discussions)
* [Join our Discord (chat) Server](https://fwd.osmd.org/discord)
* [Join the chat on Gitter](https://gitter.im/opensheetmusicdisplay/opensheetmusicdisplay).
