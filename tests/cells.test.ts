import test from 'node:test';
import assert from 'node:assert/strict';
import { getCellId, getColumnName, makeCell, parseCsv, recalculateCells, toCsv } from '../src/cells.js';

test('makeCell keeps usual text as is', () => {
  assert.deepEqual(makeCell('hello'), {
    raw: 'hello',
    value: 'hello',
    type: 'string',
  });
});

test('makeCell calculates formulas', () => {
  const cells = recalculateCells({
    A1: makeCell('2'),
    A2: makeCell('3'),
    A3: makeCell('=SUM(A1:A2)'),
    B1: makeCell('=A1*2'),
  });

  assert.equal(cells.A3.value, '5');
  assert.equal(cells.B1.value, '4');
  assert.equal(cells.A3.type, 'formula');
});

test('helpers support table ids and csv', () => {
  assert.equal(getColumnName(25), 'Z');
  assert.equal(getColumnName(26), 'AA');
  assert.equal(getCellId(2, 1), 'B3');
  assert.deepEqual(parseCsv('a,"b,b"\n1,2'), [['a', 'b,b'], ['1', '2']]);
  assert.equal(toCsv([['a', 'b,b']]), 'a,"b,b"');
});
