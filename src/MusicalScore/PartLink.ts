import { IXmlAttribute, IXmlElement } from "../Common/FileIO/Xml";

/**
 * A MusicXML 4.0 &lt;part-link&gt;: the path of a part file inside the same compressed .mxl,
 * relative to the zip root, plus the score-instrument ids and group names it covers.
 */
export class PartLink {
    /** xlink:href, a path relative to the root of the zip file. */
    public href: string = "";
    /** id attributes of the instrument-link children. */
    public instrumentIds: string[] = [];
    /** Text of the group-link children. */
    public groupLinks: string[] = [];

    public static fromXml(element: IXmlElement): PartLink {
        const link: PartLink = new PartLink();
        link.href = PartLink.hrefOf(element);
        const instrumentLinks: IXmlElement[] = element.elements("instrument-link");
        for (let idx: number = 0, len: number = instrumentLinks.length; idx < len; ++idx) {
            const idAttribute: IXmlAttribute = instrumentLinks[idx].attribute("id");
            if (idAttribute && idAttribute.value) {
                link.instrumentIds.push(idAttribute.value);
            }
        }
        const groupLinks: IXmlElement[] = element.elements("group-link");
        for (let idx: number = 0, len: number = groupLinks.length; idx < len; ++idx) {
            if (groupLinks[idx].value) {
                link.groupLinks.push(groupLinks[idx].value);
            }
        }
        return link;
    }

    /** xlink:href, whether the parser exposes it as "xlink:href" or as a namespaced "href". */
    private static hrefOf(element: IXmlElement): string {
        const named: IXmlAttribute = element.attribute("xlink:href");
        if (named && named.value) {
            return named.value;
        }
        const attributes: IXmlAttribute[] = element.attributes();
        for (let idx: number = 0, len: number = attributes.length; idx < len; ++idx) {
            const attribute: IXmlAttribute = attributes[idx];
            if (attribute.localName === "href" && attribute.value) {
                return attribute.value;
            }
        }
        return "";
    }
}
