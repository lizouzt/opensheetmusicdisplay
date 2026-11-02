import { expect } from "chai";
import { TestUtils } from "../../Util/TestUtils";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { MultiExpression } from "../../../src/MusicalScore/VoiceData/Expressions/MultiExpression";
import { ChordSymbolContainer } from "../../../src/MusicalScore/VoiceData/ChordSymbolContainer";
import { SourceStaffEntry } from "../../../src/MusicalScore/VoiceData/SourceStaffEntry";
import { NoteEnum } from "../../../src/Common/DataObjects/Pitch";

/**
 * MusicXML 4.0 direction@system and harmony@system.
 * only-top and only-bottom select this part's top or bottom staff.
 */
describe("MusicXML 4.0 system relation", () => {
    let container: HTMLElement;
    let osmd: OpenSheetMusicDisplay;

    beforeEach(() => {
        container = TestUtils.getDivElement(document);
        container.style.width = "1400px";
        osmd = TestUtils.createOpenSheetMusicDisplay(container);
    });
    afterEach(() => {
        osmd.clear();
        container.remove();
    });

    function score(staves: number, body: string): string {
        const treble: string = "<clef number=\"1\"><sign>G</sign><line>2</line></clef>";
        const bass: string = "<clef number=\"2\"><sign>F</sign><line>4</line></clef>";
        const clefs: string = staves > 1 ? treble + bass : "<clef><sign>G</sign><line>2</line></clef>";
        const lower: string = "<note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration>" +
            "<voice>2</voice><type>quarter</type><staff>2</staff></note>";
        return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes>
      <divisions>1</divisions>
      <staves>${staves}</staves>
      <key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      ${clefs}
    </attributes>
    ${body}
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
    ${staves > 1 ? lower : ""}
  </measure></part>
</score-partwise>`;
    }

    function wordsOn(staffIndex: number): MultiExpression[] {
        const found: MultiExpression[] = [];
        for (const expression of osmd.Sheet.SourceMeasures[0].StaffLinkedExpressions[staffIndex]) {
            if (expression.UnknownList.length > 0) {
                found.push(expression);
            }
        }
        return found;
    }

    function chordsOn(staffIndex: number): ChordSymbolContainer[] {
        const found: ChordSymbolContainer[] = [];
        for (const staffContainer of osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers) {
            const staffEntry: SourceStaffEntry = staffContainer.StaffEntries[staffIndex];
            if (!staffEntry) {
                continue;
            }
            for (const chord of staffEntry.ChordContainers) {
                found.push(chord);
            }
        }
        return found;
    }

    it("keeps only-top words and harmony on the single staff", async () => {
        await osmd.load(score(1, `<direction system="only-top"><direction-type><words>Solo</words></direction-type></direction>
            <harmony system="only-top"><root><root-step>C</root-step></root><kind>major</kind></harmony>`));
        const words: MultiExpression[] = wordsOn(0);
        expect(words.length).to.equal(1);
        expect(words[0].UnknownList[0].Label).to.equal("Solo");
        expect(words[0].SystemRelation).to.equal("only-top");
        const chords: ChordSymbolContainer[] = chordsOn(0);
        expect(chords.length).to.equal(1);
        expect(chords[0].RootPitch.FundamentalNote).to.equal(NoteEnum.C);
        expect(chords[0].SystemRelation).to.equal("only-top");
        osmd.render();
        const texts: string[] = Array.from(container.querySelectorAll("text")).map((element: SVGTextElement): string => element.textContent ?? "");
        expect(texts).to.include("Solo");
        expect(texts).to.include("C");
    });

    it("moves only-bottom words and harmony to the bottom staff", async () => {
        await osmd.load(score(2, `<direction system="only-bottom"><direction-type><words>Bass</words></direction-type><staff>1</staff></direction>
            <harmony system="only-bottom"><root><root-step>G</root-step></root><kind>major</kind><staff>1</staff></harmony>`));
        expect(wordsOn(0).length, "the top staff").to.equal(0);
        const bottomWords: MultiExpression[] = wordsOn(1);
        expect(bottomWords.length).to.equal(1);
        expect(bottomWords[0].UnknownList[0].Label).to.equal("Bass");
        expect(bottomWords[0].SystemRelation).to.equal("only-bottom");
        expect(chordsOn(0).length, "the top staff's chords").to.equal(0);
        const bottomChords: ChordSymbolContainer[] = chordsOn(1);
        expect(bottomChords.length).to.equal(1);
        expect(bottomChords[0].RootPitch.FundamentalNote).to.equal(NoteEnum.G);
        expect(bottomChords[0].SystemRelation).to.equal("only-bottom");
    });

    it("moves only-top words from the bottom staff up to the top staff", async () => {
        await osmd.load(score(2, "<direction system=\"only-top\"><direction-type><words>Top</words></direction-type><staff>2</staff></direction>"));
        expect(wordsOn(1).length).to.equal(0);
        expect(wordsOn(0)[0].UnknownList[0].Label).to.equal("Top");
        expect(wordsOn(0)[0].SystemRelation).to.equal("only-top");
    });

    it("stores also-top and leaves the word on the named staff", async () => {
        await osmd.load(score(2, "<direction system=\"also-top\"><direction-type><words>Both</words></direction-type><staff>2</staff></direction>"));
        expect(wordsOn(0).length, "also-top is not copied onto the top staff").to.equal(0);
        expect(wordsOn(1)[0].UnknownList[0].Label).to.equal("Both");
        expect(wordsOn(1)[0].SystemRelation).to.equal("also-top");
    });
});
