import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export interface RouteInfo {
    method: string;
    url: string;
    funcName: string;
    filePath: string;
    line: number;
}

const METHOD_ICONS: Record<string, string> = {
    GET: "arrow-down",
    POST: "arrow-up",
    PUT: "edit",
    PATCH: "diff-modified",
    DELETE: "trash",
    HEAD: "eye",
    OPTIONS: "settings-gear",
    GRAPHQL: "symbol-interface",
};

const INSTANCE_RE = /^(\w+)\s*=\s*(?:FastHTTP|Router)\s*\(/m;
const FUNC_RE = /^\s*(?:async\s+)?def\s+(\w+)/;

export function findFastHTTPInstances(lines: string[]): Set<string> {
    const names = new Set<string>();
    for (const line of lines) {
        const m = INSTANCE_RE.exec(line);
        if (m) {
            names.add(m[1]);
        }
    }
    return names;
}

export function buildDecoratorRE(names: Set<string>): RegExp {
    const escaped = [...names].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    return new RegExp(
        `@(${escaped})\\.(get|post|put|patch|delete|head|options|graphql)\\s*\\(\\s*url\\s*=\\s*["'](https?:\\/\\/[^"']+)["']`,
        "i"
    );
}

export function parseRoutesFromFile(filePath: string): RouteInfo[] {
    let content: string;
    try {
        content = fs.readFileSync(filePath, "utf-8");
    } catch {
        return [];
    }

    const lines = content.split("\n");
    const instances = findFastHTTPInstances(lines);

    if (instances.size === 0) {
        return [];
    }

    const decoratorRE = buildDecoratorRE(instances);
    const routes: RouteInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
        const m = decoratorRE.exec(lines[i]);
        if (!m) {
            continue;
        }

        const method = m[2].toUpperCase();
        const url = m[3];

        let funcName = "unknown";
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
            const fm = FUNC_RE.exec(lines[j]);
            if (fm) {
                funcName = fm[1];
                break;
            }
        }

        routes.push({ method, url, funcName, filePath, line: i });
    }

    return routes;
}

class EmptyItem extends vscode.TreeItem {
    constructor() {
        super("No FastHTTP routes found", vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon("info");
    }
}

export class FileItem extends vscode.TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly routes: RouteInfo[]
    ) {
        super(
            path.basename(filePath),
            vscode.TreeItemCollapsibleState.Expanded
        );
        this.description = `${routes.length} route${routes.length !== 1 ? "s" : ""}`;
        this.tooltip = filePath;
        this.iconPath = new vscode.ThemeIcon("file-code");
        this.contextValue = "file";
    }
}

export class RouteItem extends vscode.TreeItem {
    constructor(public readonly route: RouteInfo) {
        super(
            `${route.method.padEnd(8)} ${route.url}`,
            vscode.TreeItemCollapsibleState.None
        );
        this.description = `${route.funcName}()`;
        this.tooltip = `${route.method} ${route.url}\n→ ${route.funcName}()\n${path.basename(route.filePath)}:${route.line + 1}`;
        this.contextValue = "route";
        this.iconPath = new vscode.ThemeIcon(
            METHOD_ICONS[route.method] ?? "circle-outline"
        );
        this.command = {
            command: "fasthttp.goToRoute",
            title: "Go to Route",
            arguments: [route],
        };
    }
}

export class RouteProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private _onDidChangeTreeData = new vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    >();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private routesByFile = new Map<string, RouteInfo[]>();

    constructor(context: vscode.ExtensionContext) {
        vscode.workspace.onDidSaveTextDocument(
            (doc) => {
                if (doc.languageId === "python") {
                    this.parseFile(doc.fileName);
                    this._onDidChangeTreeData.fire();
                }
            },
            null,
            context.subscriptions
        );

        vscode.workspace.onDidOpenTextDocument(
            (doc) => {
                if (doc.languageId === "python") {
                    this.parseFile(doc.fileName);
                    this._onDidChangeTreeData.fire();
                }
            },
            null,
            context.subscriptions
        );

        vscode.workspace.onDidCloseTextDocument(
            (doc) => {
                this.routesByFile.delete(doc.fileName);
                this._onDidChangeTreeData.fire();
            },
            null,
            context.subscriptions
        );

        this.scanWorkspace();
    }

    refresh(): void {
        this.routesByFile.clear();
        this.scanWorkspace();
    }

    private parseFile(filePath: string): void {
        const routes = parseRoutesFromFile(filePath);
        if (routes.length > 0) {
            this.routesByFile.set(filePath, routes);
        } else {
            this.routesByFile.delete(filePath);
        }
    }

    private scanWorkspace(): void {
        vscode.workspace.textDocuments.forEach((doc) => {
            if (doc.languageId === "python") {
                this.parseFile(doc.fileName);
            }
        });

        vscode.workspace
            .findFiles("**/*.py", "{**/node_modules/**,**/.venv/**,**/venv/**,**/env/**,**/__pycache__/**}", 100)
            .then((uris) => {
                uris.forEach((uri) => this.parseFile(uri.fsPath));
                this._onDidChangeTreeData.fire();
            });
    }

    getRouteCount(): number {
        let total = 0;
        for (const routes of this.routesByFile.values()) {
            total += routes.length;
        }
        return total;
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
        if (!element) {
            if (this.routesByFile.size === 0) {
                return [new EmptyItem()];
            }
            return Array.from(this.routesByFile.entries()).map(
                ([fp, routes]) => new FileItem(fp, routes)
            );
        }

        if (element instanceof FileItem) {
            return element.routes.map((r) => new RouteItem(r));
        }

        return [];
    }
}
