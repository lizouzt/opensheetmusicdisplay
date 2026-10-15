import { expect } from "chai";
import { OpenSheetMusicDisplay } from "../../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../../Util/TestUtils";
import { MusicSystem } from "../../../../src/MusicalScore/Graphical/MusicSystem";
import { GraphicalLabel } from "../../../../src/MusicalScore/Graphical/GraphicalLabel";

describe("Measure numbering", () => {
    function score(numbering: string, measures: string): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">${measures.replace("NUMBERING", numbering)}</part>
</score-partwise>`;
    }

    const attributes: string = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
    const note: string = "<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>";

    async function labels(xml: string, interval?: number): Promise<string[]> {
        const div: HTMLElement = TestUtils.getDivElement(document);
        div.style.width = "1400px";
        const osmd: OpenSheetMusicDisplay = TestUtils.createOpenSheetMusicDisplay(div);
        await osmd.load(xml);
        if (interval !== undefined) {
            osmd.EngravingRules.MeasureNumberLabelOffset = interval;
        }
        osmd.render();
        const systems: MusicSystem[] = osmd.GraphicSheet.MusicPages.flatMap(page => page.MusicSystems);
        const texts: string[] = systems.flatMap(system => system.MeasureNumberLabels.map((label: GraphicalLabel) => label.Label.text));
        osmd.clear();
        return texts;
    }

    it("numbers each system, on staff 1, and shows the multiple rest as a range", async () => {
        const div: HTMLElement = TestUtils.getDivElement(document);
        div.style.width = "1400px";
        const osmd: OpenSheetMusicDisplay = TestUtils.createOpenSheetMusicDisplay(div);
        await osmd.load(TestUtils.getScore("test_mxl4_measure_numbering.musicxml"));
        expect(osmd.EngravingRules.RenderMeasureNumbersOnlyAtSystemStart).to.equal(true);
        expect(osmd.EngravingRules.MeasureNumberReferenceStaff).to.equal(1);
        expect(osmd.EngravingRules.MeasureNumberSystemRelation).to.equal("only-top");
        expect(osmd.EngravingRules.MeasureNumberMultipleRestAlways).to.equal(true);
        expect(osmd.EngravingRules.MeasureNumberMultipleRestRange).to.equal(true);
        osmd.render();
        const texts: string[] = osmd.GraphicSheet.MusicPages
            .flatMap(page => page.MusicSystems)
            .flatMap(system => system.MeasureNumberLabels.map((label: GraphicalLabel) => label.Label.text));
        expect(texts).to.deep.equal(["1-2"]);
        osmd.clear();
    });

    it("draws a number on every measure when the value is measure", async () => {
        const xml: string = score(
            "<print><measure-numbering>measure</measure-numbering></print>",
            `<measure number="1">NUMBERING${attributes}${note}</measure>
             <measure number="2">${note}</measure><measure number="3">${note}</measure>`
        );
        expect(await labels(xml, 1)).to.deep.equal(["2", "3"]);
    });

    it("draws no numbers when the value is none", async () => {
        const xml: string = score(
            "<print><measure-numbering>none</measure-numbering></print>",
            `<measure number="1">NUMBERING${attributes}${note}</measure><measure number="2">${note}</measure>`
        );
        expect(await labels(xml, 1)).to.deep.equal([]);
    });

    it("keeps the first part's system numbers when a later part says none", async () => {
        const xml: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Top</part-name></score-part>
    <score-part id="P2"><part-name>Lower</part-name></score-part>
  </part-list>
  <part id="P1"><measure number="1"><print><measure-numbering>system</measure-numbering></print>
    ${attributes}${note}</measure></part>
  <part id="P2"><measure number="1"><print><measure-numbering>none</measure-numbering></print>
    ${attributes}${note}</measure></part>
</score-partwise>`;
        const div: HTMLElement = TestUtils.getDivElement(document);
        const osmd: OpenSheetMusicDisplay = TestUtils.createOpenSheetMusicDisplay(div);
        await osmd.load(xml);
        expect(osmd.EngravingRules.RenderMeasureNumbers).to.equal(true);
        expect(osmd.EngravingRules.RenderMeasureNumbersOnlyAtSystemStart).to.equal(true);
        osmd.clear();
    });

    async function pianoLabelYs(numbering: string): Promise<number[]> {
        const xml: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <print><measure-numbering ${numbering}>measure</measure-numbering></print>
      <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type><staff>1</staff></note>
      <backup><duration>4</duration></backup>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>2</voice><type>whole</type><staff>2</staff></note>
    </measure>
    <measure number="2">
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type><staff>1</staff></note>
      <backup><duration>4</duration></backup>
      <note><pitch><step>D</step><octave>3</octave></pitch><duration>4</duration><voice>2</voice><type>whole</type><staff>2</staff></note>
    </measure>
  </part>
</score-partwise>`;
        const texts: string[] = [];
        const div: HTMLElement = TestUtils.getDivElement(document);
        div.style.width = "1400px";
        const osmd: OpenSheetMusicDisplay = TestUtils.createOpenSheetMusicDisplay(div);
        await osmd.load(xml);
        osmd.EngravingRules.MeasureNumberLabelOffset = 1;
        osmd.render();
        const measureLabels: GraphicalLabel[] = osmd.GraphicSheet.MusicPages
            .flatMap(page => page.MusicSystems)
            .flatMap(system => system.MeasureNumberLabels);
        const ys: number[] = measureLabels.map((label: GraphicalLabel) => label.PositionAndShape.AbsolutePosition.y);
        measureLabels.forEach((label: GraphicalLabel) => texts.push(label.Label.text));
        expect(texts.every((text: string) => text === "2")).to.equal(true);
        osmd.clear();
        return ys;
    }

    it("puts the number on the named staff, and on both when the system relation says also", async () => {
        const top: number[] = await pianoLabelYs("system=\"only-top\" staff=\"1\"");
        const staff2: number[] = await pianoLabelYs("system=\"none\" staff=\"2\"");
        const bottom: number[] = await pianoLabelYs("system=\"only-bottom\" staff=\"1\"");
        const both: number[] = await pianoLabelYs("system=\"also-top\" staff=\"2\"");
        expect(top).to.have.length(1);
        expect(staff2).to.have.length(1);
        expect(bottom).to.have.length(1);
        expect(staff2[0]).to.be.greaterThan(top[0] + 2);
        expect(bottom[0]).to.be.greaterThan(top[0] + 2);
        expect(both).to.have.length(2);
        expect(Math.max(...both)).to.be.greaterThan(Math.min(...both) + 2);
    });

    it("keeps the multiple-rest number when the rest does not start the system", async () => {
        const measures: string = `<measure number="1">NUMBERING${attributes}${note}</measure>
            <measure number="2"><attributes><measure-style><multiple-rest>2</multiple-rest></measure-style></attributes>
            <note><rest/><duration>4</duration><type>whole</type></note></measure>
            <measure number="3"><note><rest/><duration>4</duration><type>whole</type></note></measure>`;
        const always: string = "<print><measure-numbering multiple-rest-always=\"yes\" multiple-rest-range=\"yes\">system</measure-numbering></print>";
        const notAlways: string = "<print><measure-numbering multiple-rest-always=\"no\" multiple-rest-range=\"yes\">system</measure-numbering></print>";
        expect(await labels(score(always, measures))).to.deep.equal(["2-3"]);
        expect(await labels(score(notAlways, measures))).to.deep.equal([]);
    });
});
