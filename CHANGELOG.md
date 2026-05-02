# Changelog

All notable changes to FastHTTP Extension will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.0.1] - 2026-05-02

### Added

- `FastHTTP: Create Project` command — scaffold `main.py`, `requirements.txt`, `pyproject.toml`
- Route Explorer sidebar — tree view of all `@app.get/post/...` routes grouped by file
- CodeLens — `▶ Run` and `Copy URL` actions above every route decorator
- Diagnostics — inline warnings/errors for missing `async def`, `-> ReturnType`, `resp: Response`
- Smart Python detection — finds `.venv/bin/python` before falling back to `python3`
- False-positive prevention — only activates on files with `FastHTTP()` or `Router()` instances
