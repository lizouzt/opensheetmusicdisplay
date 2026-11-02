import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { Arpeggio, ArpeggioType } from "../../../src/MusicalScore/VoiceData/Arpeggio";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";

/**
 * MusicXML 4.0 arpeggiate@unbroken. The attribute is stored. The sign is the existing
 * one-staff arpeggio; it is not drawn across staves.
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
            expect(arpeggio().notes.length).to.equal(2);
            done();
        }).catch(done);
    });
});
