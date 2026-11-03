import { expect } from "chai";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../Util/TestUtils";
import { ClefEnum, ClefInstruction } from "../../../src/MusicalScore/VoiceData/Instructions/ClefInstruction";
import { AccidentalEnum, NoteEnum } from "../../../src/Common/DataObjects/Pitch";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";
import { SourceStaffEntry } from "../../../src/MusicalScore/VoiceData/SourceStaffEntry";
import { PartView } from "../../../src/MusicalScore/VoiceData/PartView";

/**
 * MusicXML concert-score. The default load keeps the written concert staff.
 * displayPartView, set before load, uses part-clef and part-transpose.
 */
describe("MusicXML concert score", () => {
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

    function clefInstruction(): ClefInstruction {
        const entries: SourceStaffEntry[] = osmd.Sheet.SourceMeasures[0].FirstInstructionsStaffEntries;
        for (const entry of entries) {
            for (const instruction of entry?.Instructions ?? []) {
                if (instruction instanceof ClefInstruction) {
                    return instruction;
                }
            }
        }
        return undefined;
    }

    function notes(): Note[] {
        return osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers.map(
            (containerEntry: { StaffEntries: { VoiceEntries: { Notes: Note[] }[] }[] }) =>
                containerEntry.StaffEntries[0].VoiceEntries[0].Notes[0]
        );
    }

    it("keeps concert pitch and the treble clef until the part view is requested", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_concert_score.musicxml"));
        expect(osmd.Sheet.IsConcertScore).to.equal(true);
        const view: PartView = osmd.Sheet.Instruments[0].getPartView(1);
        expect(view.clefSign).to.equal("F");
        expect(view.clefLine).to.equal(4);
        expect(view.diatonic).to.equal(-1);
        expect(view.chromatic).to.equal(-2);
        expect(osmd.Sheet.Instruments[0].PlaybackTranspose).to.equal(undefined);
        const clef: ClefInstruction = clefInstruction();
        expect(clef.ClefType).to.equal(ClefEnum.G);
        expect(clef.Line).to.equal(2);
        const written: Note[] = notes();
        expect(written.map((note: Note) => note.Pitch.FundamentalNote)).to.deep.equal([
            NoteEnum.C, NoteEnum.D, NoteEnum.E, NoteEnum.F,
        ]);
        expect(written.every((note: Note) => note.Pitch.Octave === 1 && note.Pitch.Accidental === AccidentalEnum.NONE)).to.equal(true);
        osmd.render();
    });

    it("draws the part in bass clef, two semitones down, spelled from the diatonic step", async () => {
        osmd.setOptions({ displayPartView: true });
        await osmd.load(TestUtils.getScore("test_mxl4_concert_score.musicxml"));
        const clef: ClefInstruction = clefInstruction();
        expect(clef.ClefType).to.equal(ClefEnum.F);
        expect(clef.Line).to.equal(4);
        expect(osmd.Sheet.Instruments[0].PlaybackTranspose).to.equal(2);
        const written: Note[] = notes();
        expect(written.map((note: Note) => note.Pitch.FundamentalNote)).to.deep.equal([
            NoteEnum.B, NoteEnum.C, NoteEnum.D, NoteEnum.E,
        ]);
        expect(written.map((note: Note) => note.Pitch.Octave)).to.deep.equal([0, 1, 1, 1]);
        expect(written.map((note: Note) => note.Pitch.Accidental)).to.deep.equal([
            AccidentalEnum.FLAT, AccidentalEnum.NONE, AccidentalEnum.NONE, AccidentalEnum.FLAT,
        ]);
        osmd.render();
        const clefPath: Element = container.querySelector("g.vf-clef path");
        expect(clefPath).to.not.equal(null);
    });
});
