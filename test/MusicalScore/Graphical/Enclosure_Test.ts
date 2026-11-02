import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { UnknownExpression } from "../../../src/MusicalScore/VoiceData/Expressions/UnknownExpression";

/**
 * MusicXML 4.0 enclosure="inverted-bracket" is a rectangle around the words with the top side open.
 */
describe("MusicXML 4.0 inverted-bracket enclosure", () => {
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

    it("draws an open-topped bracket around the word", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_enclosure_inverted_bracket.musicxml"));
        const expression: UnknownExpression = osmd.Sheet.SourceMeasures[0].StaffLinkedExpressions[0][0].UnknownList[0];
        expect(expression.Label).to.equal("INV");
        expect(expression.Enclosure).to.equal("inverted-bracket");

        osmd.render();
        const texts: string[] = Array.from(container.querySelectorAll("text")).map((element: SVGTextElement): string => element.textContent ?? "");
        expect(texts).to.include("INV");

        const segments: { x0: number, y0: number, x1: number, y1: number }[] = [];
        for (const path of Array.from(container.querySelectorAll("g[id^=vf-inverted-bracket] path"))) {
            const command: string = path.getAttribute("d") ?? "";
            const match: RegExpMatchArray = command.match(/M\s*([0-9.]+)\s+([0-9.]+)\s*L\s*([0-9.]+)\s+([0-9.]+)/);
            if (!match) {
                continue;
            }
            segments.push({
                x0: parseFloat(match[1]),
                y0: parseFloat(match[2]),
                x1: parseFloat(match[3]),
                y1: parseFloat(match[4]),
            });
        }
        expect(segments.length, "left, bottom and right sides").to.equal(3);
        const horizontal: { x0: number, y0: number, x1: number, y1: number } = segments.find(
            (segment: { y0: number, y1: number }): boolean => segment.y0 === segment.y1);
        const verticals: { x0: number, y0: number, x1: number, y1: number }[] = segments.filter(
            (segment: { x0: number, x1: number }): boolean => segment.x0 === segment.x1);
        expect(horizontal, "the bottom side").to.not.equal(undefined);
        expect(verticals.length, "the two uprights").to.equal(2);
        const topY: number = Math.min(...verticals.map((segment: { y0: number, y1: number }): number => Math.min(segment.y0, segment.y1)));
        expect(horizontal.y0, "the bar is the lower edge, so the top stays open").to.be.greaterThan(topY);
        const text: SVGTextElement = Array.from(container.querySelectorAll("text")).find(
            (element: SVGTextElement): boolean => element.textContent === "INV");
        const textBox: DOMRect = text.getBBox();
        expect(horizontal.y0, "the bar sits under the word").to.be.greaterThan(textBox.y);
        expect(Math.min(horizontal.x0, horizontal.x1), "the bar starts left of the word").to.be.lessThan(textBox.x);
        expect(Math.max(horizontal.x0, horizontal.x1), "the bar ends right of the word").to.be.greaterThan(textBox.x + textBox.width);
    });
});
