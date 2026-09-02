# PROJECT.md: chatgpt-mcp

- 目的: Playwright経由でChatGPT Web UIを自動操作し、`ask(prompt) → response` インターフェースを提供するMCPサーバー。
- 構成: Node.js (TypeScript) + Playwright (Chromium) + `@modelcontextprotocol/sdk`
- 対象: Claude Code / Codex / Gemini などの上位AIオーケストレーターからGPT-5.2 Pro等を活用するためのブリッジ

## ディレクトリ構成
- `src/index.ts`: MCPサーバーエントリポイント（ツール登録・シャットダウン）
- `src/browser.ts`: Playwright ブラウザ永続コンテキスト管理
- `src/chatgpt.ts`: ChatGPT Web UI 操作コア（プロンプト送信、モデル・プロジェクト選択、応答抽出、完了検知）
- `src/types.ts`: セレクタ定義、定数、インターフェース
- `src/utils/backoff.ts`: Fibonacci バックオフユーティリティ

## 利用方法
1. `npm install`
2. `npx playwright install chromium`
3. `npm run build`
4. `~/.claude.json` の `mcpServers.chatgpt` に登録して利用
