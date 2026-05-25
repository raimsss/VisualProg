import test from 'node:test';
import assert from 'node:assert/strict';
import reducer, { redo, selectCell, setCell, undo } from './spreadsheetSlice.js';

test('spreadsheetSlice selects cell', () => {
  const state = reducer(undefined, selectCell({ id: 'B2', shift: false }));
  assert.equal(state.activeCell, 'B2');
  assert.equal(state.selectionStart, 'B2');
});

test('spreadsheetSlice updates cell and supports undo redo', () => {
  const filled = reducer(undefined, setCell({ id: 'A1', value: '10' }));
  assert.equal(filled.cells.A1.value, '10');

  const undone = reducer(filled, undo());
  assert.equal(undone.cells.A1, undefined);

  const redone = reducer(undone, redo());
  assert.equal(redone.cells.A1.value, '10');
});
