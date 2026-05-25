import { useEffect, useState } from 'react';
import { Navigate, useBlocker, useNavigate, useParams } from 'react-router-dom';
import Spreadsheet from '../components/Spreadsheet';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeDocument, loadDocument } from '../store/slices/documentsSlice';

export default function SpreadsheetPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const dirty = useAppSelector(state => state.spreadsheet.dirty);
  const activeDocumentId = useAppSelector(state => state.documents.activeDocumentId);
  const [badDocumentId, setBadDocumentId] = useState<string | null>(null);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => (
    dirty && currentLocation.pathname !== nextLocation.pathname
  ));

  useEffect(() => {
    if (!documentId) {
      return;
    }

    dispatch(loadDocument(documentId))
      .unwrap()
      .catch(() => setBadDocumentId(documentId));
  }, [dispatch, documentId]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Есть несохранённые изменения. Перейти без сохранения?')) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  if (!documentId || badDocumentId === documentId) {
    return <Navigate to="/404" replace />;
  }

  if (!activeDocumentId) {
    return <main className="simple-page"><p>Загрузка документа...</p></main>;
  }

  return (
    <Spreadsheet
      onBack={() => {
        dispatch(closeDocument());
        navigate('/dashboard');
      }}
    />
  );
}
