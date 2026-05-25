import { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Spreadsheet from './components/Spreadsheet';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { closeDocument, loadDocuments, saveActiveDocument } from './store/slices/documentsSlice';
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
    <div className="app-container">
      {activeDocumentId ? (
        <Spreadsheet onBack={() => dispatch(closeDocument())} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}
