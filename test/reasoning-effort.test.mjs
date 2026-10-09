import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeReasoningEffort } from '../dist/chatgpt.js';

test('normalizeReasoningEffort normalizes valid effort names and aliases', () => {
  assert.equal(normalizeReasoningEffort('instant'), 'instant');
  assert.equal(normalizeReasoningEffort('Instant'), 'instant');
  assert.equal(normalizeReasoningEffort('low'), 'instant');
  assert.equal(normalizeReasoningEffort('fast'), 'instant');

  assert.equal(normalizeReasoningEffort('medium'), 'medium');
  assert.equal(normalizeReasoningEffort('Medium'), 'medium');
  assert.equal(normalizeReasoningEffort('med'), 'medium');
  assert.equal(normalizeReasoningEffort('normal'), 'medium');

  assert.equal(normalizeReasoningEffort('high'), 'high');
  assert.equal(normalizeReasoningEffort('High'), 'high');
  assert.equal(normalizeReasoningEffort('deep'), 'high');
  assert.equal(normalizeReasoningEffort('pro'), 'high');
});

test('normalizeReasoningEffort returns null for unknown values or null/undefined', () => {
  assert.equal(normalizeReasoningEffort(null), null);
  assert.equal(normalizeReasoningEffort(undefined), null);
  assert.equal(normalizeReasoningEffort(''), null);
  assert.equal(normalizeReasoningEffort('unknown'), null);
  assert.equal(normalizeReasoningEffort('gpt-4o'), null);
});
