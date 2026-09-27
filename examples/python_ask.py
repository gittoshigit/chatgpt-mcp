"""Chat with ChatGPT through the local chatgpt-mcp server from Python.

Install the Python client once:
    python -m pip install mcp

Run from any directory:
    python D:/program/projects/node/chatgpt-mcp/examples/python_ask.py
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


async def chat_session(
    prompt: str | None,
    model: str | None,
    project: str | None,
    timeout: int,
    image_paths: list[str] | None = None,
    once: bool = False,
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
        first_tool = "chatgpt_upload"
        first_arguments: dict[str, object] = {
            "file_paths": [str(image) for image in resolved_images],
            "timeout_minutes": timeout,
        }
    else:
        first_tool = "chatgpt_ask"
        first_arguments = {"timeout_minutes": timeout}
        if model:
            first_arguments["model"] = model
        if project:
            first_arguments["project"] = project

    server = StdioServerParameters(
        command="node",
        args=[str(server_script)],
        env={"HOME": configured_server_home()},
    )
    async with Client(server, read_timeout_seconds=timeout * 60 + 30) as client:
        if prompt is None:
            prompt = input("最初の質問を入力してください: ").strip()
            while not prompt:
                prompt = input("質問が空です。質問を入力してください: ").strip()

        first_arguments["prompt"] = prompt
        result = await client.call_tool(first_tool, first_arguments)
        if not print_result(result):
            return 1

        if once:
            return 0

        print("\n続けて質問できます。終了するには exit または 終了 と入力してください。")
        while True:
            try:
                follow_up = input("\n質問> ").strip()
            except EOFError:
                print()
                break
            if follow_up.lower() in {"exit", "quit"} or follow_up == "終了":
                break
            if not follow_up:
                continue

            result = await client.call_tool(
                "chatgpt_reply",
                {"prompt": follow_up, "timeout_minutes": timeout},
            )
            if not print_result(result):
                return 1


def print_result(result) -> bool:
    if result.is_error:
        for item in result.content:
            if hasattr(item, "text"):
                print(item.text, file=sys.stderr)
        return False

    for item in result.content:
        if not hasattr(item, "text"):
            continue
        try:
            payload = json.loads(item.text)
        except json.JSONDecodeError:
            print(item.text)
        else:
            print(payload.get("response", json.dumps(payload, ensure_ascii=False, indent=2)))
    return True


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
    parser = argparse.ArgumentParser(description="Chat with ChatGPT through the local chatgpt-mcp server.")
    parser.add_argument(
        "prompt", nargs="?", help="Optional first prompt; omit to enter it interactively"
    )
    parser.add_argument("--model", help='Optional ChatGPT mode, for example "Pro" or "Thinking"')
    parser.add_argument("--project", help="Optional ChatGPT project name")
    parser.add_argument(
        "--image",
        action="append",
        metavar="PATH",
        help="Image or other file to upload (repeat to attach multiple files)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Send one prompt and exit instead of continuing interactively",
    )
    parser.add_argument("--timeout", type=int, default=60, help="Timeout in minutes (1-120; default: 60)")
    options = parser.parse_args()

    if not 1 <= options.timeout <= 120:
        parser.error("--timeout must be between 1 and 120 minutes")
    if options.image and (options.model or options.project):
        parser.error("--image cannot be combined with --model or --project")
    if options.once and options.prompt is None:
        parser.error("--once requires an initial prompt")

    try:
        return asyncio.run(
            chat_session(
                options.prompt,
                options.model,
                options.project,
                options.timeout,
                options.image,
                options.once,
            )
        )
    except FileNotFoundError:
        print("Node.js was not found. Install Node.js or add node to PATH.", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
