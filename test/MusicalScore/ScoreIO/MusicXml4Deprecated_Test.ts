import { expect } from "chai";
import log from "loglevel";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../Util/TestUtils";
import { ClefEnum, ClefInstruction } from "../../../src/MusicalScore/VoiceData/Instructions/ClefInstruction";
import { SourceStaffEntry } from "../../../src/MusicalScore/VoiceData/SourceStaffEntry";

/**
 * MusicXML 4.0 removed or deprecated constructs. Parsing must not throw.
 * clef sign "none" still falls back to the treble clef and also log.warns.
 * An empty or non-numeric multiple-rest is ignored, with log.warn. The legal file stays a two-measure rest.
 */
describe("MusicXML 4.0 deprecated constructs", () => {
    let container: HTMLElement;
    let osmd: OpenSheetMusicDisplay;
    let warnings: string[];
    let originalWarn: typeof log.warn;

    beforeEach(() => {
        container = TestUtils.getDivElement(document);
        container.style.width = "1400px";
        osmd = TestUtils.createOpenSheetMusicDisplay(container);
        warnings = [];
        originalWarn = log.warn;
        log.warn = ((...args: unknown[]) => {
            warnings.push(args.map((arg: unknown) => String(arg)).join(" "));
        }) as typeof log.warn;
    });
    afterEach(() => {
        log.warn = originalWarn;
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

    it("warns for a deprecated clef sign none and still uses the treble clef", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_clef_sign_none.musicxml"));
        const clef: ClefInstruction = clefInstruction();
        expect(clef.ClefType).to.equal(ClefEnum.G);
        expect(clef.Line).to.equal(2);
        expect(osmd.Sheet.SheetErrors.measureErrors[1].join(" ")).to.include("Unsupported clef. Using default.");
        expect(warnings.some((warning: string) => warning.includes("none") && warning.includes("deprecated"))).to.equal(true);
        osmd.render();
        expect(container.querySelectorAll("g.vf-clef").length).to.equal(1);
        expect(container.querySelectorAll("g.vf-notehead").length).to.equal(4);
    });

    it("still draws a multiple rest when the element contains a positive integer", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_multiple_rest.musicxml"));
        expect(osmd.Sheet.SourceMeasures[0].multipleRestMeasures).to.equal(2);
        expect(warnings.some((warning: string) => warning.includes("multiple-rest"))).to.equal(false);
        osmd.render();
        expect(container.querySelectorAll("g.vf-multirest").length).to.equal(1);
    });

    it("warns and does not collapse rests when multiple-rest is empty or not an integer", async () => {
        const emptyScore: Document = TestUtils.getScore("test_mxl4_multiple_rest.musicxml").cloneNode(true) as Document;
        emptyScore.getElementsByTagName("multiple-rest")[0].textContent = "";
        await osmd.load(emptyScore);
        expect(osmd.Sheet.SourceMeasures[0].multipleRestMeasures).to.equal(undefined);
        expect(osmd.Sheet.SheetErrors.measureErrors[1] ?? []).to.deep.equal([]);
        expect(warnings.some((warning: string) => warning.includes("<multiple-rest>"))).to.equal(true);
        osmd.render();
        expect(container.querySelectorAll("g.vf-multirest").length).to.equal(0);

        warnings = [];
        osmd.clear();
        const invalidScore: Document = TestUtils.getScore("test_mxl4_multiple_rest.musicxml").cloneNode(true) as Document;
        invalidScore.getElementsByTagName("multiple-rest")[0].textContent = "two";
        await osmd.load(invalidScore);
        expect(osmd.Sheet.SourceMeasures[0].multipleRestMeasures).to.equal(undefined);
        expect(warnings.some((warning: string) => warning.includes("<multiple-rest>"))).to.equal(true);
    });
});
