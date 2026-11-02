import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { StaffDivideType } from "../../../src/MusicalScore/VoiceData/StaffDivide";

/**
 * MusicXML staff-divide. The SMuFL divider glyphs are not in the font, so the sign is a plain arrow
 * at the right end of the measure that declares it.
 */
describe("MusicXML 4.0 staff divide", () => {
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

    function pathNumbers(group: Element): number[] {
        const command: string = group.querySelector("path")?.getAttribute("d") ?? "";
        return (command.match(/-?[0-9.]+/g) ?? []).map((value: string): number => parseFloat(value));
    }

    it("stores down and up-down and draws an arrow for each", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_staff_divide.musicxml"));
        expect(osmd.Sheet.SourceMeasures[0].getStaffDivide(0)).to.equal(StaffDivideType.Down);
        expect(osmd.Sheet.SourceMeasures[0].getStaffDivideColor(0)).to.equal("#AA0000");
        expect(osmd.Sheet.SourceMeasures[1].getStaffDivide(0)).to.equal(StaffDivideType.UpDown);
        expect(osmd.Sheet.SourceMeasures[1].getStaffDivideColor(0)).to.equal(undefined);
        osmd.render();

        const groups: Element[] = Array.from(container.querySelectorAll("g.vf-staffdivide"));
        expect(groups.length).to.equal(2);
        expect(groups[0].getAttribute("data-type")).to.equal("down");
        expect(groups[1].getAttribute("data-type")).to.equal("up-down");
        expect(groups[0].querySelector("path").getAttribute("stroke")).to.equal("#AA0000");
        expect(groups[1].querySelector("path").getAttribute("stroke")).to.equal("#000000");

        const downYs: number[] = pathNumbers(groups[0]).filter((_value: number, index: number): boolean => index % 2 === 1);
        expect(Math.max(...downYs) - downYs[0], "the down arrow tip is below its tail").to.be.greaterThan(10);

        const bothYs: number[] = pathNumbers(groups[1]).filter((_value: number, index: number): boolean => index % 2 === 1);
        const mid: number = (Math.max(...bothYs) + Math.min(...bothYs)) / 2;
        expect(bothYs.some((y: number): boolean => y < mid - 8), "up-down reaches above the staff middle").to.equal(true);
        expect(bothYs.some((y: number): boolean => y > mid + 8), "up-down reaches below the staff middle").to.equal(true);
    });

    it("draws nothing when the measure has no staff-divide", async () => {
        const xml: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef></attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
  </measure></part>
</score-partwise>`;
        await osmd.load(xml);
        expect(osmd.Sheet.SourceMeasures[0].getStaffDivide(0)).to.equal(undefined);
        osmd.render();
        expect(container.querySelectorAll("g.vf-staffdivide").length).to.equal(0);
    });
});
