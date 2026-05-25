import { createSlice } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
}

interface AuthState {
  user: User;
}

const initialState: AuthState = {
  user: {
    id: 'local-user',
    name: 'Пользователь',
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
});

export default authSlice.reducer;
