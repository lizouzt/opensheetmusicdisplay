import { expect } from "chai";
/* eslint-disable @typescript-eslint/no-unused-expressions */
import JSZip from "jszip";
import { IXmlElement } from "../../../src/Common/FileIO/Xml";
import { TestUtils } from "../../Util/TestUtils";
import { MXLHelper } from "../../../src/Common/FileIO/Mxl";
import { MusicSheetReader } from "../../../src/MusicalScore/ScoreIO/MusicSheetReader";
import { MusicSheet } from "../../../src/MusicalScore/MusicSheet";
import { Instrument } from "../../../src/MusicalScore/Instrument";

describe("MXL Tests", () => {
  // Generates a test for a mxl file name
  function testFile(scoreName: string): void {
    it(`reads ${scoreName}`, (done: Mocha.Done) => {
      // Load the xml file content
      const mxl: string = TestUtils.getMXL(scoreName);
      expect(mxl).to.not.be.undefined;
      // Extract XML from MXL
      // Warning: the sheet is loaded asynchronously,
      // (with Promises), thus we need a little fix
      // in the end with 'then(null, done)' to
      // make Mocha work asynchronously
      MXLHelper.MXLtoIXmlElement(mxl).then(
        (score: IXmlElement) => {
          expect(score).to.not.be.undefined;
          expect(score.name).to.equal("score-partwise");
          done();
        },
        (exc: any) => { throw exc; }
      ).then(undefined, done);
    });
  }

  // Test all the following mxl files:
  const scores: string[] = [
    "Mozart_Clarinet_Quintet_Excerpt.mxl",
    "test_mxl_with_utf-16_xml.mxl"
  ];
  for (const score of scores) {
    testFile(score);
  }

  const mainScore: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0" xmlns:xlink="http://www.w3.org/1999/xlink">
  <work><work-title>MXL4 Main Score</work-title></work>
  <part-list>
    <score-part id="P1">
      <part-link xlink:href="P1.musicxml" xlink:type="simple">
        <instrument-link id="P1-I1"/>
        <group-link>parts</group-link>
      </part-link>
      <part-name>Clarinet</part-name>
    </score-part>
  </part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>1</divisions><key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef>
    </attributes>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`;

  const partScore: string = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>MXL4 Part Only</work-title></work>
  <part-list><score-part id="P1"><part-name>Clarinet</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`;

  /** A 4.0 container: uncompressed mimetype, then the given rootfiles and scores. */
  async function packaged(container: string): Promise<string> {
    const zip: JSZip = new JSZip();
    zip.file("mimetype", "application/vnd.recordare.musicxml", { compression: "STORE" });
    zip.file("cover.pdf", "%PDF-1.1 not a score");
    zip.file("META-INF/container.xml", container);
    zip.file("score.musicxml", mainScore);
    zip.file("P1.musicxml", partScore);
    return zip.generateAsync({ type: "binarystring" });
  }

  function sheetFromXml(xml: string): MusicSheet {
    const doc: Document = new DOMParser().parseFromString(xml, "text/xml");
    const score: IXmlElement = new IXmlElement(doc.getElementsByTagName("score-partwise")[0]);
    return new MusicSheetReader().createMusicSheet(score, "mxl4");
  }

  it("selects the first MusicXML rootfile when an earlier rootfile is a PDF", async () => {
    const container: string = `<?xml version="1.0" encoding="UTF-8"?>
<container><rootfiles>
  <rootfile full-path="cover.pdf" media-type="application/pdf"/>
  <rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>
  <rootfile full-path="P1.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>
</rootfiles></container>`;
    const xml: string = await MXLHelper.MXLtoXMLstring(await packaged(container));
    expect(xml).to.contain("MXL4 Main Score");
    expect(xml).to.not.contain("MXL4 Part Only");
    expect(xml).to.not.contain("%PDF");
    const sheet: MusicSheet = sheetFromXml(xml);
    const instrument: Instrument = sheet.Instruments[0];
    expect(instrument.Name).to.equal("Clarinet");
    expect(instrument.PartLinks).to.have.length(1);
    expect(instrument.PartLinks[0].href).to.equal("P1.musicxml");
    expect(instrument.PartLinks[0].instrumentIds).to.deep.equal(["P1-I1"]);
    expect(instrument.PartLinks[0].groupLinks).to.deep.equal(["parts"]);
  });

  it("reads the part file named by part-link from the same zip", async () => {
    const container: string = `<?xml version="1.0" encoding="UTF-8"?>
<container><rootfiles>
  <rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>
  <rootfile full-path="cover.pdf" media-type="application/pdf"/>
</rootfiles></container>`;
    const binary: string = await packaged(container);
    const zip: JSZip = await new JSZip().loadAsync(binary);
    const xml: string = await MXLHelper.jszipToXMLstring(zip);
    const sheet: MusicSheet = sheetFromXml(xml);
    const partXml: string = await MXLHelper.readEntry(zip, sheet.Instruments[0].PartLinks[0].href);
    expect(partXml).to.contain("MXL4 Part Only");
  });

  it("keeps an untyped first rootfile as the score when a later rootfile is also MusicXML", async () => {
    const container: string = `<?xml version="1.0" encoding="UTF-8"?>
<container><rootfiles>
  <rootfile full-path="score.musicxml"/>
  <rootfile full-path="P1.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>
</rootfiles></container>`;
    const xml: string = await MXLHelper.MXLtoXMLstring(await packaged(container));
    expect(xml).to.contain("MXL4 Main Score");
    expect(xml).to.not.contain("MXL4 Part Only");
  });

  it("treats a missing media-type as MusicXML and rejects a PDF media-type", () => {
    expect(MXLHelper.isMusicXmlMediaType(null)).to.equal(true);
    expect(MXLHelper.isMusicXmlMediaType("")).to.equal(true);
    expect(MXLHelper.isMusicXmlMediaType(" application/vnd.recordare.musicxml+xml ")).to.equal(true);
    expect(MXLHelper.isMusicXmlMediaType("application/vnd.recordare.musicxml")).to.equal(true);
    expect(MXLHelper.isMusicXmlMediaType("application/pdf")).to.equal(false);
  });

  // Test failure
  it("Corrupted file", (done: Mocha.Done) => {
    MXLHelper.MXLtoIXmlElement("").then(
      (score: IXmlElement) => {
        expect(score).to.not.be.undefined;
        expect(score.name).to.equal("score-partwise");
        done(new Error("Empty zip file was loaded correctly. How is that even possible?"));
      },
      (exc: any) => { done(); }
    );
  });
});
