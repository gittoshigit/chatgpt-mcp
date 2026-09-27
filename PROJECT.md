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
1. `npm ci`
2. `npx playwright install chromium`
3. `npm run build`
4. 各AI（Codex, Claude Code, Antigravity）のMCP設定に登録して利用。
   - Chromiumプロファイル分離先: `C:\Users\<User>\.chatgpt-mcp-homes\<ai>`
   - 提供Tool: `chatgpt_ask`, `chatgpt_reply`, `chatgpt_upload`, `chatgpt_select_project`, `chatgpt_new_chat`

## 応答取得の確認記録
- 2026-09-27: 実際のChatGPT画面では旧来の `conversation-turn-*` と `data-message-author-role="assistant"` が見つからず、回答本文は `main [class*="MarkdownRoot"]` にあった。完了後のコピー操作は、その回答を含む要素内の `aria-label="コピーする"` のボタンで確認した。
- この表示形式に対応した後、PythonのMCPクライアントから文字列応答を取得し、終了コード0を確認した。画面構造は変わり得るため、取得不能になった場合は実画面のDOMと完了表示を再確認する。

