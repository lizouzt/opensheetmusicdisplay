import { expect } from "chai";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../Util/TestUtils";
import { FiguredBass } from "../../../src/MusicalScore/VoiceData/FiguredBass";
import { StaffLine } from "../../../src/MusicalScore/Graphical/StaffLine";
import { unitInPixels } from "../../../src/MusicalScore/Graphical/VexFlow/VexFlowMusicSheetDrawer";

/**
 * MusicXML figured bass. halign, valign and placement move the figure block.
 * The block stays below the staff unless placement is above.
 */
describe("MusicXML 4.0 figured bass", () => {
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

    function figuredBass(): FiguredBass {
        return osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0].StaffEntries[0].FiguredBass[0];
    }

    function figureElement(): Element {
        return container.querySelector("g.vf-figuredbass, text.vf-figuredbass");
    }

    function figureY(): number {
        const element: Element = figureElement();
        const text: Element = element?.tagName === "text" ? element : element?.querySelector("text");
        return parseFloat(text?.getAttribute("y") ?? "");
    }

    function figureX(): number {
        const element: Element = figureElement();
        const text: Element = element?.tagName === "text" ? element : element?.querySelector("text");
        return parseFloat(text?.getAttribute("x") ?? "");
    }

    function staffEdge(index: number): number {
        const staffLine: StaffLine = osmd.GraphicSheet.MusicPages[0].MusicSystems[0].StaffLines[0];
        return (staffLine.PositionAndShape.AbsolutePosition.y + staffLine.StaffLines[index].Start.y) * unitInPixels;
    }

    async function loadAligned(halign: string, valign: string, placement: string): Promise<void> {
        const score: Document = TestUtils.getScore("test_mxl4_figured_bass.musicxml").cloneNode(true) as Document;
        const node: Element = score.getElementsByTagName("figured-bass")[0];
        node.setAttribute("halign", halign);
        node.setAttribute("valign", valign);
        node.setAttribute("placement", placement);
        await osmd.load(score);
        osmd.render();
    }

    it("draws a centered, bottom-aligned figure below the staff", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_figured_bass.musicxml"));
        const figure: FiguredBass = figuredBass();
        expect(figure.HAlign).to.equal("center");
        expect(figure.VAlign).to.equal("bottom");
        expect(figure.Placement).to.equal("below");
        expect(figure.text()).to.equal("6");
        osmd.render();
        expect(figureElement().textContent).to.equal("6");
        expect(figureY()).to.be.greaterThan(staffEdge(4));
    });

    it("places the figure above the staff when placement is above", async () => {
        await loadAligned("center", "bottom", "above");
        expect(figuredBass().Placement).to.equal("above");
        expect(figureY()).to.be.lessThan(staffEdge(0));
    });

    it("shifts a centered figure left of a left-aligned one, and a bottom-aligned figure above a top-aligned one", async () => {
        await loadAligned("left", "bottom", "below");
        const leftX: number = figureX();
        const bottomY: number = figureY();
        osmd.clear();
        await loadAligned("center", "bottom", "below");
        expect(figureX()).to.be.lessThan(leftX);
        osmd.clear();
        await loadAligned("center", "top", "below");
        expect(figureY()).to.be.greaterThan(bottomY);
        expect(figureY()).to.be.greaterThan(staffEdge(4));
    });
});
