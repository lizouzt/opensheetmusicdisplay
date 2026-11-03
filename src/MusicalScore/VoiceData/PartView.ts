import { AccidentalEnum, NoteEnum, Pitch } from "../../Common/DataObjects/Pitch";

/** MusicXML for-part: the clef and transposition a part would use when the score is in concert pitch. */
export class PartView {
    public staffNumber: number = 1;
    /** Clef sign from part-clef, such as "F". Absent when the part keeps the concert clef. */
    public clefSign: string;
    public clefLine: number;
    public clefOctaveChange: number = 0;
    /** Letter steps from part-transpose, before octave-change. Negative moves down the staff. */
    public diatonic: number = 0;
    /** Semitones from part-transpose, before octave-change. */
    public chromatic: number = 0;
    public octaveChange: number = 0;

    /** Letter steps including octave-change (seven per octave). */
    public get DiatonicSteps(): number {
        return this.diatonic + 7 * this.octaveChange;
    }

    /** Semitones including octave-change. Written part pitch = concert pitch + this. */
    public get ChromaticSteps(): number {
        return this.chromatic + 12 * this.octaveChange;
    }

    /**
     * Move a written concert pitch onto the part.
     * The letter moves by diatonic steps and the accidental is whatever semitones remain,
     * so C down one letter and two semitones is Bb, not A#.
     */
    public static transpose(step: NoteEnum, octave: number, alter: number, diatonic: number, chromatic: number):
        { step: NoteEnum, octave: number, accidental: AccidentalEnum } {
        const letters: NoteEnum[] = Pitch.pitchEnumValues;
        const index: number = letters.indexOf(step);
        let newIndex: number = index + diatonic;
        let newOctave: number = octave;
        while (newIndex < 0) {
            newIndex += letters.length;
            newOctave--;
        }
        while (newIndex >= letters.length) {
            newIndex -= letters.length;
            newOctave++;
        }
        const naturals: number[] = [0, 2, 4, 5, 7, 9, 11];
        const oldSemi: number = naturals[index] + alter + 12 * octave;
        const newNatural: number = naturals[newIndex] + 12 * newOctave;
        return {
            step: letters[newIndex],
            octave: newOctave,
            accidental: Pitch.AccidentalFromHalfTones(oldSemi + chromatic - newNatural),
        };
    }
}
