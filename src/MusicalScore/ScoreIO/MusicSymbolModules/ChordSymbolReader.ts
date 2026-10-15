import {IXmlElement, IXmlAttribute} from "../../../Common/FileIO/Xml";
import {MusicSheet} from "../../MusicSheet";
import {ChordDegreeText, ChordSymbolContainer, ChordSymbolEnum, Degree, HarmonyArrangement, HarmonyChord} from "../../VoiceData/ChordSymbolContainer";
import {AccidentalEnum, NoteEnum, Pitch} from "../../../Common/DataObjects/Pitch";
import {KeyInstruction} from "../../VoiceData/Instructions/KeyInstruction";
import {ITextTranslation} from "../../Interfaces/ITextTranslation";
import log from "loglevel";
import { PlacementEnum } from "../../VoiceData/Expressions/AbstractExpression";

export class ChordSymbolReader {
    public static readChordSymbol(xmlNode: IXmlElement, musicSheet: MusicSheet, activeKey: KeyInstruction): ChordSymbolContainer {
        if (ChordSymbolReader.isExtendedHarmony(xmlNode)) {
            return ChordSymbolReader.readExtendedHarmony(xmlNode, musicSheet);
        }
        const root: IXmlElement = xmlNode.element("root");
        const kind: IXmlElement = xmlNode.element("kind");
        const numeral: IXmlElement = xmlNode.element("numeral");
        const kindText: IXmlAttribute = kind.attribute("text");

        // must be always present
        if (!root && !numeral) { // function is also possible, but deprecated.
          return undefined;
        }

        // bass is optional
        let bassPitch: Pitch = undefined;
        const bass: IXmlElement = xmlNode.element("bass");
        if (bass) {
            const bassStep: IXmlElement = bass.element("bass-step");
            const bassAlter: IXmlElement = bass.element("bass-alter");
            let bassNote: NoteEnum = NoteEnum.C;
            if (bassStep) {
                try {
                    bassNote = NoteEnum[bassStep.value.trim()];
                } catch (ex) {
                    const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError",
                                                                            "Invalid chord symbol");
                    musicSheet.SheetErrors.pushMeasureError(errorMsg);
                    log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
                    return undefined;
                }
            }
            let bassAlteration: AccidentalEnum = AccidentalEnum.NONE;
            if (bassAlter) {
                try {
                    bassAlteration = Pitch.AccidentalFromHalfTones(parseInt(bassAlter.value, 10));
                } catch (ex) {
                    const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError",
                                                                            "Invalid chord symbol");
                    musicSheet.SheetErrors.pushMeasureError(errorMsg);
                    log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
                }
            }
            bassPitch = new Pitch(bassNote, 1, bassAlteration);
        }

        // degrees are optional
        const degrees: Degree[] = [];
        const degreeNodes: IXmlElement[] = xmlNode.elements("degree");
        for (const degreeNode of degreeNodes) {
            if (degreeNode) {
                const degreeValue: IXmlElement = degreeNode.element("degree-value");
                const degreeAlter: IXmlElement = degreeNode.element("degree-alter");
                const degreeType: IXmlElement = degreeNode.element("degree-type");
                if (!degreeValue || !degreeAlter || !degreeType) {
                    return undefined;
                }

                let value: number;
                try {
                    value = parseInt(degreeValue.value.trim(), 10);
                } catch (ex) {
                    const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError",
                                                                            "Invalid chord symbol");
                    musicSheet.SheetErrors.pushMeasureError(errorMsg);
                    log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
                    return undefined;
                }

                let alter: AccidentalEnum;
                try {
                    alter = Pitch.AccidentalFromHalfTones(parseInt(degreeAlter.value, 10));
                } catch (ex) {
                    const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError",
                                                                            "Invalid chord symbol");
                    musicSheet.SheetErrors.pushMeasureError(errorMsg);
                    log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
                    return undefined;
                }

                let text: ChordDegreeText;
                try {
                    text = ChordDegreeText[degreeType.value.trim().toLowerCase()];
                } catch (ex) {
                    const errorMsg: string = ITextTranslation.translateText(
                        "ReaderErrorMessages/ChordSymbolError",
                        "Invalid chord symbol"
                    );
                    musicSheet.SheetErrors.pushMeasureError(errorMsg);
                    log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
                    return undefined;
                }

                degrees.push(new Degree(value, alter, text));
            }
        }

        let placement: PlacementEnum = ChordSymbolReader.readPlacement(xmlNode); // optional
        if (placement !== PlacementEnum.Below) { // could also be NotYetDefined
            placement = PlacementEnum.Above;
        }
        if (numeral) {
            const numeralElement: IXmlElement = numeral.element("numeral-root");
            const numeralElementText: string = numeralElement?.attribute("text")?.value; // this is optional
            const numeralString: string = numeralElementText ?? numeralElement?.value;
            const container: ChordSymbolContainer = new ChordSymbolContainer(
                undefined, ChordSymbolEnum.none, bassPitch, degrees, musicSheet.Rules, placement
            );
            container.NumeralText = numeralString;
            return container;
        }

        const rootStep: IXmlElement = root.element("root-step");
        const rootAlter: IXmlElement = root.element("root-alter");

        // a valid NoteEnum value should be present
        if (root && !rootStep) {
            return undefined;
        }
        let rootNote: NoteEnum;
        try {
            rootNote = NoteEnum[rootStep.value.trim()];
        } catch (ex) {
            const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError",
                                                                    "Invalid chord symbol");
            musicSheet.SheetErrors.pushMeasureError(errorMsg);
            log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
            return undefined;
        }

        // an alteration value isn't necessary
        let rootAlteration: AccidentalEnum = AccidentalEnum.NONE;
        if (rootAlter) {
            try {
                rootAlteration = Pitch.AccidentalFromHalfTones(parseInt(rootAlter.value, 10));
            } catch (ex) {
                const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError",
                                                                        "Invalid chord symbol");
                musicSheet.SheetErrors.pushMeasureError(errorMsg);
                log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
            }
        }

        // using default octave value, to be changed later
        const rootPitch: Pitch = new Pitch(rootNote, 1, rootAlteration);
        // only exists if we have a root node instead of a numeral node

        // kind is optional if there is a numeral (or function (deprecated)) instead
        let kindValue: string = kind.value.trim().replace("-", "");
        if (kindText) {
            switch (kindText.value) {
                case "aug":
                    kindValue = "augmented";
                    break;
                case "dim":
                    kindValue = "diminished";
                    break;
                default:
            }
        }
        let chordKind: ChordSymbolEnum;
        try {
            chordKind = ChordSymbolEnum[kindValue];
        } catch (ex) {
            const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError",
                                                                    "Invalid chord symbol");
            musicSheet.SheetErrors.pushMeasureError(errorMsg);
            log.debug("InstrumentReader.readChordSymbol", errorMsg, ex);
            return undefined;
        }

        return new ChordSymbolContainer(rootPitch, chordKind, bassPitch, degrees, musicSheet.Rules, placement);
    }

    /** Stacked numerals, a deprecated function, inversion text, or a bass separator. A plain root or numeral stays on the old path. */
    private static isExtendedHarmony(xmlNode: IXmlElement): boolean {
        const children: IXmlElement[] = xmlNode.elements();
        let chordStarts: number = 0;
        let hasFunction: boolean = false;
        for (const child of children) {
            if (child.name === "root" || child.name === "numeral" || child.name === "function") {
                chordStarts++;
            }
            if (child.name === "function") {
                hasFunction = true;
            }
            if (child.name === "numeral") {
                if (child.element("numeral-key")) {
                    return true;
                }
                const alter: IXmlElement = child.element("numeral-alter");
                if (alter && alter.value.trim() !== "" && alter.value.trim() !== "0") {
                    return true;
                }
            }
            if (child.name === "inversion" && child.attribute("text")) {
                return true;
            }
            if (child.name === "bass" && (child.element("bass-separator") || child.attribute("arrangement"))) {
                return true;
            }
        }
        return hasFunction || chordStarts > 1 || !!xmlNode.attribute("arrangement");
    }

    private static readExtendedHarmony(xmlNode: IXmlElement, musicSheet: MusicSheet): ChordSymbolContainer {
        const chords: HarmonyChord[] = [];
        let current: HarmonyChord = undefined;
        for (const child of xmlNode.elements()) {
            if (child.name === "root" || child.name === "numeral" || child.name === "function") {
                if (current) {
                    chords.push(current);
                }
                current = new HarmonyChord();
                if (child.name === "root") {
                    current.RootPitch = ChordSymbolReader.readRootPitch(child, musicSheet);
                    if (!current.RootPitch && child.element("root-step")) {
                        return undefined;
                    }
                } else if (child.name === "numeral") {
                    ChordSymbolReader.readNumeral(child, current);
                } else {
                    current.FunctionText = child.value;
                    log.warn("ChordSymbolReader.readChordSymbol", "MusicXML <function> is deprecated; use <numeral>.");
                }
                continue;
            }
            if (!current || child.name === "frame" || child.name === "offset" || child.name === "staff") {
                continue;
            }
            if (child.name === "kind") {
                current.KindText = child.attribute("text")?.value;
                current.ChordKind = ChordSymbolReader.readKind(child, musicSheet);
            } else if (child.name === "inversion") {
                current.InversionText = child.attribute("text")?.value;
            } else if (child.name === "bass") {
                current.BassPitch = ChordSymbolReader.readBassPitch(child, musicSheet);
                current.BassSeparator = child.element("bass-separator")?.value;
                current.BassArrangement = ChordSymbolReader.readArrangement(child.attribute("arrangement")?.value);
            } else if (child.name === "degree") {
                const degree: Degree = ChordSymbolReader.readDegree(child, musicSheet);
                if (!degree) {
                    return undefined;
                }
                current.Degrees.push(degree);
            }
        }
        if (current) {
            chords.push(current);
        }
        if (chords.length === 0) {
            return undefined;
        }
        const first: HarmonyChord = chords[0];
        let placement: PlacementEnum = ChordSymbolReader.readPlacement(xmlNode);
        if (placement !== PlacementEnum.Below) {
            placement = PlacementEnum.Above;
        }
        const container: ChordSymbolContainer = new ChordSymbolContainer(
            first.RootPitch, first.ChordKind ?? ChordSymbolEnum.none, first.BassPitch, first.Degrees, musicSheet.Rules, placement
        );
        container.NumeralText = first.NumeralText;
        container.FunctionText = first.FunctionText;
        container.HarmonyChords = chords;
        container.Arrangement = ChordSymbolReader.readArrangement(xmlNode.attribute("arrangement")?.value);
        return container;
    }

    private static readNumeral(numeral: IXmlElement, chord: HarmonyChord): void {
        const root: IXmlElement = numeral.element("numeral-root");
        chord.NumeralText = root?.attribute("text")?.value ?? root?.value;
        const alter: IXmlElement = numeral.element("numeral-alter");
        if (alter) {
            const parsed: number = parseInt(alter.value, 10);
            if (!isNaN(parsed)) {
                chord.NumeralAlter = parsed;
            }
            chord.NumeralAlterPrint = alter.attribute("print-object")?.value !== "no";
            chord.NumeralAlterOnLeft = alter.attribute("location")?.value === "left";
        }
        const keyNode: IXmlElement = numeral.element("numeral-key");
        if (keyNode) {
            const fifths: number = parseInt(keyNode.element("numeral-fifths")?.value, 10);
            if (!isNaN(fifths)) {
                chord.NumeralFifths = fifths;
            }
            chord.NumeralMode = keyNode.element("numeral-mode")?.value;
            chord.NumeralKeyPrint = keyNode.attribute("print-object")?.value !== "no";
        }
    }

    private static readArrangement(value: string): HarmonyArrangement {
        if (value === HarmonyArrangement.Vertical || value === HarmonyArrangement.Horizontal || value === HarmonyArrangement.Diagonal) {
            return value as HarmonyArrangement;
        }
        return undefined;
    }

    private static readKind(kind: IXmlElement, musicSheet: MusicSheet): ChordSymbolEnum {
        if (!kind?.value) {
            return undefined;
        }
        let kindValue: string = kind.value.trim().replace("-", "");
        const kindText: string = kind.attribute("text")?.value;
        if (kindText === "aug") {
            kindValue = "augmented";
        } else if (kindText === "dim") {
            kindValue = "diminished";
        }
        if (ChordSymbolEnum[kindValue] === undefined) {
            const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError", "Invalid chord symbol");
            musicSheet.SheetErrors.pushMeasureError(errorMsg);
            log.debug("ChordSymbolReader.readKind", errorMsg, kindValue);
            return undefined;
        }
        return ChordSymbolEnum[kindValue] as ChordSymbolEnum;
    }

    private static readRootPitch(root: IXmlElement, musicSheet: MusicSheet): Pitch {
        const rootStep: IXmlElement = root.element("root-step");
        if (!rootStep) {
            return undefined;
        }
        return ChordSymbolReader.readStepPitch(rootStep.value, root.element("root-alter")?.value, musicSheet);
    }

    private static readBassPitch(bass: IXmlElement, musicSheet: MusicSheet): Pitch {
        const bassStep: IXmlElement = bass.element("bass-step");
        if (!bassStep) {
            return undefined;
        }
        return ChordSymbolReader.readStepPitch(bassStep.value, bass.element("bass-alter")?.value, musicSheet);
    }

    private static readStepPitch(step: string, alter: string, musicSheet: MusicSheet): Pitch {
        if (NoteEnum[step?.trim()] === undefined) {
            const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError", "Invalid chord symbol");
            musicSheet.SheetErrors.pushMeasureError(errorMsg);
            log.debug("ChordSymbolReader.readStepPitch", errorMsg, step);
            return undefined;
        }
        let alteration: AccidentalEnum = AccidentalEnum.NONE;
        if (alter !== undefined) {
            try {
                alteration = Pitch.AccidentalFromHalfTones(parseInt(alter, 10));
            } catch (ex) {
                const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError", "Invalid chord symbol");
                musicSheet.SheetErrors.pushMeasureError(errorMsg);
                log.debug("ChordSymbolReader.readStepPitch", errorMsg, ex);
            }
        }
        return new Pitch(NoteEnum[step.trim()] as NoteEnum, 1, alteration);
    }

    private static readDegree(degreeNode: IXmlElement, musicSheet: MusicSheet): Degree {
        const degreeValue: IXmlElement = degreeNode.element("degree-value");
        const degreeAlter: IXmlElement = degreeNode.element("degree-alter");
        const degreeType: IXmlElement = degreeNode.element("degree-type");
        if (!degreeValue || !degreeAlter || !degreeType) {
            return undefined;
        }
        const value: number = parseInt(degreeValue.value.trim(), 10);
        if (isNaN(value) || ChordDegreeText[degreeType.value.trim().toLowerCase()] === undefined) {
            const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError", "Invalid chord symbol");
            musicSheet.SheetErrors.pushMeasureError(errorMsg);
            log.debug("ChordSymbolReader.readDegree", errorMsg);
            return undefined;
        }
        let alter: AccidentalEnum = AccidentalEnum.NONE;
        try {
            alter = Pitch.AccidentalFromHalfTones(parseInt(degreeAlter.value, 10));
        } catch (ex) {
            const errorMsg: string = ITextTranslation.translateText("ReaderErrorMessages/ChordSymbolError", "Invalid chord symbol");
            musicSheet.SheetErrors.pushMeasureError(errorMsg);
            log.debug("ChordSymbolReader.readDegree", errorMsg, ex);
            return undefined;
        }
        return new Degree(value, alter, ChordDegreeText[degreeType.value.trim().toLowerCase()] as ChordDegreeText);
    }

    static readPlacement(node: IXmlElement): PlacementEnum {
        const value: string = node.attribute("placement")?.value;
        if (value === "above") {
            return PlacementEnum.Above;
        } else if (value === "below") {
            return PlacementEnum.Below;
        } else {
            return PlacementEnum.NotYetDefined;
        }
    }
}
