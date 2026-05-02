import * as vscode from "vscode";
import { findFastHTTPInstances } from "./routeProvider";

export const DIAG_MISSING_ASYNC  = "fasthttp.missing-async";
export const DIAG_MISSING_RETURN = "fasthttp.missing-return";
export const DIAG_MISSING_RESP   = "fasthttp.missing-resp";
export const DIAG_DUPLICATE_URL  = "fasthttp.duplicate-url";

const URL_RE = /url\s*=\s*["'](https?:\/\/[^"']+)["']/;

function buildDecoratorRE(names: Set<string>): RegExp {
    const escaped = [...names]
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
    return new RegExp(
        `^\\s*@(${escaped})\\.(get|post|put|patch|delete|head|options|graphql)\\s*\\(`,
        "i"
    );
}

interface FuncSignature {
    lineIndex: number;
    raw: string;
    isAsync: boolean;
    params: string;
    returnType: string | null;
}

function parseFuncSignature(
    lines: string[],
    startLine: number
): FuncSignature | null {
    for (let i = startLine; i < Math.min(startLine + 8, lines.length); i++) {
        const line = lines[i];
        if (/^\s*(?:async\s+)?def\s+/.test(line)) {
            let full = line;
            let j = i;
            while (!full.includes(":") && j < i + 5 && j + 1 < lines.length) {
                j++;
                full += " " + lines[j].trim();
            }

            const isAsync = /^\s*async\s+def\s+/.test(line);
            const paramsMatch = /def\s+\w+\s*\(([^)]*)\)/.exec(full);
            const returnMatch = /\)\s*->\s*([^:]+)/.exec(full);

            return {
                lineIndex: i,
                raw: full,
                isAsync,
                params: paramsMatch ? paramsMatch[1] : "",
                returnType: returnMatch ? returnMatch[1].trim() : null,
            };
        }
    }
    return null;
}

export class FastHTTPDiagnosticsProvider {
    private collection: vscode.DiagnosticCollection;

    constructor(context: vscode.ExtensionContext) {
        this.collection =
            vscode.languages.createDiagnosticCollection("fasthttp");
        context.subscriptions.push(this.collection);

        vscode.workspace.onDidOpenTextDocument(
            (doc) => this.update(doc),
            null,
            context.subscriptions
        );

        vscode.workspace.onDidChangeTextDocument(
            (e) => this.update(e.document),
            null,
            context.subscriptions
        );

        vscode.workspace.onDidSaveTextDocument(
            (doc) => this.update(doc),
            null,
            context.subscriptions
        );

        vscode.workspace.onDidCloseTextDocument(
            (doc) => this.collection.delete(doc.uri),
            null,
            context.subscriptions
        );

        vscode.workspace.textDocuments.forEach((doc) => this.update(doc));
    }

    private update(document: vscode.TextDocument): void {
        if (document.languageId !== "python") {
            return;
        }
        this.collection.set(document.uri, this.analyze(document));
    }

    private analyze(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = document.getText().split("\n");

        const instances = findFastHTTPInstances(lines);
        if (instances.size === 0) {
            return [];
        }

        const decoratorRE = buildDecoratorRE(instances);

        // Handler quality diagnostics
        for (let i = 0; i < lines.length; i++) {
            const decoratorMatch = decoratorRE.exec(lines[i]);
            if (!decoratorMatch) {
                continue;
            }

            const sig = parseFuncSignature(lines, i + 1);
            if (!sig) {
                continue;
            }

            const defLine = document.lineAt(sig.lineIndex);

            if (!sig.isAsync) {
                const range = new vscode.Range(
                    sig.lineIndex,
                    defLine.firstNonWhitespaceCharacterIndex,
                    sig.lineIndex,
                    defLine.text.length
                );
                const d = new vscode.Diagnostic(
                    range,
                    "FastHTTP handler must be `async def`",
                    vscode.DiagnosticSeverity.Warning
                );
                d.code = DIAG_MISSING_ASYNC;
                d.source = "fasthttp";
                diagnostics.push(d);
            }

            if (!sig.returnType) {
                const range = new vscode.Range(
                    sig.lineIndex,
                    defLine.firstNonWhitespaceCharacterIndex,
                    sig.lineIndex,
                    defLine.text.length
                );
                const d = new vscode.Diagnostic(
                    range,
                    "FastHTTP handler missing return type annotation `-> Type`",
                    vscode.DiagnosticSeverity.Error
                );
                d.code = DIAG_MISSING_RETURN;
                d.source = "fasthttp";
                diagnostics.push(d);
            }

            const hasResponseParam = /:\s*Response\b/.test(sig.params);
            if (!hasResponseParam) {
                const range = new vscode.Range(
                    sig.lineIndex,
                    defLine.firstNonWhitespaceCharacterIndex,
                    sig.lineIndex,
                    defLine.text.length
                );
                const d = new vscode.Diagnostic(
                    range,
                    "FastHTTP handler missing `resp: Response` parameter",
                    vscode.DiagnosticSeverity.Warning
                );
                d.code = DIAG_MISSING_RESP;
                d.source = "fasthttp";
                diagnostics.push(d);
            }
        }

        // Duplicate URL detection
        const urlMap = new Map<string, number[]>();

        for (let i = 0; i < lines.length; i++) {
            const methodMatch = decoratorRE.exec(lines[i]);
            if (!methodMatch) {
                continue;
            }
            const urlMatch = URL_RE.exec(lines[i]);
            if (!urlMatch) {
                continue;
            }
            const key = `${methodMatch[2].toUpperCase()}:${urlMatch[1]}`;
            if (!urlMap.has(key)) {
                urlMap.set(key, []);
            }
            urlMap.get(key)!.push(i);
        }

        for (const [key, lineNums] of urlMap) {
            if (lineNums.length < 2) {
                continue;
            }
            const [method, url] = key.split(/:(.+)/);
            for (const lineNum of lineNums) {
                const lineText = lines[lineNum];
                const atIdx = lineText.indexOf("@");
                const range = new vscode.Range(
                    lineNum,
                    atIdx >= 0 ? atIdx : 0,
                    lineNum,
                    lineText.length
                );
                const d = new vscode.Diagnostic(
                    range,
                    `Duplicate route: ${method} "${url}" defined ${lineNums.length} times in this file`,
                    vscode.DiagnosticSeverity.Warning
                );
                d.code = DIAG_DUPLICATE_URL;
                d.source = "fasthttp";
                diagnostics.push(d);
            }
        }

        return diagnostics;
    }
}
