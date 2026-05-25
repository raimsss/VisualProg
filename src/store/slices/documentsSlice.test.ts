import test from 'node:test';
import assert from 'node:assert/strict';
import reducer, { createDocument, deleteDocument, duplicateDocument, renameDocument } from './documentsSlice.js';

test('documentsSlice creates and renames document', () => {
  const created = reducer(undefined, createDocument({
    ownerId: 'local-user',
    draft: { title: 'Тест', rows: 5, cols: 4 },
  }));
  const id = created.items[0].id;

  const renamed = reducer(created, renameDocument({ id, title: 'Новое имя' }));
  assert.equal(renamed.items[0].title, 'Новое имя');
});

test('documentsSlice duplicates and deletes document', () => {
  const created = reducer(undefined, createDocument({
    ownerId: 'local-user',
    draft: { title: 'Тест', rows: 5, cols: 4 },
  }));
  const id = created.items[0].id;

  const copied = reducer(created, duplicateDocument(id));
  assert.equal(copied.items.length, 2);

  const removed = reducer(copied, deleteDocument(id));
  assert.equal(removed.items.length, 1);
});
