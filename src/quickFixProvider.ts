import * as vscode from "vscode";
import {
    DIAG_MISSING_ASYNC,
    DIAG_MISSING_RETURN,
    DIAG_MISSING_RESP,
} from "./diagnosticsProvider";

export class FastHTTPQuickFixProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        for (const diag of context.diagnostics) {
            if (diag.source !== "fasthttp") {
                continue;
            }
            if (diag.code === DIAG_MISSING_ASYNC) {
                actions.push(this.fixMissingAsync(document, diag));
            } else if (diag.code === DIAG_MISSING_RETURN) {
                actions.push(this.fixMissingReturn(document, diag));
            } else if (diag.code === DIAG_MISSING_RESP) {
                actions.push(this.fixMissingResp(document, diag));
            }
        }

        return actions;
    }

    private fixMissingAsync(
        document: vscode.TextDocument,
        diag: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            "Add `async`",
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diag];
        action.isPreferred = true;

        const lineNum = diag.range.start.line;
        const text = document.lineAt(lineNum).text;
        const defIdx = text.indexOf("def ");

        const edit = new vscode.WorkspaceEdit();
        edit.insert(
            document.uri,
            new vscode.Position(lineNum, defIdx),
            "async "
        );
        action.edit = edit;
        return action;
    }

    private fixMissingReturn(
        document: vscode.TextDocument,
        diag: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            "Add `-> dict` return type",
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diag];
        action.isPreferred = true;

        const lineNum = diag.range.start.line;
        const text = document.lineAt(lineNum).text;
        // Find "):" or ") :" to insert before the colon
        const closingMatch = /\)\s*:/.exec(text);

        if (closingMatch) {
            const colonIdx =
                closingMatch.index + closingMatch[0].lastIndexOf(":");
            const edit = new vscode.WorkspaceEdit();
            edit.insert(
                document.uri,
                new vscode.Position(lineNum, colonIdx),
                " -> dict"
            );
            action.edit = edit;
        }

        return action;
    }

    private fixMissingResp(
        document: vscode.TextDocument,
        diag: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            "Add `resp: Response` parameter",
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diag];
        action.isPreferred = true;

        const lineNum = diag.range.start.line;
        const text = document.lineAt(lineNum).text;
        const openParen = text.indexOf("(");

        if (openParen === -1) {
            return action;
        }

        const closeParen = text.indexOf(")", openParen);
        const existingParams =
            closeParen !== -1
                ? text.slice(openParen + 1, closeParen).trim()
                : "";

        const edit = new vscode.WorkspaceEdit();
        const insertText =
            existingParams === "" ? "resp: Response" : "resp: Response, ";
        edit.insert(
            document.uri,
            new vscode.Position(lineNum, openParen + 1),
            insertText
        );
        action.edit = edit;
        return action;
    }
}
