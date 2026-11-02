import { expect } from "chai";
import log from "loglevel";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../Util/TestUtils";
import { PartSymbol } from "../../../src/MusicalScore/VoiceData/PartSymbol";
import { KeyInstruction } from "../../../src/MusicalScore/VoiceData/Instructions/KeyInstruction";
import { AccidentalEnum, NoteEnum } from "../../../src/Common/DataObjects/Pitch";
import { StemDirectionType, VoiceEntry } from "../../../src/MusicalScore/VoiceData/VoiceEntry";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";
import { VexFlowGraphicalNote } from "../../../src/MusicalScore/Graphical/VexFlow/VexFlowGraphicalNote";
import { SourceStaffEntry } from "../../../src/MusicalScore/VoiceData/SourceStaffEntry";
import { AbstractNotationInstruction } from "../../../src/MusicalScore/VoiceData/Instructions/AbstractNotationInstruction";

/**
 * MusicXML 4.1 draft: several part symbols, repeated barline signs, stacked accidentals,
 * voice stem defaults, numbered harmonics, and deprecated timewise scores.
 */
describe("MusicXML 4.1 draft", () => {
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

    function pathYs(element: Element): number[] {
        const ys: number[] = [];
        element.querySelectorAll("path").forEach((path: Element) => {
            const numbers: string[] = path.getAttribute("d")?.match(/-?\d+\.?\d*/g) ?? [];
            for (let i: number = 1; i < numbers.length; i += 2) {
                ys.push(parseFloat(numbers[i]));
            }
        });
        return ys;
    }

    it("braces staves 1-2 and brackets staff 3", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_part_symbol_multiple.musicxml"));
        const symbols: PartSymbol[] = osmd.Sheet.Instruments[0].PartSymbols;
        expect(symbols.map((symbol: PartSymbol) => symbol.kind)).to.deep.equal(["brace", "bracket"]);
        expect(symbols[0].topStaff).to.equal(1);
        expect(symbols[0].bottomStaff).to.equal(2);
        expect(symbols[1].topStaff).to.equal(3);
        expect(symbols[1].bottomStaff).to.equal(3);
        osmd.render();
        const braces: NodeListOf<Element> = container.querySelectorAll("g.vf-brace");
        const brackets: NodeListOf<Element> = container.querySelectorAll("g.vf-bracket");
        expect(braces.length).to.equal(1);
        expect(brackets.length).to.equal(1);
        const staves: NodeListOf<Element> = container.querySelectorAll("g.staffline");
        expect(staves.length).to.equal(3);
        const thirdStaffTop: number = Math.min(...pathYs(staves[2]));
        expect(Math.max(...pathYs(braces[0]))).to.be.lessThan(thirdStaffTop);
    });

    it("draws two segnos and two codas on the right barline", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_barline_coda_segno.musicxml"));
        expect(osmd.Sheet.SourceMeasures[0].BarlineSymbols).to.deep.equal(["segno", "segno", "coda", "coda"]);
        osmd.render();
        const group: Element = container.querySelector("g.vf-barlinesymbol");
        expect(group.getAttribute("data-kinds")).to.equal("segno,segno,coda,coda");
        expect(group.querySelectorAll("path").length).to.be.greaterThan(0);
    });

    it("keeps both note accidentals and both key accidentals", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_multiple_accidentals.musicxml"));
        const note: Note = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0].StaffEntries[0].VoiceEntries[0].Notes[0];
        expect(note.AccidentalXmls).to.deep.equal(["sharp", "quarter-sharp"]);
        expect(note.Pitch.Accidental).to.equal(AccidentalEnum.THREEQUARTERSSHARP);
        const key: KeyInstruction = osmd.Sheet.SourceMeasures[0].FirstInstructionsStaffEntries[0].Instructions
            .find((instruction: AbstractNotationInstruction) => instruction instanceof KeyInstruction) as KeyInstruction;
        expect(key.NonTraditional).to.equal(true);
        expect(key.KeyAccidentals.map((mark: { accidental: string }) => mark.accidental)).to.deep.equal(["sharp", "quarter-sharp"]);
        expect(key.KeyAccidentals.every((mark: { step: string }) => mark.step === "F")).to.equal(true);
        osmd.render();
        const graphicalNote: VexFlowGraphicalNote = osmd.GraphicSheet.MusicPages[0].MusicSystems[0]
            .StaffLines[0].Measures[0].staffEntries[0].graphicalVoiceEntries[0].notes[0] as VexFlowGraphicalNote;
        const modifiers: { getAttribute?: (name: string) => string }[] = (graphicalNote.vfnote[0] as any).modifiers;
        const accidentalCount: number = modifiers.filter((modifier: { getAttribute?: (name: string) => string }) => {
            return modifier.getAttribute?.("type") === "Accidental";
        }).length;
        expect(accidentalCount).to.equal(2);
        expect(container.querySelector("g.vf-keyaccidental").getAttribute("data-accidentals")).to.equal("sharp,quarter-sharp");
    });

    it("defaults voice 1 stems down and voice 2 stems up", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_voice_direction.musicxml"));
        osmd.render();
        const entry: SourceStaffEntry = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0].StaffEntries[0];
        const voice1: VoiceEntry = entry.VoiceEntries.find((voiceEntry: VoiceEntry) => voiceEntry.ParentVoice.VoiceId === 1);
        const voice2: VoiceEntry = entry.VoiceEntries.find((voiceEntry: VoiceEntry) => voiceEntry.ParentVoice.VoiceId === 2);
        expect(voice1.StemDirection).to.equal(StemDirectionType.Down);
        expect(voice2.StemDirection).to.equal(StemDirectionType.Up);
    });

    it("stores and draws a natural harmonic 1 and an artificial harmonic 2", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_harmonic_number.musicxml"));
        const notes: Note[] = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0].StaffEntries[0].VoiceEntries[0].Notes;
        expect(notes[0].Harmonic).to.deep.equal({ number: "1", kind: "natural" });
        expect(notes[1].Harmonic).to.deep.equal({ number: "2", kind: "artificial" });
        osmd.render();
        const groups: NodeListOf<Element> = container.querySelectorAll("g.vf-harmonic");
        expect(groups.length).to.equal(2);
        expect(groups[0].getAttribute("data-number")).to.equal("1");
        expect(groups[0].getAttribute("data-kind")).to.equal("natural");
        expect(groups[1].getAttribute("data-number")).to.equal("2");
        expect(groups[1].getAttribute("data-kind")).to.equal("artificial");
        expect(container.textContent).to.include("1");
        expect(container.textContent).to.include("2");
    });

    it("converts a deprecated timewise score and warns", async () => {
        const messages: string[] = [];
        const original: typeof log.warn = log.warn;
        log.warn = ((message: string): void => {
            messages.push(String(message));
        }) as typeof log.warn;
        try {
            await osmd.load(TestUtils.getScore("test_mxl4_score_timewise.musicxml"));
            osmd.render();
        } finally {
            log.warn = original;
        }
        expect(messages.some((message: string) => message.includes("score-timewise") && message.includes("deprecated"))).to.equal(true);
        const note: Note = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0].StaffEntries[0].VoiceEntries[0].Notes[0];
        expect(note.Pitch.FundamentalNote).to.equal(NoteEnum.C);
        expect(container.querySelector("svg")).to.not.equal(null);
    });
});
