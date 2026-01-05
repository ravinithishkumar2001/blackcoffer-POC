from fastmcp import FastMCP
from pathlib import Path

mcp = FastMCP("mcp-demo-server")


@mcp.tool()
def greet(name: str) -> str:
    """Return a friendly greeting."""
    return f"Hello, {name}! This is the MCP demo server."


@mcp.tool()
def list_files(path: str = ".") -> list[str]:
    """
    List files and directories in the given path.
    Path can be absolute or relative to the server working directory.
    """
    p = Path(path).expanduser().resolve()
    if not p.exists():
        raise FileNotFoundError(f"Path does not exist: {p}")
    return [item.name for item in p.iterdir()]


@mcp.tool()
def read_file(path: str) -> str:
    """
    Read a text file and return its content.
    Intended for .txt/.md/.py and other text files.
    """
    p = Path(path).expanduser().resolve()
    if not p.exists():
        raise FileNotFoundError(f"File does not exist: {p}")
    if not p.is_file():
        raise IsADirectoryError(f"Path is not a file: {p}")
    return p.read_text(encoding="utf-8")


if __name__ == "__main__":
    mcp.run()
