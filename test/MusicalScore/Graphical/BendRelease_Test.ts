import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";
import { BendShape } from "../../../src/MusicalScore/VoiceData/NoteBend";
import { TabNote } from "../../../src/MusicalScore/VoiceData/TabNote";
import { SourceMeasure } from "../../../src/MusicalScore/VoiceData/SourceMeasure";

/**
 * MusicXML bend@shape and release@offset.
 * offset is in divisions. On a pitched staff the bend is drawn beside the note.
 * Tab staves keep VexFlow's bend and do not get this curve.
 */
describe("MusicXML 4.0 bend and release", () => {
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

    function notesOf(measure: SourceMeasure): Note[] {
        const notes: Note[] = [];
        for (const containerOfEntries of measure.VerticalSourceStaffEntryContainers) {
            for (const entry of containerOfEntries.StaffEntries) {
                if (!entry) {
                    continue;
                }
                for (const voiceEntry of entry.VoiceEntries) {
                    notes.push(...voiceEntry.Notes);
                }
            }
        }
        return notes;
    }

    /** Start, peak and end of one bend path. A quadratic uses its last point as the end. */
    function bendPoints(group: Element): { start: number[], peak: number[], end: number[] } {
        const path: SVGPathElement = group.querySelector("path");
        const command: string = path.getAttribute("d") ?? "";
        const numbers: number[] = command.match(/-?[0-9.]+/g).map((value: string): number => parseFloat(value));
        const start: number[] = [numbers[0], numbers[1]];
        const peak: number[] = [numbers[2], numbers[3]];
        const end: number[] = [numbers[numbers.length - 2], numbers[numbers.length - 1]];
        return { start, peak, end };
    }

    it("stores shape, semitone alter, and the release as a fraction of the note", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_bend_release.musicxml"));
        const notes: Note[] = notesOf(osmd.Sheet.SourceMeasures[0]);
        expect(notes[0].Bends.length).to.equal(2);
        expect(notes[0].Bends[0].Shape).to.equal(BendShape.Curved);
        expect(notes[0].Bends[0].Alter).to.equal(1);
        expect(notes[0].Bends[0].ReleaseFraction).to.equal(undefined);
        expect(notes[0].Bends[1].Shape).to.equal(BendShape.Angled);
        expect(notes[0].Bends[1].Alter).to.equal(-1);
        expect(notes[0].Bends[1].ReleaseFraction).to.equal(0.5);
        expect(notes[1].Bends.length, "a note without a bend stores none").to.equal(0);
    });

    it("draws a curved rise and an angled release on a pitched staff", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_bend_release.musicxml"));
        osmd.render();
        const groups: Element[] = Array.from(container.querySelectorAll("g[data-shape]"));
        expect(groups.length).to.equal(2);
        expect(groups[0].getAttribute("data-shape")).to.equal("curved");
        expect(groups[1].getAttribute("data-shape")).to.equal("angled");
        expect(groups[0].querySelector("path").getAttribute("d"), "the curved bend uses a quadratic").to.contain("Q");
        expect(groups[1].querySelector("path").getAttribute("d"), "the angled bend is straight segments").to.not.contain("Q");

        const curved: { start: number[], peak: number[], end: number[] } = bendPoints(groups[0]);
        expect(curved.start[1] - curved.end[1], "one semitone up is half a staff space").to.be.closeTo(5, 0.2);

        const angled: { start: number[], peak: number[], end: number[] } = bendPoints(groups[1]);
        expect(angled.peak[1] - angled.start[1], "one semitone down is half a staff space").to.be.closeTo(5, 0.2);
        const span: number = angled.end[0] - angled.start[0];
        expect((angled.peak[0] - angled.start[0]) / span, "the release is halfway through the bend").to.be.closeTo(0.5, 0.05);
        expect(angled.end[1], "the release returns to the written pitch").to.be.closeTo(angled.start[1], 0.2);
    });

    it("leaves tablature bends on the tab note and does not add a staff curve", async () => {
        await osmd.load(TestUtils.getScore("test_tabs_bend_and_release.musicxml"));
        osmd.render();
        let tabBend: TabNote = undefined;
        for (const measure of osmd.Sheet.SourceMeasures) {
            for (const note of notesOf(measure)) {
                if (note instanceof TabNote && note.BendArray.length > 0) {
                    tabBend = note;
                    break;
                }
            }
            if (tabBend) {
                break;
            }
        }
        expect(tabBend, "the tab sample still has a bend").to.not.equal(undefined);
        expect(tabBend.Bends.length).to.equal(tabBend.BendArray.length);
        expect(container.querySelectorAll("g[data-shape]").length, "tab staves keep VexFlow's bend").to.equal(0);
    });
});
