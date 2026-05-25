import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCell } from '../src/cells.js';

test('makeCell keeps usual text as is', () => {
  assert.deepEqual(makeCell('hello'), {
    raw: 'hello',
    value: 'hello',
  });
});

test('makeCell marks formulas', () => {
  assert.deepEqual(makeCell('=A1+B1'), {
    raw: '=A1+B1',
    value: 'CALC...',
  });
});
