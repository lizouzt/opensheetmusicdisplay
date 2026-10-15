import { IXmlElement } from "./Xml";
import JSZip from "jszip";
import log from "loglevel";

export class MXLFile {
    private blob: Blob;
    public zipFile: JSZip;
    public xmlText: string;
    /** Set after tryUnzip(). True if it could be unzipped successfully. */
    public unzipSuccessful: boolean = false;
    public constructor(blob: Blob) {
        this.blob = blob;
    }

    /** Try unzipping to see if this is a zip file.
     * This is a separate method so that we don't need to unzip twice to check whether it's a zip file.
     */
    public async tryUnzip(): Promise<boolean> {
        this.zipFile = new JSZip();
        try {
            this.unzipSuccessful = true;
            await this.zipFile.loadAsync(this.blob);
            return true;
        } catch (e) {
            this.unzipSuccessful = false;
            return false;
        }
    }

    public getXmlString(): Promise<string> {
        return MXLHelper.jszipToXMLstring(this.zipFile);
    }
}

/**
 * Some helper methods to handle MXL files.
 */
export class MXLHelper {
    /** Returns the documentElement of MXL data. */
    public static MXLtoIXmlElement(data: string): Promise<IXmlElement> {
        return this.MXLtoXMLstring(data)
        .then(
            (content: string) => {
                const parser: DOMParser = new DOMParser();
                const xml: Document = parser.parseFromString(content, "text/xml");
                const doc: IXmlElement = new IXmlElement(xml.documentElement);
                return Promise.resolve(doc);
            },
            (err: any) => {
                throw new Error("extractSheetFromMxl: " + err.message);
            }
        );
    }

    public static async jszipToXMLstring(zip: JSZip): Promise<string> {
        // asynchronously load zip file and process it - with Promises
        let container: string = await zip.file("META-INF/container.xml").async("text");
        if (!container.startsWith("<")) {
            const uint8Array: Uint8Array = await zip.file("META-INF/container.xml").async("uint8array");
            container = new TextDecoder("utf-8").decode(uint8Array);
        }
        if (!container.startsWith("<")) {
            // assume UTF-16
            const uint8Array: Uint8Array = await zip.file("META-INF/container.xml").async("uint8array");
            container = new TextDecoder("utf-16").decode(uint8Array);
        }
        const parser: DOMParser = new DOMParser();
        const doc: Document = parser.parseFromString(container, "text/xml");
        const rootFile: string = this.musicXmlRootPath(doc);
        return this.readEntry(zip, rootFile);
    }

    /**
     * Path of the main score inside a container.xml document.
     * A rootfile with no media-type is MusicXML, which is how files from before MusicXML 4.0 are written.
     * When several rootfiles are present, the first MusicXML one is the score; later ones may be a PDF,
     * audio, or a part file. If none of them is MusicXML, the first entry is used, the previous behavior.
     */
    public static musicXmlRootPath(containerDocument: Document): string {
        const rootFiles: HTMLCollectionOf<Element> = containerDocument.getElementsByTagName("rootfile");
        if (rootFiles.length === 0) {
            throw new Error("MXL container has no rootfile");
        }
        for (let idx: number = 0; idx < rootFiles.length; idx++) {
            if (this.isMusicXmlMediaType(rootFiles[idx].getAttribute("media-type"))) {
                const fullPath: string = rootFiles[idx].getAttribute("full-path");
                if (fullPath) {
                    return fullPath;
                }
            }
        }
        return rootFiles[0].getAttribute("full-path");
    }

    /**
     * True for a MusicXML rootfile. An empty media-type means MusicXML, per the container specification.
     * The two registered types are the uncompressed score and the compressed container.
     */
    public static isMusicXmlMediaType(mediaType: string | null): boolean {
        if (!mediaType || mediaType.trim() === "") {
            return true;
        }
        const normalized: string = mediaType.trim().toLowerCase();
        return normalized === "application/vnd.recordare.musicxml+xml"
            || normalized === "application/vnd.recordare.musicxml";
    }

    /** Text of one zip entry, decoding UTF-16 the same way as the main score. */
    public static async readEntry(zip: JSZip, fullPath: string): Promise<string> {
        const entry: JSZip.JSZipObject | null = zip.file(fullPath);
        if (!entry) {
            throw new Error("MXL entry not found: " + fullPath);
        }
        const xmlText: string = await entry.async("text");
        if (!xmlText.substring(0, 1).startsWith("<")) {
            // assume UTF-16
            const uint8Array: Uint8Array = await entry.async("uint8array");
            return new TextDecoder("utf-16").decode(uint8Array);
        }
        return xmlText;
    }

    public static MXLtoXMLstring(data: string | Blob): Promise<string> {
        const zip:  JSZip = new JSZip();
        return zip.loadAsync(data).then(
            async (_: any) => {
                return this.jszipToXMLstring(zip);
            },
            (err: any) => {
                log.error(err);
                throw err;
            }
        );
    }
}
