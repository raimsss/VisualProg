import test from 'node:test';
import assert from 'node:assert/strict';
import reducer, { closeCreateModal, openCreateModal, setSaveStatus } from './uiSlice.js';

test('uiSlice opens and closes create modal', () => {
  const opened = reducer(undefined, openCreateModal());
  assert.equal(opened.createModalOpen, true);

  const closed = reducer(opened, closeCreateModal());
  assert.equal(closed.createModalOpen, false);
});

test('uiSlice changes save status', () => {
  const state = reducer(undefined, setSaveStatus('saving'));
  assert.equal(state.saveStatus, 'saving');
});
