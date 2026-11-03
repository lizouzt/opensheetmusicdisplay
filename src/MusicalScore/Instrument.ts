import { InstrumentalGroup } from "./InstrumentalGroup";
import { Label } from "./Label";
import { MusicSheet } from "./MusicSheet";
import { Voice } from "./VoiceData/Voice";
import { Staff } from "./VoiceData/Staff";
import { SubInstrument } from "./SubInstrument";
import { MidiInstrument } from "./VoiceData/Instructions/ClefInstruction";
import { PartLink } from "./PartLink";
import { PartSymbol } from "./VoiceData/PartSymbol";
import { PartView } from "./VoiceData/PartView";
import { ScorePlayer } from "./VoiceData/MusicXml4Annotations";

export class Instrument extends InstrumentalGroup {

    constructor(id: number, idString: string, musicSheet: MusicSheet, parent: InstrumentalGroup) {
        super(undefined, musicSheet, parent);
        this.id = id;
        this.idString = idString;
        this.nameLabel = new Label(idString);
    }

    /** Transposition halftones for this instrument only.
     *  This is additive to osmd.Sheet.Transpose (MusicSheet).
     *  osmd.TransposeCaculator needs to be defined/created for this to take effect. (just set it with new TransposeCalculator())
     * You need to call osmd.updateGraphic() before the next render() (assuming this is set after load()).
     */
    public Transpose: number = 0;
    public highlight: boolean;

    private voices: Voice[] = [];
    private staves: Staff[] = [];
    private nameLabel: Label;
    private idString: string;
    private id: number;
    private hasLyrics: boolean = false;
    private hasChordSymbols: boolean = false;
    private playbackTranspose: number;
    /** Extra sounding note from MusicXML <double>, in semitones from the written pitch. 0 means no doubling. */
    private playbackDoubling: number = 0;

    private lyricVersesNumbers: string[] = [];
    private subInstruments: SubInstrument[] = [];
    private partAbbreviation: string;
    private partAbbreviationPrintObject: boolean = true;
    /** MusicXML 4.0 part-link entries. Paths are relative to the root of the compressed file. */
    private partLinks: PartLink[] = [];
    /** MusicXML part-symbol elements. Empty means the usual brace across every staff of a multi-staff part. */
    private partSymbols: PartSymbol[] = [];
    /** Default stem direction from voice-direction, keyed by MusicXML voice number. "up" or "down". */
    private voiceDirections: { [voiceId: number]: string } = {};
    /** Concert-score for-part entries, one per staff number. */
    private partViews: PartView[] = [];
    /** MusicXML player entries on the score-part. */
    private players: ScorePlayer[] = [];

    public get Voices(): Voice[] {
        return this.voices;
    }
    public get Staves(): Staff[] {
        return this.staves;
    }
    public get NameLabel(): Label {
        return this.nameLabel;
    }
    public get HasLyrics(): boolean {
        return this.hasLyrics;
    }
    public set HasLyrics(value: boolean) {
        this.hasLyrics = value;
    }
    public get HasChordSymbols(): boolean {
        return this.hasChordSymbols;
    }
    public set HasChordSymbols(value: boolean) {
        this.hasChordSymbols = value;
    }
    public get LyricVersesNumbers(): string[] {
        return this.lyricVersesNumbers;
    }
    public set LyricVersesNumbers(value: string[]) {
        this.lyricVersesNumbers = value;
    }
    public get Name(): string {
        return this.nameLabel.text;
    }
    public set Name(value: string) {
        this.nameLabel.text = value;
    }
    public get IdString(): string {
        return this.idString;
    }
    public get Id(): number {
        return this.id;
    }
    public get MidiInstrumentId(): MidiInstrument {
        return this.subInstruments[0].midiInstrumentID;
    }
    public set MidiInstrumentId(value: MidiInstrument) {
        this.subInstruments[0].midiInstrumentID = value;
    }
    public get Volume(): number {
        return this.subInstruments[0].volume;
    }
    public set Volume(value: number) {
        for (let idx: number = 0, len: number = this.subInstruments.length; idx < len; ++idx) {
            const subInstrument: SubInstrument = this.subInstruments[idx];
            subInstrument.volume = value;
        }
    }
    public get PlaybackTranspose(): number {
        return this.playbackTranspose;
    }
    public set PlaybackTranspose(value: number) {
        this.playbackTranspose = value;
    }
    /**
     * Semitones of the extra sounding note from MusicXML &lt;double&gt;.
     * +12 is one octave above the written pitch, -12 one octave below. 0 means the part is not doubled.
     * The written staff is unchanged. A playback consumer adds PlaybackTranspose to both the written note and this doubling.
     */
    public get PlaybackDoubling(): number {
        return this.playbackDoubling;
    }
    public set PlaybackDoubling(value: number) {
        this.playbackDoubling = value;
    }

