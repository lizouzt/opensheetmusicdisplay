import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { StaffLineDetail } from "../../../src/MusicalScore/VoiceData/Staff";

/**
 * MusicXML 4.0 <line-detail>: line 1 is the bottom line. A hidden line is not drawn.
 * Width is tenths; one staff space is 40 tenths and 10 pixels, so width 4 is a 1px stroke.
 */
describe("MusicXML 4.0 staff line details", () => {
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

    /** Horizontal staff-line paths, as y and stroke. */
    function staffLinePaths(): { y: number, stroke: string, width: string }[] {
        const paths: SVGPathElement[] = Array.from(container.querySelectorAll("g.staffline path"));
        const lines: { y: number, stroke: string, width: string }[] = [];
        for (const path of paths) {
            const command: string = path.getAttribute("d") ?? "";
            const match: RegExpMatchArray = command.match(/^M([0-9.]+) ([0-9.]+)L([0-9.]+) ([0-9.]+)$/);
            if (!match || match[2] !== match[4]) {
                continue;
            }
            const x0: number = parseFloat(match[1]);
            const x1: number = parseFloat(match[3]);
            if (x1 - x0 < 50) {
                continue;
            }
            lines.push({
                y: parseFloat(match[2]),
                stroke: (path.getAttribute("stroke") ?? "").toLowerCase(),
                width: path.getAttribute("stroke-width") ?? "",
            });
        }
        return lines;
    }

    it("hides the bottom line and colors the middle line", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_line_detail.musicxml"));
        const details: StaffLineDetail[] = osmd.Sheet.Instruments[0].Staves[0].LineDetails;
        const bottom: StaffLineDetail = details.find((detail: StaffLineDetail): boolean => detail.Line === 1);
        const middle: StaffLineDetail = details.find((detail: StaffLineDetail): boolean => detail.Line === 3);
        expect(bottom.Visible, "line 1 print-object no").to.equal(false);
        expect(bottom.WidthTenths).to.equal(2);
        expect(middle.Visible).to.equal(true);
        expect(middle.Color).to.equal("#AA0000");
        expect(middle.WidthTenths).to.equal(4);

        osmd.render();
        const lines: { y: number, stroke: string, width: string }[] = staffLinePaths();
        expect(lines.length, "the bottom line is not drawn").to.equal(4);
        const ys: number[] = lines.map((line: { y: number }): number => line.y).sort((a: number, b: number): number => a - b);
        expect(ys[3] - ys[0], "the remaining lines still span three staff spaces").to.equal(30);
        const colored: { y: number, stroke: string, width: string } = lines.find(
            (line: { stroke: string }): boolean => line.stroke === "#aa0000");
        expect(colored, "line 3 is red").to.not.equal(undefined);
        expect(colored.width, "4 tenths is 1px").to.equal("1");
        expect(colored.y, "line 3 is the middle of the five-line staff").to.equal(ys[0] + 20);
    });
});
