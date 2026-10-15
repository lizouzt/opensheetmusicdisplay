import { expect } from "chai";
import log from "loglevel";
import { OpenSheetMusicDisplay } from "../../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../../Util/TestUtils";
import { ChordSymbolContainer, HarmonyArrangement, HarmonyChord } from "../../../../src/MusicalScore/VoiceData/ChordSymbolContainer";
import { ChordSymbolEnum } from "../../../../src/MusicalScore/VoiceData/ChordSymbolContainer";
import { KeyInstruction } from "../../../../src/MusicalScore/VoiceData/Instructions/KeyInstruction";
import { NoteEnum } from "../../../../src/Common/DataObjects/Pitch";
import { MusicSheet } from "../../../../src/MusicalScore/MusicSheet";
import { SourceMeasure } from "../../../../src/MusicalScore/VoiceData/SourceMeasure";
import { GraphicalChordSymbolContainer } from "../../../../src/MusicalScore/Graphical/GraphicalChordSymbolContainer";

describe("Harmony numerals", () => {
    function chordContainers(sheet: MusicSheet): ChordSymbolContainer[] {
        const chords: ChordSymbolContainer[] = [];
        for (const measure of sheet.SourceMeasures) {
            const sourceMeasure: SourceMeasure = measure;
            for (const column of sourceMeasure.VerticalSourceStaffEntryContainers) {
                for (const entry of column?.StaffEntries ?? []) {
                    for (const chord of entry?.ChordContainers ?? []) {
                        if (chord) {
                            chords.push(chord);
                        }
                    }
                }
            }
        }
        return chords;
    }

    function drawnText(osmd: OpenSheetMusicDisplay): string {
        osmd.render();
        const labels: string[] = osmd.GraphicSheet.MeasureList
            .flatMap(measures => measures[0].staffEntries)
            .flatMap((entry): GraphicalChordSymbolContainer[] => entry.graphicalChordContainers)
            .map((chord: GraphicalChordSymbolContainer) => chord.GraphicalLabel.Label.text);
        return labels.join("\n");
    }

    it("draws stacked numerals diagonally, with inversion text and a bass separator", async () => {
        const osmd: OpenSheetMusicDisplay = TestUtils.createOpenSheetMusicDisplay(TestUtils.getDivElement(document));
        await osmd.load(TestUtils.getScore("test_mxl4_numeral.musicxml"));
        const chord: ChordSymbolContainer = chordContainers(osmd.Sheet)[0];
        expect(chord.Arrangement).to.equal(HarmonyArrangement.Diagonal);
        expect(chord.NumeralText).to.equal("V");
        expect(chord.HarmonyChords.map(part => part.NumeralText)).to.deep.equal(["V", "ii"]);
        const first: HarmonyChord = chord.HarmonyChords[0];
        expect(first.NumeralAlter).to.equal(0);
        expect(first.NumeralFifths).to.equal(-1);
        expect(first.NumeralMode).to.equal("major");
        expect(first.NumeralKeyPrint).to.equal(true);
        expect(first.InversionText).to.equal("6");
        expect(first.BassSeparator).to.equal("on");
        expect(first.BassArrangement).to.equal(HarmonyArrangement.Horizontal);
        expect(first.BassPitch.FundamentalNote).to.equal(NoteEnum.G);

        expect(drawnText(osmd)).to.equal("bV6 on G\n/ ii");
        osmd.clear();
    });

    it("still draws a deprecated function, and warns", async () => {
        const warnings: string[] = [];
        const original: typeof log.warn = log.warn;
        log.warn = ((...args: unknown[]) => {
            warnings.push(args.map(arg => String(arg)).join(" "));
        }) as typeof log.warn;
        const osmd: OpenSheetMusicDisplay = TestUtils.createOpenSheetMusicDisplay(TestUtils.getDivElement(document));
        try {
            await osmd.load(TestUtils.getScore("test_mxl4_function.musicxml"));
            const chord: ChordSymbolContainer = chordContainers(osmd.Sheet)[0];
            expect(chord.FunctionText).to.equal("V");
            expect(drawnText(osmd)).to.equal("V7");
            expect(warnings.some(warning => warning.includes("<function>") && warning.includes("deprecated"))).to.equal(true);
        } finally {
            log.warn = original;
            osmd.clear();
        }
    });

    it("places the next numeral to the right, or below a horizontal line", () => {
        const container: ChordSymbolContainer = new ChordSymbolContainer(undefined, ChordSymbolEnum.none, undefined, [], undefined);
        const first: HarmonyChord = new HarmonyChord();
        first.NumeralText = "V";
        const second: HarmonyChord = new HarmonyChord();
        second.NumeralText = "ii";
        container.HarmonyChords = [first, second];
        const key: KeyInstruction = new KeyInstruction();

        container.Arrangement = HarmonyArrangement.Horizontal;
        expect(ChordSymbolContainer.calculateChordText(container, 0, key)).to.equal("V / ii");
        container.Arrangement = HarmonyArrangement.Vertical;
        expect(ChordSymbolContainer.calculateChordText(container, 0, key)).to.equal("V\n—\nii");
    });
});
