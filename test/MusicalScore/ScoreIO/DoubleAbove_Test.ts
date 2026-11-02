import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { NoteEnum } from "../../../src/Common/DataObjects/Pitch";
import { Instrument } from "../../../src/MusicalScore/Instrument";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";

/**
 * MusicXML 4.0 <double> adds a sounding note one octave from the written pitch.
 * The staff keeps the written notes.
 */
describe("MusicXML 4.0 octave doubling", () => {
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

    function writtenNotes(): Note[] {
        const notes: Note[] = [];
        for (const staffContainer of osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers) {
            for (const staffEntry of staffContainer.StaffEntries) {
                if (!staffEntry) {
                    continue;
                }
                for (const voiceEntry of staffEntry.VoiceEntries) {
                    for (const note of voiceEntry.Notes) {
                        if (!note.isRest()) {
                            notes.push(note);
                        }
                    }
                }
            }
        }
        return notes;
    }

    function scoreWithTranspose(transposeInner: string): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes>
      <divisions>1</divisions>
      <key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef>
      <transpose>${transposeInner}</transpose>
    </attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`;
    }

    it("keeps the written pitches and stores a doubling one octave above", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_double_above.musicxml"));
        const instrument: Instrument = osmd.Sheet.Instruments[0];
        expect(instrument.PlaybackTranspose).to.equal(0);
        expect(instrument.PlaybackDoubling).to.equal(12);

        const notes: Note[] = writtenNotes();
        expect(notes.map((note: Note): string => NoteEnum[note.Pitch.FundamentalNote] + note.Pitch.Octave)).to.deep.equal([
            "C1", "E1", "G1", "C2",
        ]);

        osmd.render();
        expect(container.querySelectorAll("g.vf-notehead").length, "the staff does not draw the sounding octave").to.equal(4);
    });

    it("stores a doubling one octave below when above is no", async () => {
        await osmd.load(scoreWithTranspose("<chromatic>0</chromatic><double above=\"no\"/>"));
        const instrument: Instrument = osmd.Sheet.Instruments[0];
        expect(instrument.PlaybackTranspose).to.equal(0);
        expect(instrument.PlaybackDoubling).to.equal(-12);
        expect(writtenNotes()[0].Pitch.FundamentalNote).to.equal(NoteEnum.C);
        expect(writtenNotes()[0].Pitch.Octave).to.equal(1);
    });

    it("doubles below when the above attribute is absent", async () => {
        await osmd.load(scoreWithTranspose("<chromatic>0</chromatic><double/>"));
        expect(osmd.Sheet.Instruments[0].PlaybackDoubling).to.equal(-12);
    });

    it("leaves doubling at 0 when the transpose has no double", async () => {
        await osmd.load(scoreWithTranspose("<chromatic>-2</chromatic>"));
        const instrument: Instrument = osmd.Sheet.Instruments[0];
        expect(instrument.PlaybackTranspose).to.equal(-2);
        expect(instrument.PlaybackDoubling).to.equal(0);
    });
});
