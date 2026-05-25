import test from 'node:test';
import assert from 'node:assert/strict';
import reducer from './authSlice.js';

test('authSlice keeps mock user', () => {
  const state = reducer(undefined, { type: 'init' });
  assert.equal(state.user.id, 'local-user');
});
