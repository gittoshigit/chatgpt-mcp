import test from 'node:test';
import assert from 'node:assert/strict';

import { fillTextElement } from '../dist/browser.js';
import { cleanResponseText } from '../dist/chatgpt.js';

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
