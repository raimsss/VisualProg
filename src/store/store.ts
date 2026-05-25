import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import documentsReducer from './slices/documentsSlice.js';
import spreadsheetReducer from './slices/spreadsheetSlice.js';
import uiReducer from './slices/uiSlice.js';
import { autosaveMiddleware } from './middleware/autosaveMiddleware.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    spreadsheet: spreadsheetReducer,
    ui: uiReducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(autosaveMiddleware),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
