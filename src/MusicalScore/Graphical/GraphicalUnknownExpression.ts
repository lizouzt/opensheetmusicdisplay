
import { StaffLine } from "./StaffLine";
import { GraphicalLabel } from "./GraphicalLabel";
import { AbstractGraphicalExpression } from "./AbstractGraphicalExpression";
import { PlacementEnum, AbstractExpression } from "../VoiceData/Expressions/AbstractExpression";
import { MultiExpression } from "../VoiceData/Expressions/MultiExpression";
import { SkyBottomLineCalculator } from "./SkyBottomLineCalculator";
import log from "loglevel";
import { SourceMeasure } from "../VoiceData/SourceMeasure";

export class GraphicalUnknownExpression extends AbstractGraphicalExpression {
    public sourceMultiExpression: MultiExpression;

    /** MusicXML enclosure of the first unknown expression, when it has one. */
    public get Enclosure(): string {
        return this.sourceMultiExpression?.UnknownList[0]?.Enclosure;
    }

    constructor(staffLine: StaffLine, label: GraphicalLabel, placement: PlacementEnum, measure: SourceMeasure,
                sourceMultiExpression: MultiExpression = undefined) {
        super(staffLine, new AbstractExpression(placement), measure);
        this.label = label;
        this.sourceMultiExpression = sourceMultiExpression;
    }

    public updateSkyBottomLine(): void {
        // update Sky-BottomLine
        const skyBottomLineCalculator: SkyBottomLineCalculator = this.parentStaffLine.SkyBottomLineCalculator;
        const bracketPad: number = this.Enclosure === "inverted-bracket" ? 0.2 : 0;
        const left: number = this.label.PositionAndShape.RelativePosition.x + this.label.PositionAndShape.BorderMarginLeft - bracketPad;
        const right: number = this.label.PositionAndShape.RelativePosition.x + this.label.PositionAndShape.BorderMarginRight + bracketPad;
        switch (this.Placement) {
            case PlacementEnum.Above:
                const yValueAbove: number = this.label.PositionAndShape.BorderMarginTop + this.label.PositionAndShape.RelativePosition.y - bracketPad;
                skyBottomLineCalculator.updateSkyLineWithLabel(left, right, yValueAbove);
                break;
            case PlacementEnum.Below:
                const yValueBelow: number = this.label.PositionAndShape.BorderMarginBottom + this.label.PositionAndShape.RelativePosition.y + bracketPad;
                skyBottomLineCalculator.updateBottomLineWithLabel(left, right, yValueBelow);
                break;
            default:
                log.error("Placement for GraphicalUnknownExpression is unknown");
        }
    }
}
