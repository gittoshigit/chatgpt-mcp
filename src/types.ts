// Types and configuration for chatgpt-mcp

// ============================================
// Result interfaces
// ============================================

export interface AskResult {
  response: string;
  elapsed_seconds: number;
  model: string | null;
  chat_id: string | null;
  poll_count: number;
  error?: string;
}

export interface SimpleResult {
  success: boolean;
  message: string;
  error?: string;
}

export type ReasoningEffort = 'instant' | 'medium' | 'high';

export interface ReasoningResult {
  success: boolean;
  effort: ReasoningEffort | null;
  message: string;
  error?: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';

export interface SessionState {
  isLoggedIn: boolean;
  currentModel: string | null;
  currentReasoningEffort: ReasoningEffort | null;
  conversationId: string | null;
  currentProjectUrl: string | null;
}

// ============================================
// ChatGPT DOM selectors — multiple fallbacks for resilience
// ============================================

export const SELECTORS = {
  // Prompt input area
  promptTextarea: [
    '#prompt-textarea',
    '#pending-home-input',
    '[data-testid="prompt-textarea"]',
    'textarea[placeholder*="ChatGPT"]',
    'textarea[placeholder*="Message"]',
    'textarea',
    'div[contenteditable="true"]',
  ],

  // Send button
  sendButton: [
    'button[aria-label="送信"]',
    'button[aria-label*="Send"]',
    'button[type="submit"]',
    '[data-testid="send-button"]',
    'button[data-testid="composer-send-button"]',
  ],

  // Stop generating button (presence = still generating)
  stopButton: [
    'button[aria-label="停止"]',
    'button[aria-label*="Stop"]',
    '[data-testid="stop-button"]',
    'button:has-text("Stop generating")',
  ],

  // Regenerate button (presence = generation complete)
  regenerateButton: [
    '[data-testid="regenerate-button"]',
    'button:has-text("Regenerate")',
  ],

  // Assistant response messages
  responseContainer: [
    '[data-message-author-role="assistant"]',
    '.agent-turn',
    '[data-testid*="conversation-turn"]:last-child',
  ],

  // Model selector
  modelSelector: [
    '[data-testid="model-selector"]',
    'button:has-text("GPT")',
    '[aria-haspopup="menu"]:has-text("GPT")',
  ],

  // New chat button
  newChatButton: [
    '[data-testid="new-chat-button"]',
    'a[href="/"]',
    'button:has-text("New chat")',
  ],

  // Login indicator (if present, user is logged in)
  loggedInIndicator: [
    '[data-testid="profile-button"]',
    'button[aria-label*="Profile"]',
    'button[aria-label*="プロフィール"]',
    'img[alt*="User"]',
  ],

  // Login prompt (if present, user needs to log in)
  loginPrompt: [
    'button:has-text("Log in")',
    'button:has-text("ログイン")',
    'a:has-text("Log in")',
    'a:has-text("ログイン")',
    '[data-testid="login-button"]',
  ],

  // Attach/upload button
  attachButton: [
    '[data-testid="composer-action-file-upload"]',
    '[data-testid="composer-attach-button"]',
    'button[aria-label*="Attach"]',
    'button[aria-label*="Upload"]',
    'button[aria-label*="attach"]',
  ],

  // Reasoning effort / thinking selectors
  reasoningTrigger: [
    'button[aria-label*="思考量"]',
    'button[aria-label*="推論"]',
    'button[aria-label*="Reasoning"]',
    'button[aria-label*="Thinking"]',
    'button:has-text("思考量")',
    'button:has-text("推論")',
    'button:has-text("Reasoning")',
    'button:has-text("Thinking")',
    '[data-testid*="reasoning"]',
    '[data-testid*="thinking"]',
  ],

  reasoningSlider: [
    '[role="slider"]',
    'input[type="range"]',
    '[data-radix-collection-item][role="slider"]',
  ],

  reasoningPopover: [
    '[data-radix-popper-content-wrapper]',
    '[role="dialog"]',
    '[role="tooltip"]',
    'div[class*="popover"]',
  ],
} as const;

// ============================================
// Configuration
// ============================================

export const CONFIG = {
  chatgptUrl: 'https://chatgpt.com',
  userDataDir: `${process.env.HOME}/.chatgpt-mcp/user-data`,
  defaultTimeout: 30000,
  typingDelay: 50,
  pollInterval: 5000,
  stableThreshold: 3, // More conservative than gpt-bridge's 2
  maxWaitTime: 3600000,
  // Default project — all new chats go here unless overridden.
  // This is the ChatGPT project name as shown in the sidebar.
  defaultProject: process.env.CHATGPT_DEFAULT_PROJECT || '',
  // Default reasoning effort (thinking depth) for requests
  defaultReasoningEffort: (process.env.CHATGPT_DEFAULT_REASONING_EFFORT as ReasoningEffort) || 'high',
} as const;
