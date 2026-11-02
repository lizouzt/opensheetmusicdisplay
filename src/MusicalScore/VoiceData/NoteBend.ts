/** MusicXML bend@shape. Absent means angled. */
export enum BendShape {
    Angled = "angled",
    Curved = "curved",
}

/**
 * One MusicXML bend on a note.
 * bend-alter is in semitones, positive upward.
 * A release offset is in divisions from the start of the note; ReleaseFraction is that
 * offset divided by the note's duration, clamped to 0–1. Undefined when there is no release.
 */
export class NoteBend {
    constructor(alter: number, shape: BendShape, releaseFraction?: number) {
        this.Alter = alter;
        this.Shape = shape;
        this.ReleaseFraction = releaseFraction;
    }

    public Alter: number;
    public Shape: BendShape;
    /** Fraction of this note at which the release returns. Undefined when the bend has no release. */
    public ReleaseFraction: number = undefined;
}
