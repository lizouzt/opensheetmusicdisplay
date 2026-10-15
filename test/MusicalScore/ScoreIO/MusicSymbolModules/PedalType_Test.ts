import { expect } from "chai";
import Vex from "vexflow";
import { OpenSheetMusicDisplay } from "../../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../../Util/TestUtils";
import { Pedal } from "../../../../src/MusicalScore/VoiceData/Expressions/ContinuousExpressions/Pedal";
import { MusicSheet } from "../../../../src/MusicalScore/MusicSheet";
import { VexFlowPedal } from "../../../../src/MusicalScore/Graphical/VexFlow/VexFlowPedal";
import { SourceMeasure } from "../../../../src/MusicalScore/VoiceData/SourceMeasure";
import { MultiExpression } from "../../../../src/MusicalScore/VoiceData/Expressions/MultiExpression";

describe("Pedal discontinue and resume", () => {
    function pedalStarts(sheet: MusicSheet): Pedal[] {
        const pedals: Pedal[] = [];
        for (const measure of sheet.SourceMeasures) {
            const sourceMeasure: SourceMeasure = measure;
            for (const staffExpressions of sourceMeasure.StaffLinkedExpressions) {
                for (const expression of staffExpressions) {
                    const multi: MultiExpression = expression;
                    if (multi?.PedalStart) {
                        pedals.push(multi.PedalStart);
                    }
                }
            }
        }
        return pedals;
    }

    it("ends a line without a lift and starts the next line without a downstroke", async () => {
        const osmd: OpenSheetMusicDisplay = TestUtils.createOpenSheetMusicDisplay(TestUtils.getDivElement(document));
        await osmd.load(TestUtils.getScore("test_mxl4_pedal_discontinue_resume.musicxml"));
        const pedals: Pedal[] = pedalStarts(osmd.Sheet);
        expect(pedals.map(pedal => [pedal.OpenBegin, pedal.OpenEnd, pedal.IsLine])).to.deep.equal([
            [false, true, true],
            [true, false, true],
        ]);

        osmd.render();
        const drawn: VexFlowPedal[] = osmd.GraphicSheet.MusicPages[0].MusicSystems[0].StaffLines[0].Pedals as VexFlowPedal[];
        const styles: any = Vex.Flow.PedalMarking.Styles as any;
        expect(drawn.map(pedal => (pedal.getPedalMarking() as any).style)).to.deep.equal([
            styles.BRACKET_OPEN_END,
            styles.BRACKET_OPEN_BEGIN,
        ]);
        osmd.clear();
    });
});
