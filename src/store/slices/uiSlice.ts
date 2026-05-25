import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type SaveStatus = 'saved' | 'saving' | 'error';

interface UiState {
  createModalOpen: boolean;
  saveStatus: SaveStatus;
  notification: string | null;
}

const initialState: UiState = {
  createModalOpen: false,
  saveStatus: 'saved',
  notification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCreateModal(state) {
      state.createModalOpen = true;
    },
    closeCreateModal(state) {
      state.createModalOpen = false;
    },
    setSaveStatus(state, action: PayloadAction<SaveStatus>) {
      state.saveStatus = action.payload;
    },
    setNotification(state, action: PayloadAction<string | null>) {
      state.notification = action.payload;
    },
  },
});

export const { closeCreateModal, openCreateModal, setNotification, setSaveStatus } = uiSlice.actions;
export default uiSlice.reducer;
