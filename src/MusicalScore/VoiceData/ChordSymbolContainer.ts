import {Pitch} from "../../Common/DataObjects/Pitch";
import {KeyInstruction} from "./Instructions/KeyInstruction";
import {MusicSheetCalculator} from "../Graphical/MusicSheetCalculator";
import {AccidentalEnum} from "../../Common/DataObjects/Pitch";
import { EngravingRules } from "../Graphical/EngravingRules";
import { PlacementEnum } from "./Expressions/AbstractExpression";

/** How a later harmony-chord or bass sits relative to what precedes it. */
export enum HarmonyArrangement {
    Horizontal = "horizontal",
    Vertical = "vertical",
    Diagonal = "diagonal",
}

/** One root, numeral, or deprecated function inside a harmony element. */
export class HarmonyChord {
    public RootPitch: Pitch;
    public ChordKind: ChordSymbolEnum;
    /** kind@text, when the score gives an explicit symbol such as "7". */
    public KindText: string;
    public NumeralText: string;
    /** Semitones from numeral-alter. 0 is stored and not printed. */
    public NumeralAlter: number;
    public NumeralAlterPrint: boolean = true;
    public NumeralAlterOnLeft: boolean = false;
    /** numeral-fifths. Undefined when the harmony has no numeral-key. */
    public NumeralFifths: number;
    public NumeralMode: string;
    public NumeralKeyPrint: boolean = true;
    public InversionText: string;
    public BassPitch: Pitch;
    /** bass-separator text. Undefined means the usual slash. */
    public BassSeparator: string;
    public BassArrangement: HarmonyArrangement;
    public Degrees: Degree[] = [];
    /** Deprecated function text, such as "V". */
    public FunctionText: string;
}

export class ChordSymbolContainer {
    private rootPitch: Pitch;
    private chordKind: ChordSymbolEnum;
    public NumeralText: string;
    /** Set for deprecated <function>. The drawn text still includes it. */
    public FunctionText: string;
    /** Later harmony-chords in the same element, including the first when arrangement or bass text is involved. */
    public HarmonyChords: HarmonyChord[] = [];
    public Arrangement: HarmonyArrangement;
    private bassPitch: Pitch;
    private degrees: Degree[];
    private rules: EngravingRules;
    public Placement: PlacementEnum;

    constructor(
        rootPitch: Pitch,
        chordKind: ChordSymbolEnum,
        bassPitch: Pitch,
        chordDegrees: Degree[],
        rules: EngravingRules,
        placement: PlacementEnum = PlacementEnum.Above
    ) {
        this.rootPitch = rootPitch;
        this.chordKind = chordKind;
        this.bassPitch = bassPitch;
        this.degrees = chordDegrees;
        this.rules = rules;
        this.Placement = placement;
    }

    public get RootPitch(): Pitch {
        return this.rootPitch;
    }

    public get ChordKind(): ChordSymbolEnum {
        return this.chordKind;
    }

    public get BassPitch(): Pitch {
        return this.bassPitch;
    }

    public get ChordDegrees(): Degree[] {
        return this.degrees;
    }

