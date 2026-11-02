/** A MusicXML percussion pictogram. Kind is effect, membrane, metal, wood, or timpani. */
export class PercussionPictogram {
    constructor(kind: string, smufl: string, text: string) {
        this.Kind = kind;
        this.Smufl = smufl;
        this.Text = text;
    }

    public Kind: string;
    public Smufl: string;
    public Text: string;
}
