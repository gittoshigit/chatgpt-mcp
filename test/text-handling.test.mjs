import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

import { fillTextElement } from '../dist/browser.js';
import {
  cleanResponseText,
  collectGenerationIndicators,
  collectResponseCandidates,
  selectLatestResponseText,
} from '../dist/chatgpt.js';

test('multiline prompt is inserted with one fill call and preserves CRLF/LF exactly', async () => {
  const calls = [];
  const element = {
    async click() {
      calls.push(['click']);
    },
    async fill(value) {
      calls.push(['fill', value]);
    },
    async type() {
      throw new Error('character-by-character typing must not be used');
    },
  };

  const prompt = '背景と目的\r\n現在の構成\n\n今回の改修内容';
  await fillTextElement(element, prompt);

  assert.deepEqual(calls, [
    ['click'],
    ['fill', prompt],
  ]);
});

test('response cleanup preserves paragraphs and code indentation', () => {
  const raw = [
    'ChatGPT said:',
    '見出し',
    '',
    '本文  with  spaces',
    '',
    '```text',
    '  indented',
    '```',
  ].join('\r\n');

  assert.equal(
    cleanResponseText(raw),
    [
      '見出し',
      '',
      '本文  with  spaces',
      '',
      '```text',
      '  indented',
      '```',
    ].join('\n'),
  );
});

test('current ChatGPT markup extracts the reply without treating the prompt as a reply', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <main>
        <div class="bg-user-message"><div class="text-size-chat whitespace-pre-wrap">Return CHATGPT_MCP_PYTHON_OK</div></div>
      </main>
    `);
    let candidates = await page.evaluate(collectResponseCandidates);
    assert.equal(selectLatestResponseText(candidates), null);

    await page.setContent(`
      <main>
        <div class="bg-user-message"><div class="text-size-chat whitespace-pre-wrap">Return CHATGPT_MCP_PYTHON_OK</div></div>
        <div class="MarkdownRoot-current"><p><span>CHATGPT_MCP_PYTHON_OK</span></p></div>
      </main>
    `);
    candidates = await page.evaluate(collectResponseCandidates);
    assert.equal(selectLatestResponseText(candidates), 'CHATGPT_MCP_PYTHON_OK');
  } finally {
    await browser.close();
  }
});

test('the latest response needs its own copy action to count as complete', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const previous = '<div class="group flex flex-col pb-2 pt-2"><div class="MarkdownRoot-old">Earlier reply</div><button aria-label="コピーする"></button></div>';
    const current = (copyAction) => `<div class="group flex flex-col pb-2 pt-2"><div class="MarkdownRoot-current">Current reply</div>${copyAction}</div>`;

    await page.setContent(`<main>${previous}${current('')}</main>`);
    assert.equal((await page.evaluate(collectGenerationIndicators)).modernHasCopy, false);

    await page.setContent(`<main>${previous}${current('<button aria-label="コピーする"></button>')}</main>`);
    assert.equal((await page.evaluate(collectGenerationIndicators)).modernHasCopy, true);
  } finally {
    await browser.close();
  }
});

test('modernHasCopy detects copy action even when Tailwind container classes change', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const previous = '<div><div class="MarkdownRoot-old">Earlier reply</div><button aria-label="コピーする"></button></div>';
    const current = (copyAction) => `<div><div class="MarkdownRoot-current">Current reply</div>${copyAction}</div>`;

    await page.setContent(`<main>${previous}${current('')}</main>`);
    assert.equal((await page.evaluate(collectGenerationIndicators)).modernHasCopy, false);

    await page.setContent(`<main>${previous}${current('<div><button aria-label="コピーする"></button></div>')}</main>`);
    assert.equal((await page.evaluate(collectGenerationIndicators)).modernHasCopy, true);
  } finally {
    await browser.close();
  }
});
