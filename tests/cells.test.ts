import test from 'node:test';
import assert from 'node:assert/strict';
import { getCellId, getColumnName, makeCell, recalculateCells } from '../src/cells.js';

test('cell helpers create ids', () => {
  assert.equal(getColumnName(0), 'A');
  assert.equal(getColumnName(25), 'Z');
  assert.equal(getColumnName(26), 'AA');
  assert.equal(getCellId(2, 1), 'B3');
});

test('formulas are calculated', () => {
  const cells = recalculateCells({
    A1: makeCell('2'),
    A2: makeCell('3'),
    A3: makeCell('=SUM(A1:A2)'),
    B1: makeCell('=A1*2'),
  });

  assert.equal(cells.A3.value, '5');
  assert.equal(cells.B1.value, '4');
});
