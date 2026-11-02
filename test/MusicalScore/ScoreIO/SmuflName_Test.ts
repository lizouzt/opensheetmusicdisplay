import { expect } from "chai";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../Util/TestUtils";
import { KeyInstruction } from "../../../src/MusicalScore/VoiceData/Instructions/KeyInstruction";
import { SourceStaffEntry } from "../../../src/MusicalScore/VoiceData/SourceStaffEntry";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";
import { VoiceEntry } from "../../../src/MusicalScore/VoiceData/VoiceEntry";
import { WavyLine } from "../../../src/MusicalScore/VoiceData/Expressions/ContinuousExpressions/WavyLine";
import { MultiExpression } from "../../../src/MusicalScore/VoiceData/Expressions/MultiExpression";
import { PercussionPictogram } from "../../../src/MusicalScore/VoiceData/PercussionPictogram";

/**
 * MusicXML 4.0 smufl names are stored. The font does not contain wiggleTrill, the pictograms,
 * or the medieval and Kievan accidentals, so the drawn marks stay the previous ones.
 */
describe("MusicXML 4.0 smufl names", () => {
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

    function firstNotes(): Note[] {
        const notes: Note[] = [];
        for (const column of osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers) {
            for (const entry of column?.StaffEntries ?? []) {
                for (const voice of entry?.VoiceEntries ?? []) {
                    const voiceEntry: VoiceEntry = voice;
                    notes.push(...voiceEntry.Notes);
                }
            }
        }
        return notes;
    }

    it("stores a wavy-line smufl name and still draws the default wave", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_wavy_line_smufl.musicxml"));
        const waves: WavyLine[] = [];
        for (const staff of osmd.Sheet.SourceMeasures[0].StaffLinkedExpressions) {
            for (const expression of staff) {
                const multi: MultiExpression = expression;
                if (multi?.WavyLineStart) {
                    waves.push(multi.WavyLineStart);
                }
            }
        }
        expect(waves.length).to.equal(1);
        expect(waves[0].Smufl).to.equal("wiggleTrill");
        osmd.render();
        expect(container.innerHTML.includes("wiggleTrill")).to.equal(false);
        expect(container.querySelectorAll("g.vf-notehead").length).to.equal(4);
    });

    it("stores percussion pictogram names without drawing them", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_percussion_smufl.musicxml"));
        const pictograms: PercussionPictogram[] = osmd.Sheet.SourceMeasures[0].PercussionPictograms;
        expect(pictograms.map((pictogram: PercussionPictogram) => pictogram.Kind)).to.deep.equal(
            ["effect", "membrane", "metal", "wood", "timpani"]
        );
        expect(pictograms.map((pictogram: PercussionPictogram) => pictogram.Smufl)).to.deep.equal(
            ["pictAnvil", "pictSnareDrum", "pictCrashCymbals", "pictWoodBlock", "pictTimpani"]
        );
        expect(pictograms[0].Text).to.equal("anvil");
        expect(pictograms[4].Text).to.equal("");
        osmd.render();
        expect(container.innerHTML.includes("pictAnvil")).to.equal(false);
        expect(container.innerHTML.includes("pictTimpani")).to.equal(false);
        expect(container.querySelectorAll("g.vf-notehead").length).to.equal(4);
    });

    it("stores medieval and Kievan smufl names and still uses the standard accidental", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_smufl_accidental.musicxml"));
        let key: KeyInstruction;
        for (const entry of osmd.Sheet.SourceMeasures[0].FirstInstructionsStaffEntries) {
            const staffEntry: SourceStaffEntry = entry;
            for (const instruction of staffEntry?.Instructions ?? []) {
                if (instruction instanceof KeyInstruction) {
                    key = instruction;
                }
            }
        }
        expect(key.AccidentalSmufl).to.deep.equal(["medRenSharp1", "kievanAccidentalFlat"]);
        const note: Note = firstNotes()[0];
        expect(note.Pitch.AccidentalXml).to.equal("flat");
        expect(note.AccidentalSmufl).to.equal("medRenFlat1");
        expect(note.NoteheadAccidentalSmufl).to.equal("kievanAccidentalSharp");
        expect(note.NoteheadAccidentalText).to.equal("sharp");
        expect(note.ParentVoiceEntry.OrnamentContainer.AccidentalBelowSmufl).to.equal("medRenNatura1");
        osmd.render();
        expect(container.innerHTML.includes("medRenFlat1")).to.equal(false);
        expect(container.innerHTML.includes("kievanAccidentalSharp")).to.equal(false);
        expect(container.querySelectorAll("g.vf-notehead").length).to.equal(4);
    });
});
