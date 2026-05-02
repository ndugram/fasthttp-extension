<p align="center">
  <img src="https://fasthttp.ndugram.dev/ru/latest/logo.png" style="background:white; padding:12px; border-radius:10px; width:350">
</p>
<p align="center">
    <em>VS Code extension for FastHTTP — scaffold projects directly from the Command Palette.</em>
</p>
<p align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=ndugram.fasthttp-extension" target="_blank">
    <img src="https://img.shields.io/visual-studio-marketplace/v/ndugram.fasthttp-extension?color=%2334D058&label=marketplace" alt="Marketplace version">
</a>
<a href="https://marketplace.visualstudio.com/items?itemName=ndugram.fasthttp-extension" target="_blank">
    <img src="https://img.shields.io/visual-studio-marketplace/i/ndugram.fasthttp-extension?color=%2334D058" alt="Installs">
</a>
<a href="https://github.com/ndugram/fasthttp-extension" target="_blank">
    <img src="https://img.shields.io/github/stars/ndugram/fasthttp-extension?style=social" alt="GitHub Stars">
</a>
</p>

---

**FastHTTP**: <a href="https://github.com/ndugram/fasthttp" target="_blank">https://github.com/ndugram/fasthttp</a>

**Source Code**: <a href="https://github.com/ndugram/fasthttp-extension" target="_blank">https://github.com/ndugram/fasthttp-extension</a>

---

FastHTTP Extension brings **FastHTTP project scaffolding** into VS Code. One command from the Command Palette — and your project is ready with `main.py`, `requirements.txt`, and `pyproject.toml` pre-filled.

Key features:

- **Fast** — create a ready-to-run FastHTTP project in seconds.
- **Simple** — single command from the Command Palette, no config needed.
- **Complete** — generates `main.py`, `requirements.txt`, and `pyproject.toml` with correct defaults.
- **Integrated** — opens the new project automatically in VS Code after creation.

## Requirements

- VS Code `^1.85.0`
- <a href="https://github.com/ndugram/fasthttp" target="_blank">fasthttp-client</a> installed in your Python environment to run generated projects.

## Installation

Install from the VS Code Marketplace:

1. Open VS Code
2. Press `Ctrl+P` (or `Cmd+P` on macOS)
3. Run `ext install ndugram.fasthttp-extension`

Or search **FastHTTP** in the Extensions panel.

## Usage

### Create a project

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type `FastHTTP: Create Project`
3. Enter a project name
4. Select a folder where the project will be created
5. Choose to open the project in a new or current window

### Generated structure

```
my-project/
├── main.py
├── requirements.txt
└── pyproject.toml
```

#### `main.py`

```python
from fasthttp import FastHTTP
from fasthttp.response import Response

app = FastHTTP()


@app.get(url="https://httpbin.org/get")
async def get_data(resp: Response) -> dict:
    return resp.json()


if __name__ == "__main__":
    app.run()
```

#### `requirements.txt`

```
fasthttp-client>=1.2.7
```

#### `pyproject.toml`

```toml
[project]
name = "my-project"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "fasthttp-client>=1.2.7",
]
```

### Run the generated project

```console
$ pip install fasthttp-client
$ python main.py
```

You will see output like:

```
16:09:18.955 │ INFO │ fasthttp │ ✔ FastHTTP started
16:09:19.519 │ INFO │ fasthttp │ ✔ GET https://httpbin.org/get [200] 458.26ms
16:09:20.037 │ INFO │ fasthttp │ ✔ Done in 1.08s
```

## Contributing

Contributions are welcome! Please open an issue or pull request on <a href="https://github.com/ndugram/fasthttp-extension" target="_blank">GitHub</a>.

Found a security issue? See the <a href="https://github.com/ndugram/fasthttp-extension/blob/master/SECURITY.md" target="_blank">Security Policy</a>.

## License

This project is licensed under the terms of the <a href="https://github.com/ndugram/fasthttp-extension/blob/master/LICENSE" target="_blank">MIT license</a>.
