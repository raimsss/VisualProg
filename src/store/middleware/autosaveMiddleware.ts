import type { Middleware } from '@reduxjs/toolkit';
import { saveActiveDocument } from '../slices/documentsSlice.js';
import { setSaveStatus } from '../slices/uiSlice.js';

let timer: number | undefined;

const saveActions = [
  'spreadsheet/setCell',
  'spreadsheet/importData',
  'spreadsheet/insertRow',
  'spreadsheet/deleteRow',
  'spreadsheet/insertCol',
  'spreadsheet/deleteCol',
  'spreadsheet/resizeCol',
  'spreadsheet/resizeRow',
  'spreadsheet/undo',
  'spreadsheet/redo',
];

export const autosaveMiddleware: Middleware = store => next => action => {
  const result = next(action);
  const actionType = (action as { type?: string }).type;

  if (actionType && saveActions.includes(actionType)) {
    store.dispatch(setSaveStatus('saving'));
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const dispatch = store.dispatch as unknown as (thunk: ReturnType<typeof saveActiveDocument>) => void;
      dispatch(saveActiveDocument());
    }, 500);
  }

  return result;
};
