import * as vscode from "vscode";
import { parseRoutesFromFile } from "./routeProvider";

export class FastHTTPCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        if (document.languageId !== "python") {
            return [];
        }

        const routes = parseRoutesFromFile(document.fileName);
        const lenses: vscode.CodeLens[] = [];

        for (const route of routes) {
            const range = new vscode.Range(route.line, 0, route.line, 0);

            lenses.push(
                new vscode.CodeLens(range, {
                    title: "▶ Run",
                    command: "fasthttp.runProject",
                    arguments: [document.fileName],
                    tooltip: "Run project in terminal",
                })
            );

            lenses.push(
                new vscode.CodeLens(range, {
                    title: "$(clippy) Copy URL",
                    command: "fasthttp.copyUrl",
                    arguments: [route],
                    tooltip: "Copy URL to clipboard",
                })
            );
        }

        return lenses;
    }
}
