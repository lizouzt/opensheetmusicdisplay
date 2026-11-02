import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { Arpeggio, ArpeggioType } from "../../../src/MusicalScore/VoiceData/Arpeggio";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";
import { StaffLine } from "../../../src/MusicalScore/Graphical/StaffLine";
import { unitInPixels } from "../../../src/MusicalScore/Graphical/VexFlow/VexFlowMusicSheetDrawer";

/**
 * MusicXML 4.0 arpeggiate@unbroken. The attribute is stored. A sign on one staff stays
 * on that staff. When both staves of a part carry the same number, the squiggle continues
 * through the gap.
 */
describe("MusicXML 4.0 arpeggio unbroken", () => {
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

    function arpeggio(): Arpeggio {
        const note: Note = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0]
            .StaffEntries[0].VoiceEntries[0].Notes[0];
        return note.Arpeggio;
    }

    it("stores unbroken on the chord and still draws the sign", (done: Mocha.Done) => {
        osmd.load(TestUtils.getScore("test_mxl4_arpeggiate_unbroken.musicxml")).then(() => {
            osmd.render();
            const sign: Arpeggio = arpeggio();
            expect(sign.Unbroken).to.equal(true);
            expect(sign.Number).to.equal(1);
            expect(sign.type).to.equal(ArpeggioType.ARPEGGIO_DIRECTIONLESS);
            expect(sign.notes.length).to.equal(3);
            expect(container.querySelectorAll("g.vf-stavenote path").length).to.be.greaterThan(0);
            done();
        }).catch(done);
    });

    it("leaves unbroken false when the attribute is absent", (done: Mocha.Done) => {
        const xml: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef></attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type>
      <notations><arpeggiate/></notations></note>
    <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type>
      <notations><arpeggiate/></notations></note>
  </measure></part>
</score-partwise>`;
        osmd.load(xml).then(() => {
            expect(arpeggio().Unbroken).to.equal(false);
            expect(arpeggio().Number).to.equal(1);
            expect(arpeggio().notes.length).to.equal(2);
            done();
        }).catch(done);
    });

    it("continues the squiggle across the two staves of one part", (done: Mocha.Done) => {
        osmd.load(TestUtils.getScore("test_mxl4_arpeggiate_unbroken_staves.musicxml")).then(() => {
            osmd.render();
            const upper: Arpeggio = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0]
                .StaffEntries[0].VoiceEntries[0].Notes[0].Arpeggio;
            const lower: Arpeggio = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0]
                .StaffEntries[1].VoiceEntries[0].Notes[0].Arpeggio;
            expect(upper).to.not.equal(lower);
            expect(upper.Unbroken).to.equal(true);
            expect(lower.Unbroken).to.equal(true);
            expect(upper.Number).to.equal(1);
            expect(lower.Number).to.equal(1);
            expect(upper.notes.length).to.equal(3);
            expect(lower.notes.length).to.equal(3);

            const later: Arpeggio = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[1]
                .StaffEntries[0].VoiceEntries[0].Notes[0].Arpeggio;
            expect(later.Unbroken).to.equal(false);

            const bridges: Element[] = Array.from(container.querySelectorAll("g.vf-unbrokenarpeggio"));
            expect(bridges.length, "only the unbroken chord continues across the gap").to.equal(1);
            const upperLine: StaffLine = osmd.GraphicSheet.MusicPages[0].MusicSystems[0].StaffLines[0];
            const lowerLine: StaffLine = osmd.GraphicSheet.MusicPages[0].MusicSystems[0].StaffLines[1];
            const upperBottom: number = staffLineY(upperLine, upperLine.StaffLines.length - 1) * unitInPixels;
            const lowerTop: number = staffLineY(lowerLine, 0) * unitInPixels;
            const origins: number[] = glyphOrigins(bridges[0]);
            expect(origins.length).to.be.greaterThan(0);
            expect(origins.some((y: number): boolean => y > upperBottom && y < lowerTop),
                "at least one squiggle sits in the gap").to.equal(true);
            done();
        }).catch(done);
    });
});

function staffLineY(staffLine: StaffLine, index: number): number {
    return staffLine.PositionAndShape.AbsolutePosition.y + staffLine.StaffLines[index].Start.y;
}

/** Y of each squiggle glyph, taken from the first point of its path. */
function glyphOrigins(group: Element): number[] {
    return Array.from(group.querySelectorAll("path")).map((path: Element): number => {
        const numbers: number[] = (path.getAttribute("d") ?? "").match(/-?[0-9.]+/g).map((value: string): number => parseFloat(value));
        return numbers[1];
    });
}