    public static calculateChordText(chordSymbol: ChordSymbolContainer, transposeHalftones: number, keyInstruction: KeyInstruction): string {
        // if (!chordSymbol) { // undefined
        //     return; // handled in VexFlowGraphicalSymbolFactory.createChordSymbols
        // }
        if (chordSymbol.HarmonyChords.length > 0) {
            return chordSymbol.formatHarmony(transposeHalftones, keyInstruction);
        }
        if (chordSymbol.NumeralText !== undefined) { // if(chordSymbol.NumeralText) doesn't match empty string
            return chordSymbol.NumeralText;
        }
        let transposedRootPitch: Pitch = chordSymbol.RootPitch;

        if (MusicSheetCalculator.transposeCalculator) {
            transposedRootPitch = MusicSheetCalculator.transposeCalculator.transposePitch(
                chordSymbol.RootPitch,
                keyInstruction,
                transposeHalftones,
                true // chord symbol: a calculator can spell it differently from notes
            );
        }
        if (chordSymbol.ChordKind === ChordSymbolEnum.none) {
            return chordSymbol.getTextFromChordKindEnum(chordSymbol.ChordKind);
        }
        // main Note
        let text: string = Pitch.getNoteEnumString(transposedRootPitch.FundamentalNote);
        // main alteration
        if (transposedRootPitch.Accidental !== AccidentalEnum.NONE) {
            text += chordSymbol.getTextForAccidental(transposedRootPitch.Accidental);
        }

        // degrees
        const degrees: DegreesInfo = {
            adds: [],
            alts: [],
            subs: [],
        };

        for (const chordDegree of chordSymbol.ChordDegrees) {
            if (chordDegree) {
                let t: string = "";
                if (chordDegree.alteration !== AccidentalEnum.NONE) {
                    t += chordSymbol.getTextForAccidental(chordDegree.alteration);
                }
                t += chordDegree.value;
                switch (chordDegree.text) {
                    case ChordDegreeText.add:
                        degrees.adds.push(t);
                        break;
                    case ChordDegreeText.alter:
                        degrees.alts.push(t);
                        break;
                    case ChordDegreeText.subtract:
                        degrees.subs.push(t);
                        break;
                    default:
                }
            }
        }

        // chord kind text
        let chordKind: string = chordSymbol.getTextFromChordKindEnum(chordSymbol.ChordKind);
        const degreeTypeAry: string[] = ["adds", "alts", "subs"];
        const customChords: CustomChord[] = chordSymbol.rules.CustomChords;
        for (const customChord of customChords) {
            if (customChord.chordKind !== chordSymbol.chordKind) {
                continue;
            }

            let hasCustomChordDegrees: boolean = true;
            for (const degType of degreeTypeAry) {
                for (const deg of (customChord.degrees[degType] || [])) {
                    if (degrees[degType].indexOf(deg) < 0) {
                        hasCustomChordDegrees = false;
                        break;
                    }
                }
                if (!hasCustomChordDegrees) {
                    break;
                }
            }
            if (hasCustomChordDegrees) {
                for (const degType of degreeTypeAry) {
                    for (const deg of (customChord.degrees[degType] || [])) {
                        // delete degree since we don't want it displayed when the alternate name of the customChord should contain the degrees.
                        degrees[degType].splice(degrees[degType].indexOf(deg), 1);
                    }
                }
                chordKind = customChord.alternateName;
            }
        }

        text += chordKind;
        if (degrees.adds.length > 0) {
            text += "(" + degrees.adds.join(",") + ")";
        }
        if (degrees.alts.length > 0) {
            text += "(alt " + degrees.alts.join(",") + ")";
        }
        if (degrees.subs.length > 0) {
            text += "(omit " + degrees.subs.join(",") + ")";
        }

        // bass
        if (chordSymbol.BassPitch) {
            let transposedBassPitch: Pitch = chordSymbol.BassPitch;
            if (MusicSheetCalculator.transposeCalculator) {
                transposedBassPitch = MusicSheetCalculator.transposeCalculator.transposePitch(
                    chordSymbol.BassPitch,
                    keyInstruction,
                    transposeHalftones,
                    true
                );
            }
            text += "/";
            text += Pitch.getNoteEnumString(transposedBassPitch.FundamentalNote);
            text += chordSymbol.getTextForAccidental(transposedBassPitch.Accidental);
        }
        return text;
    }

    private formatHarmony(transposeHalftones: number, keyInstruction: KeyInstruction): string {
        const parts: string[] = [];
        for (const chord of this.HarmonyChords) {
            parts.push(this.formatHarmonyChord(chord, transposeHalftones, keyInstruction));
        }
        if (parts.length <= 1) {
            return parts[0] ?? "";
        }
        // Vertical stacks the next chord below a horizontal line. Horizontal and diagonal use a slash;
        // diagonal also drops the next chord onto the following line.
        if (this.Arrangement === HarmonyArrangement.Vertical) {
            return parts.join("\n—\n");
        }
        if (this.Arrangement === HarmonyArrangement.Diagonal) {
            return parts[0] + parts.slice(1).map((part: string) => "\n/ " + part).join("");
        }
        return parts.join(" / ");
    }

    private formatHarmonyChord(chord: HarmonyChord, transposeHalftones: number, keyInstruction: KeyInstruction): string {
        let text: string = "";
        if (chord.NumeralFifths !== undefined && chord.NumeralKeyPrint) {
            text += this.keySignatureText(chord.NumeralFifths);
            if (chord.NumeralMode && chord.NumeralMode !== "major") {
                text += chord.NumeralMode + " ";
            }
        }
        const alterText: string = chord.NumeralAlter && chord.NumeralAlterPrint ? this.numeralAlterText(chord.NumeralAlter) : "";
        const body: string = chord.NumeralText ?? chord.FunctionText ?? this.rootLetter(chord.RootPitch, transposeHalftones, keyInstruction);
        if (chord.NumeralAlterOnLeft) {
            text += alterText + body;
        } else {
            text += body + alterText;
        }
        if (chord.InversionText) {
            text += chord.InversionText;
        } else if (chord.FunctionText !== undefined && chord.NumeralText === undefined) {
            const kindText: string = chord.KindText ?? this.getTextFromChordKindEnum(chord.ChordKind);
            if (kindText) {
                text += kindText;
            }
        }
        if (chord.BassPitch) {
            text = this.appendBass(text, this.pitchLetter(chord.BassPitch, transposeHalftones, keyInstruction), chord);
        }
        return text;
    }

