"""Send one prompt to the local chatgpt-mcp server from Python.

Install the Python client once:
    python -m pip install mcp

Run from any directory:
    python D:/program/projects/node/chatgpt-mcp/examples/python_ask.py "What is MCP?"
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import tomllib
from pathlib import Path

from mcp import Client, StdioServerParameters


async def ask(
    prompt: str,
    model: str | None,
    project: str | None,
    timeout: int,
    image_paths: list[str] | None = None,
) -> int:
    server_script = Path(__file__).resolve().parents[1] / "dist" / "index.js"
    if not server_script.is_file():
        print(f"MCP server entrypoint not found: {server_script}", file=sys.stderr)
        print("Build it in the chatgpt-mcp project with: npm run build", file=sys.stderr)
        return 2

    if image_paths:
        resolved_images = [Path(image).expanduser().resolve() for image in image_paths]
        missing_images = [str(image) for image in resolved_images if not image.is_file()]
        if missing_images:
            print("Image file not found: " + ", ".join(missing_images), file=sys.stderr)
            return 2
        tool_name = "chatgpt_upload"
        arguments: dict[str, object] = {
            "file_paths": [str(image) for image in resolved_images],
            "prompt": prompt,
            "timeout_minutes": timeout,
        }
    else:
        tool_name = "chatgpt_ask"
        arguments = {"prompt": prompt, "timeout_minutes": timeout}
        if model:
            arguments["model"] = model
        if project:
            arguments["project"] = project

    server = StdioServerParameters(
        command="node",
        args=[str(server_script)],
        env={"HOME": configured_server_home()},
    )
    async with Client(server, read_timeout_seconds=timeout * 60 + 30) as client:
        result = await client.call_tool(tool_name, arguments)

    if result.is_error:
        for item in result.content:
            if hasattr(item, "text"):
                print(item.text, file=sys.stderr)
        return 1

    for item in result.content:
        if not hasattr(item, "text"):
            continue
        try:
            payload = json.loads(item.text)
        except json.JSONDecodeError:
            print(item.text)
        else:
            print(payload.get("response", json.dumps(payload, ensure_ascii=False, indent=2)))
    return 0


def configured_server_home() -> str:
    """Reuse the HOME configured for chatgpt-mcp in Codex, if present."""
    config_path = Path.home() / ".codex" / "config.toml"
    try:
        with config_path.open("rb") as config_file:
            config = tomllib.load(config_file)
    except (OSError, tomllib.TOMLDecodeError):
        config = {}

    configured_home = (
        config.get("mcp_servers", {})
        .get("chatgpt", {})
        .get("env", {})
        .get("HOME")
    )
    return str(configured_home or os.environ.get("HOME") or Path.home())


def main() -> int:
    parser = argparse.ArgumentParser(description="Ask ChatGPT through the local chatgpt-mcp server.")
    parser.add_argument("prompt", help="Prompt to send to ChatGPT")
    parser.add_argument("--model", help='Optional ChatGPT mode, for example "Pro" or "Thinking"')
    parser.add_argument("--project", help="Optional ChatGPT project name")
    parser.add_argument(
        "--image",
        action="append",
        metavar="PATH",
        help="Image or other file to upload (repeat to attach multiple files)",
    )
    parser.add_argument("--timeout", type=int, default=60, help="Timeout in minutes (1-120; default: 60)")
    options = parser.parse_args()

    if not 1 <= options.timeout <= 120:
        parser.error("--timeout must be between 1 and 120 minutes")
    if options.image and (options.model or options.project):
        parser.error("--image cannot be combined with --model or --project")

    try:
        return asyncio.run(
            ask(options.prompt, options.model, options.project, options.timeout, options.image)
        )
    except FileNotFoundError:
        print("Node.js was not found. Install Node.js or add node to PATH.", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
