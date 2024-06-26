import { SymbolInfo, SymbolProvider } from "./shared";

const reject = () => Promise.reject(new Error());

export default class OpenGrokProvider implements SymbolProvider {
    isSupported(): boolean {
        return document.querySelectorAll("#whole_header").length != 0;
    }
    getCurrentSymbol(x: number, y: number): Promise<SymbolInfo> {
        // Copied from https://github.com/oracle/opengrok/blob/f10696b0af4c476dea4295eece5cd95fa222d136/opengrok-web/src/main/webapp/js/utils-0.0.45.js#L2211
        // but translated to pure JS and using provided y location
        let c = document.elementFromPoint(x, y);

        if (c == null || !document.getElementById("content")?.contains(c)) return reject();

        const par = c.closest(".scope-body, .scope-head");

        if (par == null) {
            return reject();
        }

        const head = par.classList.contains("scope-body") ? par.previousElementSibling : par;

        if (head == null) return reject();

        const sig = head.firstChild!;
        const fileName = document.querySelector("#Masthead > a:last-of-type")!;
        let line = head.querySelector("a.l");
        if (line == null) {
            line = head.querySelector("a.hl")!;
        }

        const url = new URL(document.location.href);
        url.hash = "#" + line.getAttribute("name");

        let sigMinimal = sig.textContent!;
        if (sigMinimal.includes("(")) {
            sigMinimal = sigMinimal.substring(0, sigMinimal.indexOf("(")).trim();
        }

        // TODO: support xc, xn to get class or namespace
        const fileNameContent = fileName.textContent!;
        return Promise.resolve({
            sourceType: "OpenGrok",
            sig: `${fileNameContent}::\n${sigMinimal}`,
            fileName: fileNameContent,
            site: url.host,
            line: parseInt(line.getAttribute("name")!),
            address: url.toString(),
        });
    }
    getCurrentLineSymbol(x: number, y: number): Promise<SymbolInfo> {
        // Copied from https://github.com/oracle/opengrok/blob/f10696b0af4c476dea4295eece5cd95fa222d136/opengrok-web/src/main/webapp/js/utils-0.0.45.js#L2211
        // but translated to pure JS and using provided y location
        let c = document.elementFromPoint(x, y);

        if (c == null || !document.getElementById("content")?.contains(c)) return reject();

        while (c && !(c.classList.contains("l") || c.classList.contains("hl"))) {
            c = c.previousElementSibling;
        }

        if (c == null) {
            return reject();
        }

        const fileName = document.querySelector("#Masthead > a:last-of-type");
        const lineNumber = parseInt(c.getAttribute("name")!);

        const url = new URL(document.location.href);
        url.hash = "#" + lineNumber;

        let sigMinimal = null;

        const par = c.closest(".scope-body, .scope-head");

        if (par != null) {
            const head = par.classList.contains("scope-body") ? par.previousElementSibling : par;

            const sig = head!.firstChild!;

            sigMinimal = sig.textContent!;
            if (sigMinimal.includes("(")) {
                sigMinimal = sigMinimal.substring(0, sigMinimal.indexOf("(")).trim();
            }
        }

        const fileNameContent = fileName!.textContent!;
        const sig = sigMinimal
            ? `${fileNameContent}::\n${sigMinimal}:${lineNumber}`
            : `${fileNameContent}:${lineNumber}`;

        return Promise.resolve({
            sourceType: "OpenGrok",
            sig: sig,
            fileName: fileNameContent,
            site: url.host,
            line: lineNumber,
            address: url.toString(),
        });
    }
}
