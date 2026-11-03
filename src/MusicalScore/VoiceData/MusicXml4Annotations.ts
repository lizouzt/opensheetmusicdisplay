import { IXmlElement } from "../../Common/FileIO/Xml";

/** A performer declared by score-part/player. */
export interface ScorePlayer {
    id: string;
    name: string;
}

/** assess child of note/listen. */
export interface NoteListenAssess {
    type: string;
    player: string;
}

/** wait child of note/listen. */
export interface NoteListenWait {
    player: string;
}

/** other-listen child of note/listen. */
export interface NoteOtherListen {
    type: string;
    player: string;
    text: string;
}

/** MusicXML listen on a note. Stored only; nothing extra is drawn. */
export interface NoteListen {
    assess?: NoteListenAssess;
    wait?: NoteListenWait;
    others: NoteOtherListen[];
}

/** sync child of direction/listening. */
export interface ListeningSync {
    type: string;
    latency: number;
    player: string;
}

/** other-listening child of direction/listening. */
export interface OtherListening {
    type: string;
    player: string;
    text: string;
}

/** MusicXML listening on a direction. Stored only. */
export interface Listening {
    syncs: ListeningSync[];
    others: OtherListening[];
}

/** MusicXML sound/swing. straight is true when the straight element is present. Notation is unchanged. */
export interface Swing {
    straight: boolean;
    first?: number;
    second?: number;
    type?: string;
    style?: string;
}

/** MusicXML sound/instrument-change. The written staff is unchanged. */
export interface InstrumentChange {
    id: string;
    sound: string;
    /** Position in the measure, in whole notes. */
    measureTime: number;
}

function numberValue(node: IXmlElement): number | undefined {
    const value: number = parseFloat(node?.value);
    return isNaN(value) ? undefined : value;
}

export function readNoteListen(node: IXmlElement): NoteListen {
    const assessNode: IXmlElement = node.element("assess");
    const waitNode: IXmlElement = node.element("wait");
    const listen: NoteListen = { others: [] };
    if (assessNode) {
        listen.assess = {
            type: assessNode.attribute("type")?.value,
            player: assessNode.attribute("player")?.value,
        };
    }
    if (waitNode) {
        listen.wait = { player: waitNode.attribute("player")?.value };
    }
    for (const other of node.elements("other-listen")) {
        listen.others.push({
            type: other.attribute("type")?.value,
            player: other.attribute("player")?.value,
            text: other.value,
        });
    }
    return listen;
}

export function readListening(node: IXmlElement): Listening {
    const listening: Listening = { syncs: [], others: [] };
    for (const sync of node.elements("sync")) {
        const latency: number = parseFloat(sync.attribute("latency")?.value);
        listening.syncs.push({
            type: sync.attribute("type")?.value,
            latency: isNaN(latency) ? undefined : latency,
            player: sync.attribute("player")?.value,
        });
    }
    for (const other of node.elements("other-listening")) {
        listening.others.push({
            type: other.attribute("type")?.value,
            player: other.attribute("player")?.value,
            text: other.value,
        });
    }
    return listening;
}

export function readSwing(node: IXmlElement): Swing {
    const swing: Swing = { straight: !!node.element("straight") };
    const first: number = numberValue(node.element("first"));
    const second: number = numberValue(node.element("second"));
    if (first !== undefined) {
        swing.first = first;
    }
    if (second !== undefined) {
        swing.second = second;
    }
    const type: string = node.element("swing-type")?.value;
    const style: string = node.element("swing-style")?.value;
    if (type) {
        swing.type = type;
    }
    if (style) {
        swing.style = style;
    }
    return swing;
}

export function readInstrumentChange(node: IXmlElement, measureTime: number): InstrumentChange {
    return {
        id: node.attribute("id")?.value,
        sound: node.element("instrument-sound")?.value,
        measureTime: measureTime,
    };
}
