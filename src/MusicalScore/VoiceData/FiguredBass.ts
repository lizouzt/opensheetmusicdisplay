import { TextAlignmentEnum } from "../../Common/Enums/TextAlignment";

/** One MusicXML figured-bass element. Figures are top to bottom. */
export class FiguredBass {
    public Figures: string[] = [];
    /** left, center, or right. */
    public HAlign: string = "left";
    /** top, middle, or bottom. */
    public VAlign: string = "bottom";
    /** above or below. */
    public Placement: string = "below";
    public PrintObject: boolean = true;

    public text(): string {
        return this.Figures.join("\n");
    }

    public textAlignment(): TextAlignmentEnum {
        const horizontal: string = this.HAlign === "center" || this.HAlign === "right" ? this.HAlign : "left";
        const vertical: string = this.VAlign === "top" || this.VAlign === "middle" ? this.VAlign : "bottom";
        if (horizontal === "center" && vertical === "top") {
            return TextAlignmentEnum.CenterTop;
        }
        if (horizontal === "center" && vertical === "middle") {
            return TextAlignmentEnum.CenterCenter;
        }
        if (horizontal === "center") {
            return TextAlignmentEnum.CenterBottom;
        }
        if (horizontal === "right" && vertical === "top") {
            return TextAlignmentEnum.RightTop;
        }
        if (horizontal === "right" && vertical === "middle") {
            return TextAlignmentEnum.RightCenter;
        }
        if (horizontal === "right") {
            return TextAlignmentEnum.RightBottom;
        }
        if (vertical === "top") {
            return TextAlignmentEnum.LeftTop;
        }
        if (vertical === "middle") {
            return TextAlignmentEnum.LeftCenter;
        }
        return TextAlignmentEnum.LeftBottom;
    }
}
