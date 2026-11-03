import { expect } from "chai";
import { OpenSheetMusicDisplay } from "../../../src/OpenSheetMusicDisplay/OpenSheetMusicDisplay";
import { TestUtils } from "../../Util/TestUtils";
import { Note } from "../../../src/MusicalScore/VoiceData/Note";
import { MidiInstrument } from "../../../src/MusicalScore/VoiceData/Instructions/ClefInstruction";
import { SubInstrument } from "../../../src/MusicalScore/SubInstrument";
import { SourceMeasure } from "../../../src/MusicalScore/VoiceData/SourceMeasure";

/**
 * MusicXML 4.0 data that is stored and not drawn: listen, swing, players, instrument sound, IPA.
 */
describe("MusicXML 4.0 stored data", () => {
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

    function firstNote(): Note {
        return osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers[0].StaffEntries[0].VoiceEntries[0].Notes[0];
    }

    it("stores assess, wait, other-listen, and the player", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_listen.musicxml"));
        const note: Note = firstNote();
        expect(note.Listen.assess).to.deep.equal({ type: "no", player: "PL1" });
        expect(note.Listen.wait).to.deep.equal({ player: "PL1" });
        expect(note.Listen.others).to.deep.equal([{ type: "cue", player: "PL1", text: "breath" }]);
        expect(osmd.Sheet.Instruments[0].Players).to.deep.equal([{ id: "PL1", name: "Soloist" }]);
        osmd.render();
        expect(container.textContent).to.not.include("breath");
    });

    it("stores sync and other-listening without extra notation", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_listening.musicxml"));
        const measure: SourceMeasure = osmd.Sheet.SourceMeasures[0];
        expect(measure.Listening[0].syncs).to.deep.equal([{ type: "tempo", latency: 40, player: "PL1" }]);
        expect(measure.Listening[0].others).to.deep.equal([{ type: "section", player: "PL1", text: "verse" }]);
        expect(osmd.Sheet.Instruments[0].Players[0].name).to.equal("Soloist");
        osmd.render();
        expect(container.textContent).to.include("follow");
        expect(container.textContent).to.not.include("verse");
    });

    it("stores a swing ratio and leaves the eighths even", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_swing.musicxml"));
        expect(osmd.Sheet.SourceMeasures[0].Swings).to.deep.equal([{
            straight: false,
            first: 2,
            second: 1,
            type: "eighth",
            style: "swing eighths",
        }]);
        const durations: number[] = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers
            .slice(0, 4)
            .map((entry: { StaffEntries: { VoiceEntries: { Notes: Note[] }[] }[] }) =>
                entry.StaffEntries[0].VoiceEntries[0].Notes[0].Length.RealValue);
        expect(durations).to.deep.equal([0.25, 0.25, 0.25, 0.25]);
        osmd.render();
        expect(container.textContent).to.include("Swing");
        expect(container.textContent).to.not.include("swing eighths");
    });

    it("stores an explicit straight swing", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_swing_straight.musicxml"));
        expect(osmd.Sheet.SourceMeasures[0].Swings).to.deep.equal([{
            straight: true,
            style: "even",
        }]);
        osmd.render();
    });

    it("stores an instrument change without rewriting the clarinet", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_instrument_change.musicxml"));
        const sub: SubInstrument = osmd.Sheet.Instruments[0].SubInstruments[0];
        expect(sub.name).to.equal("Clarinet");
        expect(sub.InstrumentSound).to.equal("wind.reed.clarinet.bflat");
        expect(sub.midiInstrumentID).to.equal(MidiInstrument.Clarinet);
        expect(osmd.Sheet.SourceMeasures[0].InstrumentChanges).to.deep.equal([{
            id: "P1-I1",
            sound: "wind.reed.clarinet.piccolo",
            measureTime: 0.25,
        }]);
        osmd.render();
        expect(container.textContent).to.include("picc. cl.");
    });

    it("keeps both instrument ids and one notehead", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_multiple_instrument.musicxml"));
        const note: Note = firstNote();
        expect(note.InstrumentIds).to.deep.equal(["P1-I1", "P1-I2"]);
        expect(note.PlaybackInstrumentId).to.equal("P1-I2");
        osmd.render();
        const noteheads: NodeListOf<Element> = container.querySelectorAll("g.vf-notehead");
        const pitched: number = osmd.Sheet.SourceMeasures[0].VerticalSourceStaffEntryContainers.length;
        expect(noteheads.length).to.equal(pitched);
    });

    it("stores the IPA and still draws the lyric", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_ipa.musicxml"));
        const note: Note = firstNote();
        const lyric: string = note.ParentVoiceEntry.LyricsEntries.getValue("1").Text;
        expect(note.Ipa).to.equal("əɓ");
        expect(lyric).to.equal("ah");
        osmd.render();
        expect(container.textContent).to.include("ah");
        expect(container.textContent).to.not.include("əɓ");
    });

    it("stores the eight instrument-sound ids and leaves the MIDI guess", async () => {
        await osmd.load(TestUtils.getScore("test_mxl4_instrument_sounds.musicxml"));
        const sounds: SubInstrument[] = osmd.Sheet.Instruments[0].SubInstruments;
        expect(sounds.map((sub: SubInstrument) => sub.InstrumentSound)).to.deep.equal([
            "wind.flutes.whistle.tin.c",
            "drum.tabor",
            "drum.tamborim",
            "pitched-percussion.handchimes",
            "pluck.cavaquinho",
            "wind.reed.clarinet.d",
            "wind.reed.clarinet.g",
            "wind.reed.clarinet.piccolo",
        ]);
        expect(sounds[5].midiInstrumentID).to.equal(MidiInstrument.Clarinet);
        expect(sounds[6].midiInstrumentID).to.equal(MidiInstrument.Clarinet);
        expect(sounds[0].midiInstrumentID).to.equal(MidiInstrument.Acoustic_Grand_Piano);
        expect(sounds[7].midiInstrumentID).to.equal(MidiInstrument.Clarinet);
        osmd.render();
        expect(container.querySelectorAll("g.vf-notehead").length).to.equal(1);
    });
});
