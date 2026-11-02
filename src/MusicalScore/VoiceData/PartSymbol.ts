/** One MusicXML part-symbol. Staff numbers are 1-based within the part. */
export class PartSymbol {
    public kind: string;
    public topStaff: number;
    public bottomStaff: number;

    constructor(kind: string, topStaff: number, bottomStaff: number) {
        this.kind = kind;
        this.topStaff = topStaff;
        this.bottomStaff = bottomStaff;
    }
}