    public get SubInstruments(): SubInstrument[] {
        return this.subInstruments;
    }
    public getSubInstrument(subInstrumentIdString: string): SubInstrument {
        for (let idx: number = 0, len: number = this.subInstruments.length; idx < len; ++idx) {
            const subInstrument: SubInstrument = this.subInstruments[idx];
            if (subInstrument.idString === subInstrumentIdString) {
                return subInstrument;
            }
        }
        return undefined;
    }
    public get PartAbbreviation(): string {
        return this.partAbbreviation;
    }
    public set PartAbbreviation(value: string) {
        this.partAbbreviation = value;
    }
    /** Whether the part abbreviation is shown: false for print-object="no" on part-abbreviation or part-abbreviation-display. */
    public get PartAbbreviationPrintObject(): boolean {
        return this.partAbbreviationPrintObject;
    }
    public set PartAbbreviationPrintObject(value: boolean) {
        this.partAbbreviationPrintObject = value;
    }
    /** Linked part files from &lt;part-link&gt;. Empty when the score has none. */
    public get PartLinks(): PartLink[] {
        return this.partLinks;
    }
    /** Braces and brackets from part-symbol. Replaces the previous list when a measure sets them. */
    public get PartSymbols(): PartSymbol[] {
        return this.partSymbols;
    }
    public set PartSymbols(value: PartSymbol[]) {
        this.partSymbols = value;
    }
    /** Default stem direction for a voice that has no stem element. Undefined when the score does not set one. */
    public getVoiceDirection(voiceId: number): string {
        return this.voiceDirections[voiceId];
    }
    public setVoiceDirection(voiceId: number, direction: string): void {
        this.voiceDirections[voiceId] = direction;
    }
    /** Part clefs and transpositions from for-part. Empty when the score has none. */
    public get PartViews(): PartView[] {
        return this.partViews;
    }
    public getPartView(staffNumber: number): PartView {
        for (const view of this.partViews) {
            if (view.staffNumber === staffNumber) {
                return view;
            }
        }
        return undefined;
    }
    public getOrCreatePartView(staffNumber: number): PartView {
        let view: PartView = this.getPartView(staffNumber);
        if (!view) {
            view = new PartView();
            view.staffNumber = staffNumber;
            this.partViews.push(view);
        }
        return view;
    }
    /** Performers declared on the score-part. */
    public get Players(): ScorePlayer[] {
        return this.players;
    }

