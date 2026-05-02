# Contributing to FastHTTP Extension

## Setup

```bash
git clone https://github.com/ndugram/fasthttp-extension
cd fasthttp-extension
npm install
```

## Development

Open the folder in VS Code and press `F5` to launch the Extension Development Host.

```bash
npm run watch   # watch mode — recompiles on save
npm run compile # one-shot compile
```

## Project structure

```
src/
├── extension.ts          # entry point, command registration
├── routeProvider.ts      # sidebar TreeView + Python parser
├── codeLensProvider.ts   # CodeLens (▶ Run, Copy URL)
└── diagnosticsProvider.ts # inline error/warning diagnostics
```

## Guidelines

- No comments unless the WHY is non-obvious
- No new dependencies without discussion
- Parser logic must not produce false positives on non-FastHTTP files
- Test with both FastHTTP and FastAPI projects open simultaneously

## Submitting a PR

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes
4. Push and open a PR against `master`

## Reporting bugs

Use the [bug report template](ISSUE_TEMPLATE/bug_report.md).
