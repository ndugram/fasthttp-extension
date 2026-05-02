import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { RouteProvider } from "./routeProvider";
import { FastHTTPCodeLensProvider } from "./codeLensProvider";
import { FastHTTPDiagnosticsProvider } from "./diagnosticsProvider";
import { FastHTTPHoverProvider } from "./hoverProvider";
import { FastHTTPQuickFixProvider } from "./quickFixProvider";
import type { RouteInfo } from "./routeProvider";

const MAIN_PY = `from fasthttp import FastHTTP
from fasthttp.response import Response

app = FastHTTP()


@app.get(url="https://httpbin.org/get")
async def get_data(resp: Response) -> dict:
    return resp.json()


if __name__ == "__main__":
    app.run()
`;

const REQUIREMENTS_TXT = `fasthttp-client>=1.2.7
`;

const PYPROJECT_TOML = (projectName: string) => `[project]
name = "${projectName}"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "fasthttp-client>=1.2.7",
]
`;

function resolvePython(filePath: string): string {
    const wsFolder = vscode.workspace.getWorkspaceFolder(
        vscode.Uri.file(filePath)
    );
    const root = wsFolder?.uri.fsPath ?? path.dirname(filePath);

    const candidates = [
        path.join(root, ".venv", "bin", "python"),
        path.join(root, "venv", "bin", "python"),
        path.join(root, "env", "bin", "python"),
        path.join(root, ".venv", "Scripts", "python.exe"),
        path.join(root, "venv", "Scripts", "python.exe"),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    return "python3";
}

export function activate(context: vscode.ExtensionContext) {
    const routeProvider = new RouteProvider(context);
    vscode.window.registerTreeDataProvider("fasthttpRoutes", routeProvider);

    new FastHTTPDiagnosticsProvider(context);

    vscode.languages.registerCodeLensProvider(
        { language: "python" },
        new FastHTTPCodeLensProvider()
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { language: "python" },
            new FastHTTPHoverProvider()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { language: "python" },
            new FastHTTPQuickFixProvider(),
            { providedCodeActionKinds: FastHTTPQuickFixProvider.providedCodeActionKinds }
        )
    );

    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.command = "fasthttp.refreshRoutes";
    statusBar.tooltip = "FastHTTP routes — click to refresh";
    context.subscriptions.push(statusBar);

    const updateStatusBar = () => {
        const count = routeProvider.getRouteCount();
        if (count > 0) {
            statusBar.text = `$(symbol-method) ${count} route${count !== 1 ? "s" : ""}`;
            statusBar.show();
        } else {
            statusBar.hide();
        }
    };

    routeProvider.onDidChangeTreeData(() => updateStatusBar());
    updateStatusBar();

    context.subscriptions.push(
        vscode.commands.registerCommand("fasthttp.createProject", async () => {
            const projectName = await vscode.window.showInputBox({
                prompt: "Project name",
                placeHolder: "my-fasthttp-project",
                validateInput: (value: string) => {
                    if (!value || value.trim() === "") {
                        return "Project name cannot be empty";
                    }
                    if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
                        return "Use only letters, numbers, hyphens, underscores";
                    }
                    return undefined;
                },
            });

            if (!projectName) {
                return;
            }

            const name = projectName.trim();

            const folderUris = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: "Select project location",
            });

            if (!folderUris || folderUris.length === 0) {
                return;
            }

            const projectDir = path.join(folderUris[0].fsPath, name);

            if (fs.existsSync(projectDir)) {
                vscode.window.showErrorMessage(
                    `Folder "${name}" already exists in selected location`
                );
                return;
            }

            try {
                fs.mkdirSync(projectDir, { recursive: true });
                fs.writeFileSync(path.join(projectDir, "main.py"), MAIN_PY);
                fs.writeFileSync(
                    path.join(projectDir, "requirements.txt"),
                    REQUIREMENTS_TXT
                );
                fs.writeFileSync(
                    path.join(projectDir, "pyproject.toml"),
                    PYPROJECT_TOML(name)
                );

                const choice = await vscode.window.showInformationMessage(
                    `FastHTTP project "${name}" created!`,
                    "Open in new window",
                    "Open in current window"
                );

                const uri = vscode.Uri.file(projectDir);

                if (choice === "Open in new window") {
                    await vscode.commands.executeCommand(
                        "vscode.openFolder",
                        uri,
                        true
                    );
                } else if (choice === "Open in current window") {
                    await vscode.commands.executeCommand(
                        "vscode.openFolder",
                        uri,
                        false
                    );
                }
            } catch (err) {
                vscode.window.showErrorMessage(
                    `Failed to create project: ${String(err)}`
                );
            }
        }),

        vscode.commands.registerCommand("fasthttp.refreshRoutes", () => {
            routeProvider.refresh();
        }),

        vscode.commands.registerCommand(
            "fasthttp.goToRoute",
            async (route: RouteInfo) => {
                const doc = await vscode.workspace.openTextDocument(
                    route.filePath
                );
                const editor = await vscode.window.showTextDocument(doc);
                const pos = new vscode.Position(route.line, 0);
                editor.selection = new vscode.Selection(pos, pos);
                editor.revealRange(
                    new vscode.Range(pos, pos),
                    vscode.TextEditorRevealType.InCenter
                );
            }
        ),

        vscode.commands.registerCommand(
            "fasthttp.copyUrl",
            (route: RouteInfo) => {
                vscode.env.clipboard.writeText(route.url);
                vscode.window.showInformationMessage(`Copied: ${route.url}`);
            }
        ),

        vscode.commands.registerCommand(
            "fasthttp.runProject",
            (filePath: string) => {
                const file =
                    filePath ??
                    vscode.window.activeTextEditor?.document.fileName;
                if (!file) {
                    vscode.window.showErrorMessage("No file to run");
                    return;
                }
                const pythonPath = resolvePython(file);
                const terminal = vscode.window.createTerminal("FastHTTP");
                terminal.sendText(`"${pythonPath}" "${file}"`);
                terminal.show();
            }
        )
    );
}

export function deactivate() {}