    public get Visible(): boolean {
        if (this.voices.length > 0) {
            return this.Voices[0].Visible;
        } else {
            return false;
        }
    }
    /** Checks that Instrument.Visible and at least one staff visible. */
    public isVisible(): boolean {
        if (!this.Visible) {
            return false;
        }
        for (const staff of this.Staves) {
            if (staff.Visible) {
                return true; // at least one staff visible
            }
        }
        return false;
    }
    public set Visible(value: boolean) {
        for (let idx: number = 0, len: number = this.Voices.length; idx < len; ++idx) {
            const v: Voice = this.Voices[idx];
            v.Visible = value;
        }
    }
    public get Audible(): boolean {
        let result: boolean = false;
        for (let idx: number = 0, len: number = this.Voices.length; idx < len; ++idx) {
            const v: Voice = this.Voices[idx];
            result = result || v.Audible;
        }
        return result;
    }
    public set Audible(value: boolean) {
        for (let idx: number = 0, len: number = this.Voices.length; idx < len; ++idx) {
            const v: Voice = this.Voices[idx];
            v.Audible = value;
        }
        for (let idx: number = 0, len: number = this.staves.length; idx < len; ++idx) {
            const staff: Staff = this.staves[idx];
            staff.audible = value;
        }
    }
    public get Following(): boolean {
        let result: boolean = false;
        for (let idx: number = 0, len: number = this.Voices.length; idx < len; ++idx) {
            const v: Voice = this.Voices[idx];
            result = result || v.Following;
        }
        return result;
    }
    public set Following(value: boolean) {
        for (let idx: number = 0, len: number = this.Voices.length; idx < len; ++idx) {
            const v: Voice = this.Voices[idx];
            v.Following = value;
        }
        for (let idx: number = 0, len: number = this.staves.length; idx < len; ++idx) {
            const staff: Staff = this.staves[idx];
            staff.following = value;
        }
    }
    public SetVoiceAudible(voiceId: number, audible: boolean): void {
        for (let idx: number = 0, len: number = this.Voices.length; idx < len; ++idx) {
            const v: Voice = this.Voices[idx];
            if (v.VoiceId === voiceId) {
                v.Audible = audible;
                break;
            }
        }
    }
    public SetVoiceFollowing(voiceId: number, following: boolean): void {
        for (let idx: number = 0, len: number = this.Voices.length; idx < len; ++idx) {
            const v: Voice = this.Voices[idx];
            if (v.VoiceId === voiceId) {
                v.Following = following;
                break;
            }
        }
    }
    public SetStaffAudible(staffId: number, audible: boolean): void {
        const staff: Staff = this.staves[staffId - 1];
        staff.audible = audible;
        // hack for now:
        // activate all voices needed so that the staff notes will be played
        if (audible) {
            for (let idx: number = 0, len: number = staff.Voices.length; idx < len; ++idx) {
                const v: Voice = staff.Voices[idx];
                v.Audible = true;
            }
        } else {
            for (let idx: number = 0, len: number = staff.Voices.length; idx < len; ++idx) {
                const voice: Voice = staff.Voices[idx];
                let isAudibleInOtherStaves: boolean = false;
                for (let idx2: number = 0, len2: number = this.Staves.length; idx2 < len2; ++idx2) {
                    const st: Staff = this.Staves[idx2];
                    if (st.Id === staffId || !st.audible) { continue; }
                    for (let idx3: number = 0, len3: number = st.Voices.length; idx3 < len3; ++idx3) {
                        const v: Voice = st.Voices[idx3];
                        if (v === voice) {
                            isAudibleInOtherStaves = true;
                        }
                    }
                }
                if (!isAudibleInOtherStaves) {
                    voice.Audible = false;
                }
            }
        }
    }
    public SetStaffFollow(staffId: number, follow: boolean): void {
        const staff: Staff = this.staves[staffId - 1];
        staff.following = follow;
        if (follow) {
            for (let idx: number = 0, len: number = staff.Voices.length; idx < len; ++idx) {
                const v: Voice = staff.Voices[idx];
                v.Following = true;
            }
        } else {
            for (let idx: number = 0, len: number = staff.Voices.length; idx < len; ++idx) {
                const voice: Voice = staff.Voices[idx];
                let isFollowingInOtherStaves: boolean = false;
                for (let idx2: number = 0, len2: number = this.Staves.length; idx2 < len2; ++idx2) {
                    const st: Staff = this.Staves[idx2];
                    if (st.Id === staffId || !st.following) { continue; }
                    for (let idx3: number = 0, len3: number = st.Voices.length; idx3 < len3; ++idx3) {
                        const v: Voice = st.Voices[idx3];
                        if (v === voice) {
                            isFollowingInOtherStaves = true;
                        }
                    }
                }
                if (!isFollowingInOtherStaves) {
                    voice.Following = false;
                }
            }
        }
    }
    public areAllVoiceVisible(): boolean {
        for (const voice of this.Voices) {
            if (!voice.Visible) {
                return false;
            }
        }
        return true;
    }
    public createStaves(numberOfStaves: number): void {
        for (let i: number = 0; i < numberOfStaves; i++) {
            this.staves.push(new Staff(this, i + 1));
        }
    }

    // necessary to be unique for MusicSystem.labels Dictionary
    public toString(): string {
        return `${this.Name} , id: ${this.id}, idstring: ${this.idString}`;
    }
}
