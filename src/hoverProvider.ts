import * as vscode from "vscode";
import { findFastHTTPInstances, buildDecoratorRE } from "./routeProvider";

const FUNC_RE = /^\s*(?:async\s+)?def\s+(\w+)/;

const METHOD_EMOJI: Record<string, string> = {
    GET: "🟢",
    POST: "🔵",
    PUT: "🟡",
    PATCH: "🟠",
    DELETE: "🔴",
    HEAD: "⚪",
    OPTIONS: "⚙️",
    GRAPHQL: "🟣",
};

export class FastHTTPHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Hover | null {
        if (document.languageId !== "python") {
            return null;
        }

        const lines = document.getText().split("\n");
        const instances = findFastHTTPInstances(lines);
        if (instances.size === 0) {
            return null;
        }

        const decoratorRE = buildDecoratorRE(instances);
        const m = decoratorRE.exec(lines[position.line]);
        if (!m) {
            return null;
        }

        const method = m[2].toUpperCase();
        const url = m[3];

        let funcName = "unknown";
        for (let j = position.line + 1; j < Math.min(position.line + 6, lines.length); j++) {
            const fm = FUNC_RE.exec(lines[j]);
            if (fm) {
                funcName = fm[1];
                break;
            }
        }

        const emoji = METHOD_EMOJI[method] ?? "•";
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**${emoji} FastHTTP Route**\n\n`);
        md.appendMarkdown(`| | |\n|:--|:--|\n`);
        md.appendMarkdown(`| Method | \`${method}\` |\n`);
        md.appendMarkdown(`| URL | \`${url}\` |\n`);
        md.appendMarkdown(`| Handler | \`${funcName}()\` |\n`);

        return new vscode.Hover(md);
    }
}
