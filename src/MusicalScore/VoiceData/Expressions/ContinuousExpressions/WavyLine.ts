import { AbstractExpression, PlacementEnum } from "../AbstractExpression";
import { MultiExpression } from "../MultiExpression";
//Represents the wavy-line element in musicxml
//Technically not an expression, but an ornament... But behaves very much like an expression line.
export class WavyLine extends AbstractExpression {
    constructor(placement: PlacementEnum) {
        super(placement);
    }

    public ParentStartMultiExpression: MultiExpression;
    public ParentEndMultiExpression: MultiExpression;
    /** MusicXML wavy-line@smufl. The font has no wiggleTrill glyph, so the drawn wave stays the default one. */
    public Smufl: string;
}
