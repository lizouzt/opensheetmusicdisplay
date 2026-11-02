import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { SourceMeasure } from "../../../src/MusicalScore/VoiceData/SourceMeasure";

/**
 * MusicXML 4.0 staff-size is a percentage of the default staff space.
 * scaling is the percentage applied to notes, clefs, and time signatures.
 * A staff without the element stays at the default 10px staff space.
 */
describe("MusicXML 4.0 staff size", () => {
    let container: HTMLElement;
    let osmd: OpenSheetMusicDisplay;

    beforeEach(() => {
        container = TestUtils.getDivElement(document);
        container.style.width = "1400px";
        osmd = TestUtils.createOpenSheetMusicDisplay(container);
    });
    afterEach(() => {
        osmd.clear();
        container.remove();
    });

    function boxWidth(selector: string): number {
        const element: SVGGraphicsElement = container.querySelector(selector);
        return element.getBBox().width;
    }

    function stemLength(): number {
        const path: SVGPathElement = container.querySelector("g.vf-stem path");
        const command: string = path.getAttribute("d") ?? "";
        const match: RegExpMatchArray = command.match(/M[0-9.]+ ([0-9.]+)L[0-9.]+ ([0-9.]+)/);
        return Math.abs(parseFloat(match[1]) - parseFloat(match[2]));
    }

    /** Top staff-line y of each staff, top staff first. */
    function staffTops(): number[] {
        const groups: SVGElement[] = Array.from(container.querySelectorAll("g.staffline"));
        const tops: number[] = [];
        for (const group of groups) {
            let top: number = Number.POSITIVE_INFINITY;
            const paths: SVGPathElement[] = Array.from(group.querySelectorAll("g.vf-measure path"));
            for (const path of paths) {
                const command: string = path.getAttribute("d") ?? "";
                const match: RegExpMatchArray = command.match(/^M([0-9.]+) ([0-9.]+)L([0-9.]+) ([0-9.]+)$/);
                if (!match || match[2] !== match[4]) {
                    continue;
                }
                if (parseFloat(match[3]) - parseFloat(match[1]) < 50) {
                    continue;
                }
                top = Math.min(top, parseFloat(match[2]));
            }
            if (top !== Number.POSITIVE_INFINITY) {
                tops.push(top);
            }
        }
        return tops;
    }

    function duo(staffSize: string, scaling: string = "100"): string {
        const details: string = staffSize.length > 0
            ? `<staff-details><staff-size scaling="${scaling}">${staffSize}</staff-size></staff-details>`
            : "";
        return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Upper</part-name></score-part>
    <score-part id="P2"><part-name>Lower</part-name></score-part>
  </part-list>
  <part id="P1"><measure number="1"><attributes>
    <divisions>1</divisions><key><fifths>1</fifths></key>
    <time><beats>4</beats><beat-type>4</beat-type></time>
    <clef><sign>G</sign><line>2</line></clef>${details}
  </attributes>
  <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
  </measure></part>
  <part id="P2"><measure number="1"><attributes>
    <divisions>1</divisions><key><fifths>0</fifths></key>
    <time><beats>4</beats><beat-type>4</beat-type></time>
    <clef><sign>G</sign><line>2</line></clef>
  </attributes>
  <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
  </measure></part>
</score-partwise>`;
    }

    it("stores the staff space and the notation scaling separately", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_line_detail.musicxml"));
        expect(osmd.Sheet.Instruments[0].Staves[0].StaffSpaceScale).to.equal(1.2);
        expect(osmd.Sheet.Instruments[0].Staves[0].NotationScale).to.equal(0.8);
    });

    it("uses the element value for notation when scaling is absent", async () => {
        const percent: string = "50";
        const source: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Cue</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes>
    <divisions>1</divisions><key><fifths>0</fifths></key>
    <time><beats>4</beats><beat-type>4</beat-type></time>
    <clef><sign>G</sign><line>2</line></clef>
    <staff-details><staff-size>${percent}</staff-size></staff-details>
  </attributes>
  <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`;
        await osmd.load(source);
        expect(osmd.Sheet.Instruments[0].Staves[0].StaffSpaceScale).to.equal(0.5);
        expect(osmd.Sheet.Instruments[0].Staves[0].NotationScale).to.equal(0.5);
    });

    it("draws notes, the clef, and the time signature at the scaling percentage", async () => {
        const score: Document = TestUtils.getScore("test_mxl4_line_detail.musicxml");
        const plain: Document = score.cloneNode(true) as Document;
        const sizeNode: Element = plain.getElementsByTagName("staff-size")[0];
        sizeNode.parentElement.removeChild(sizeNode);

        await osmd.load(score);
        osmd.render();
        const scaledNote: number = boxWidth("g.vf-notehead path");
        const scaledClef: number = boxWidth("g.vf-clef");
        const scaledTime: number = boxWidth("g.vf-timesignature");
        const scaledStem: number = stemLength();

        osmd.clear();
        await osmd.load(plain);
        osmd.render();
        expect(scaledNote / boxWidth("g.vf-notehead path"), "noteheads follow scaling 80").to.be.closeTo(0.8, 0.05);
        expect(scaledClef / boxWidth("g.vf-clef"), "the clef follows scaling 80").to.be.closeTo(0.8, 0.05);
        expect(scaledTime / boxWidth("g.vf-timesignature"), "the time signature follows scaling 80").to.be.closeTo(0.8, 0.05);
        expect(scaledStem / stemLength(), "stems follow scaling 80").to.be.closeTo(0.8, 0.05);

        osmd.clear();
        await osmd.load(duo("100", "80"));
        osmd.render();
        const scaledKey: number = boxWidth("g.vf-keysignature");
        osmd.clear();
        await osmd.load(duo(""));
        osmd.render();
        expect(scaledKey / boxWidth("g.vf-keysignature"), "the key signature follows scaling 80").to.be.closeTo(0.8, 0.05);
    });

    it("keeps an earlier staff-size when a later measure changes it", async () => {
        const large: string = "200";
        const normal: string = "100";
        const smallNotation: string = "50";
        const source: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1"><attributes>
      <divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef>
      <staff-details><staff-size scaling="${normal}">${large}</staff-size></staff-details>
    </attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
    <measure number="2"><attributes>
      <staff-details><staff-size scaling="${smallNotation}">${normal}</staff-size></staff-details>
    </attributes>
    <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
    <measure number="3">
    <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;
        await osmd.load(source);
        const firstMeasure: SourceMeasure = osmd.Sheet.SourceMeasures[0];
        const secondMeasure: SourceMeasure = osmd.Sheet.SourceMeasures[1];
        const thirdMeasure: SourceMeasure = osmd.Sheet.SourceMeasures[2];
        expect(firstMeasure.getStaffSpaceScale(0)).to.equal(2);
        expect(firstMeasure.getNotationScale(0)).to.equal(1);
        expect(secondMeasure.getStaffSpaceScale(0)).to.equal(1);
        expect(secondMeasure.getNotationScale(0)).to.equal(0.5);
        expect(thirdMeasure.getStaffSpaceScale(0), "a measure with no staff-size inherits the previous one").to.equal(1);
        expect(thirdMeasure.getNotationScale(0)).to.equal(0.5);
        osmd.render();
        const noteheads: SVGGraphicsElement[] = Array.from(container.querySelectorAll("g.vf-notehead path"));
        expect(noteheads[1].getBBox().width / noteheads[0].getBBox().width, "only the later note follows scaling 50").to.be.closeTo(0.5, 0.05);
        expect(noteheads[2].getBBox().width / noteheads[0].getBBox().width, "the inherited measure stays at scaling 50").to.be.closeTo(0.5, 0.05);
        const gaps: number[] = staffLineGaps();
        expect(gaps[0], "the first measure uses a 20px staff space").to.be.closeTo(20, 0.5);
        expect(gaps[1], "the second measure returns to a 10px staff space").to.be.closeTo(10, 0.5);
        expect(gaps[2], "the third measure keeps the 10px staff space").to.be.closeTo(10, 0.5);
    });

    /** Distance between the top two staff lines of each stave, in pixels. */
    function staffLineGaps(): number[] {
        const staves: SVGElement[] = Array.from(container.querySelectorAll("g.vf-measure"));
        const gaps: number[] = [];
        for (const stave of staves) {
            const ys: number[] = [];
            const paths: SVGPathElement[] = Array.from(stave.querySelectorAll("path"));
            for (const path of paths) {
                const command: string = path.getAttribute("d") ?? "";
                const match: RegExpMatchArray = command.match(/^M([0-9.]+) ([0-9.]+)L([0-9.]+) ([0-9.]+)$/);
                if (!match || match[2] !== match[4]) {
                    continue;
                }
                if (parseFloat(match[3]) - parseFloat(match[1]) < 50) {
                    continue;
                }
                ys.push(parseFloat(match[2]));
            }
            ys.sort((a: number, b: number): number => a - b);
            if (ys.length >= 2) {
                gaps.push(ys[1] - ys[0]);
            }
        }
        return gaps;
    }

    it("reserves a taller staff so the next staff moves down", async () => {
        await osmd.load(duo(""));
        osmd.render();
        const plain: number[] = staffTops();
        osmd.clear();
        await osmd.load(duo("200"));
        osmd.render();
        const enlarged: number[] = staffTops();
        expect(plain.length, "two staves").to.equal(2);
        expect(enlarged.length).to.equal(2);
        expect(enlarged[0], "the upper staff stays at the same top line").to.be.closeTo(plain[0], 1);
        expect(enlarged[1] - plain[1], "four extra staff spaces at 200 percent").to.be.closeTo(40, 1);
    });
});