    private appendBass(text: string, bass: string, chord: HarmonyChord): string {
        const word: string = chord.BassSeparator;
        if (chord.BassArrangement === HarmonyArrangement.Vertical) {
            return word !== undefined ? `${text}\n${word} ${bass}` : `${text}\n${bass}`;
        }
        if (chord.BassArrangement === HarmonyArrangement.Diagonal) {
            return word !== undefined ? `${text}\n/ ${word} ${bass}` : `${text}\n/ ${bass}`;
        }
        return word !== undefined ? `${text} ${word} ${bass}` : `${text}/${bass}`;
    }

    private rootLetter(root: Pitch, transposeHalftones: number, keyInstruction: KeyInstruction): string {
        if (!root) {
            return "";
        }
        return this.pitchLetter(root, transposeHalftones, keyInstruction);
    }

    private pitchLetter(pitch: Pitch, transposeHalftones: number, keyInstruction: KeyInstruction): string {
        let transposed: Pitch = pitch;
        if (MusicSheetCalculator.transposeCalculator) {
            transposed = MusicSheetCalculator.transposeCalculator.transposePitch(pitch, keyInstruction, transposeHalftones, true);
        }
        return Pitch.getNoteEnumString(transposed.FundamentalNote) + this.getTextForAccidental(transposed.Accidental);
    }

    private keySignatureText(fifths: number): string {
        if (!fifths) {
            return "";
        }
        const glyph: string = fifths > 0
            ? this.getTextForAccidental(AccidentalEnum.SHARP)
            : this.getTextForAccidental(AccidentalEnum.FLAT);
        return glyph.repeat(Math.abs(fifths));
    }

    private numeralAlterText(alter: number): string {
        try {
            return this.getTextForAccidental(Pitch.AccidentalFromHalfTones(alter));
        } catch {
            return "";
        }
    }

    private getTextForAccidental(alteration: AccidentalEnum): string {
        const text: string = this.rules.ChordAccidentalTexts.getValue(alteration);
        return text !== undefined ? text : "";
    }

    private getTextFromChordKindEnum(kind: ChordSymbolEnum): string {
        return this.rules.ChordSymbolLabelTexts.getValue(kind) ?? "";
    }

}

export class Degree {
    constructor(value: number, alteration: AccidentalEnum, text: ChordDegreeText) {
        this.value = value;
        this.alteration = alteration;
        this.text = text;
    }

    public value: number;
    public alteration: AccidentalEnum;
    public text: ChordDegreeText;
}

export interface DegreesInfo {
    adds?: string[];
    alts?: string[];
    subs?: string[];
}

export class CustomChord {
    public alternateName: string;
    public chordKind: ChordSymbolEnum;
    public degrees: DegreesInfo;

    constructor(
        alternateName: string,
        chordKind: ChordSymbolEnum,
        degrees: DegreesInfo,
    ) {
        this.alternateName = alternateName;
        this.chordKind = chordKind;
        this.degrees = degrees;
    }

    public static createCustomChord(
        altName: string,
        chordKind: ChordSymbolEnum,
        degrees: DegreesInfo,
    ): CustomChord {
        return new CustomChord(altName, chordKind, degrees);
    }

    public static renameCustomChord(
        altName: string,
        newAltName: string,
        customChords: CustomChord[],
    ): void {
        for (const customChord of customChords) {
            if (customChord.alternateName === altName) {
                customChord.alternateName = newAltName;
            }
        }
    }
}

export enum ChordDegreeText {
    add,
    alter,
    subtract
}

export enum ChordSymbolEnum {
    major,
    minor,
    augmented,
    diminished,
    dominant,
    majorseventh,
    minorseventh,
    diminishedseventh,
    augmentedseventh,
    halfdiminished,
    majorminor,
    majorsixth,
    minorsixth,
    dominantninth,
    majorninth,
    minorninth,
    dominant11th,
    major11th,
    minor11th,
    dominant13th,
    major13th,
    minor13th,
    suspendedsecond,
    suspendedfourth,
    Neapolitan,
    Italian,
    French,
    German,
    pedal,
    power,
    Tristan,
    none
}
