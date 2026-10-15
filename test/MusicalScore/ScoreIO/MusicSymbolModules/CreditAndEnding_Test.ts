import { expect } from "chai";
import log from "loglevel";
import { TestUtils } from "../../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { AlignmentType, RepetitionInstruction, RepetitionInstructionEnum } from "../../../../src/MusicalScore/VoiceData/Instructions/RepetitionInstruction";
import { Note } from "../../../../src/MusicalScore/VoiceData/Note";
import { Slur } from "../../../../src/MusicalScore/VoiceData/Expressions/ContinuousExpressions/Slur";
import { SourceMeasure } from "../../../../src/MusicalScore/VoiceData/SourceMeasure";
import { StaffLine } from "../../../../src/MusicalScore/Graphical/StaffLine";
import { GraphicalSlur } from "../../../../src/MusicalScore/Graphical/GraphicalSlur";

/**
 * MusicXML 4.0: a credit whose only type is "part name" replaces the matching part-name,
 * an ending that starts the piece is stored instead of throwing, and slur number 16 is drawn.
 */
describe("MusicXML 4.0 part-name credits, first-measure endings, and slur number 16", () => {
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

    function svgTexts(): string[] {
        return Array.from(container.querySelectorAll("text")).map((element: SVGTextElement): string => element.textContent ?? "");
    }

    it("replaces the part-name with a page credit of type part name", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_credit_part_name.musicxml"));
        expect(osmd.Sheet.Instruments[0].Name).to.equal("Clarinet in B-flat");
        osmd.render();
        expect(svgTexts()).to.include("Clarinet in B-flat");
    });

    it("draws an ending that starts the piece and stores its system attribute", async () => {
        const logged: string[] = [];
        const original: typeof log.error = log.error;
        log.error = (...args: unknown[]): void => {
            logged.push(args.map((arg: unknown): string => String(arg)).join(" "));
        };
        try {
            await osmd.load(TestUtils.getScore("test_mxl4_system_attribute.musicxml"));
        } finally {
            log.error = original;
        }
        expect(logged.join("\n"), "no crash reading the ending on measure 1").to.not.include("LastRepetitionInstructions");
        const measure: SourceMeasure = osmd.Sheet.SourceMeasures[0];
        const start: RepetitionInstruction = measure.FirstRepetitionInstructions.find(
            (instruction: RepetitionInstruction): boolean => instruction.type === RepetitionInstructionEnum.Ending);
        expect(start, "the volta start is stored").to.not.equal(undefined);
        expect(start.alignment).to.equal(AlignmentType.Begin);
        expect(start.SystemRelation).to.equal("only-top");
        expect(start.endingIndices).to.deep.equal([1]);
        osmd.render();
        expect(svgTexts(), "the volta number").to.include("1");
    });

    it("links and draws a slur numbered 16", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_number_level_16.musicxml"));
        const notes: Note[] = osmd.Sheet.Instruments[0].Voices[0].VoiceEntries.flatMap(voiceEntry => voiceEntry.Notes);
        expect(notes.map((note: Note): number => note.NoteSlurs.length)).to.deep.equal([1, 0, 0, 1]);
        const slur: Slur = notes[0].NoteSlurs[0];
        expect(slur.StartNote).to.equal(notes[0]);
        expect(slur.EndNote).to.equal(notes[3]);
        expect(notes[3].NoteSlurs[0]).to.equal(slur);
        osmd.render();
        const staffLine: StaffLine = osmd.GraphicSheet.MusicPages[0].MusicSystems[0].StaffLines[0];
        const graphicalSlurs: GraphicalSlur[] = staffLine.GraphicalSlurs;
        expect(graphicalSlurs.length).to.equal(1);
        expect(graphicalSlurs[0].slur).to.equal(slur);
        const path: SVGPathElement = (graphicalSlurs[0].SVGElement as SVGGElement).querySelector("path");
        expect(path, "a curve is drawn").to.not.equal(null);
        expect(path.getAttribute("d")).to.match(/[cC]/);
    });
});
