import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { MultiExpression } from "../../../src/MusicalScore/VoiceData/Expressions/MultiExpression";

/**
 * MusicXML 4.0 level@type on a direction. The editorial text is stored and not drawn.
 */
describe("MusicXML 4.0 level type", () => {
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

    function levelExpression(): MultiExpression {
        const expressions: MultiExpression[] = osmd.Sheet.SourceMeasures[0].StaffLinkedExpressions[0];
        return expressions.find((expression: MultiExpression): boolean => expression.LevelText !== undefined);
    }

    it("stores a start level on the dolce direction", (done: Mocha.Done) => {
        osmd.load(TestUtils.getScore("test_mxl4_level_type.musicxml")).then(() => {
            osmd.render();
            const expression: MultiExpression = levelExpression();
            expect(expression.LevelText).to.equal("source A");
            expect(expression.LevelType).to.equal("start");
            expect(expression.MoodList[0].Label).to.equal("dolce");
            expect(container.textContent).to.contain("dolce");
            done();
        }).catch(done);
    });

    it("stores single when level has no type", (done: Mocha.Done) => {
        const xml: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef></attributes>
    <direction><direction-type><words>dolce</words></direction-type><level>edition</level></direction>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`;
        osmd.load(xml).then(() => {
            const expression: MultiExpression = levelExpression();
            expect(expression.LevelText).to.equal("edition");
            expect(expression.LevelType).to.equal("single");
            done();
        }).catch(done);
    });
});
