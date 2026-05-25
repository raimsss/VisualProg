import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import SpreadsheetPage from './pages/SpreadsheetPage';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { loadDocuments, saveActiveDocument } from './store/slices/documentsSlice';
import { redo, undo } from './store/slices/spreadsheetSlice';

export default function App() {
  const dispatch = useAppDispatch();
  const activeDocumentId = useAppSelector(state => state.documents.activeDocumentId);
  const dirty = useAppSelector(state => state.spreadsheet.dirty);

  useEffect(() => {
    dispatch(loadDocuments());
  }, [dispatch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!activeDocumentId) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        dispatch(saveActiveDocument());
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch(undo());
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch(redo());
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDocumentId, dispatch]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents/:documentId" element={<SpreadsheetPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
