/* Prefs */

const PREF_KEYS = ["tabBehavior"];

export type TabBehavior = "alwaysNew" | "sameIfExists";

export interface Prefs {
    tabBehavior: TabBehavior;
}

const PREFS_DEFAULTS: Prefs = {
    tabBehavior: "alwaysNew",
};

export function getPrefs(onPrefs: (prefs: Prefs) => void) {
    chrome.storage.local
        .get(Object.keys(PREFS_DEFAULTS))
        .then((result) => onPrefs({ ...PREFS_DEFAULTS, ...(result as Partial<Prefs>) }));
}

export function setPrefs(prefs: Partial<Prefs>) {
    chrome.storage.local.set(prefs);
}

/* Inner extension messaging */

export interface GetConnectPullResultMessage {
    action: "getConnectionPullResult";
    status: boolean;
}

export interface GetConnectPullRequestMessage {
    action: "getConnectionPullRequest";
}

export interface ConnectPullMessage {
    action: "connectPull";
    addr: string;
}

export interface GetSymbolRequestMessage {
    action: "getSymbolRequest";
    source: "command" | "contextMenu";
    isLine: boolean;
    askForEdgeText: boolean;
}

export type ExtMessage =
    | GetConnectPullRequestMessage
    | GetConnectPullResultMessage
    | ConnectPullMessage
    | GetSymbolRequestMessage;

export function sendExtMessage(extMsg: ExtMessage): Promise<ExtMessage> {
    return chrome.runtime.sendMessage(extMsg);
}

export function onExtMessage(callback: (msg: ExtMessage) => void) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        callback(msg as ExtMessage);

        sendResponse({});
        return true;
    });
}

export function onExtMessageEx(callback: (msg: ExtMessage, sendResponse: (response: any) => void) => void) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        callback(msg as ExtMessage, sendResponse);
        return true;
    });
}

/* Symbol related types */
export interface SymbolProvider {
    isSupported(): boolean;
    getCurrentSymbol(x: number, y: number): Promise<SymbolInfo>;
    getCurrentLineSymbol(x: number, y: number): Promise<SymbolInfo>;
}

export interface SymbolInfo {
    sourceType: "OpenGrok" | "SourceGraph";
    site: string;
    address: string;
    fileName: string;
    sig: string | null;
    edgeLabel?: string;
    line?: number;
}

export interface SymbolResponse {
    isCorrectWebsite: boolean;
    info: SymbolInfo | null;
}

/* Utils */
export function timeout<T>(prom: Promise<T>, time: number): Promise<T> {
    return Promise.race<T>([prom, new Promise((_r, rej) => setTimeout(rej, time))]);
}

export function reject<T>(): Promise<T> {
    return Promise.reject(new Error());
}
