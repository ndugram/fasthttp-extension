import * as vscode from "vscode";
import { findFastHTTPInstances } from "./routeProvider";

const INSTANCE_RE = /^(\w+)\s*=\s*(?:FastHTTP|Router)\s*\(/;

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

        for (let i = 0; i < lines.length; i++) {
            if (!decoratorRE.test(lines[i])) {
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
                diagnostics.push(
                    new vscode.Diagnostic(
                        range,
                        "FastHTTP handler must be `async def`",
                        vscode.DiagnosticSeverity.Warning
                    )
                );
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
                d.source = "fasthttp";
                diagnostics.push(d);
            }
        }

        return diagnostics;
    }
}
