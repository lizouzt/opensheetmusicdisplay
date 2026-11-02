import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { MusicPartManagerIterator } from "../../../src/MusicalScore/MusicParts/MusicPartManagerIterator";
import { RepetitionInstruction, RepetitionInstructionEnum } from "../../../src/MusicalScore/VoiceData/Instructions/RepetitionInstruction";

/**
 * MusicXML 4.0 repeat@after-jump. The default, and an explicit no, leave a repeat untaken after a D.C.
 * yes plays that repeat again.
 */
describe("MusicXML 4.0 repeat after jump", () => {
    let container: HTMLElement;
    let osmd: OpenSheetMusicDisplay;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        osmd = TestUtils.createOpenSheetMusicDisplay(container);
    });
    afterEach(() => {
        container.remove();
    });

    async function playedMeasures(source: string | Document): Promise<number[]> {
        await osmd.load(source);
        const measures: number[] = [];
        const iterator: MusicPartManagerIterator = osmd.Sheet.MusicPartManager.getIterator();
        while (!iterator.EndReached) {
            if (iterator.CurrentMeasureIndex !== measures[measures.length - 1] || iterator.JumpOccurred) {
                measures.push(iterator.CurrentMeasureIndex);
            }
            iterator.moveToNext();
        }
        return measures;
    }

    function score(afterJump: string): string {
        const attribute: string = afterJump.length > 0 ? ` after-jump="${afterJump}"` : "";
        return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef></attributes>
      <barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
      <barline location="right"><bar-style>light-heavy</bar-style>
        <repeat direction="backward" times="2"${attribute}/></barline>
    </measure>
    <measure number="2">
      <direction><direction-type><words>D.C.</words></direction-type></direction>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;
    }

    it("plays the repeat again after the D.C. when after-jump is yes", async () => {
        expect(await playedMeasures(TestUtils.getScore("test_mxl4_repeat_after_jump.musicxml"))).to.deep.equal([0, 0, 1, 0, 0, 1]);
        const jump: RepetitionInstruction = osmd.Sheet.SourceMeasures[0].LastRepetitionInstructions.find(
            (instruction: RepetitionInstruction): boolean => instruction.type === RepetitionInstructionEnum.BackJumpLine);
        expect(jump.AfterJump).to.equal(true);
    });

    it("does not play the repeat again after the D.C. when after-jump is absent", async () => {
        expect(await playedMeasures(score(""))).to.deep.equal([0, 0, 1, 0, 1]);
    });

    it("does not play the repeat again after the D.C. when after-jump is no", async () => {
        expect(await playedMeasures(score("no"))).to.deep.equal([0, 0, 1, 0, 1]);
    });
});
