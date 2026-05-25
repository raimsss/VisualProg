import { FileSpreadsheet, LayoutDashboard, User } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export default function AppLayout() {
  const location = useLocation();
  const activeDoc = useAppSelector(state => (
    state.documents.items.find(doc => doc.id === state.documents.activeDocumentId)
  ));
  const isDocument = location.pathname.startsWith('/documents/');

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/dashboard" className="brand">VisualProg</Link>
        <div className="breadcrumbs">
          <Link to="/dashboard">Мои документы</Link>
          {isDocument && (
            <>
              <span>/</span>
              <span>{activeDoc?.title || 'Документ'}</span>
            </>
          )}
        </div>
      </header>

      <aside className="sidebar">
        <NavLink to="/dashboard"><LayoutDashboard size={18} /> Документы</NavLink>
        <NavLink to="/profile"><User size={18} /> Профиль</NavLink>
        {activeDoc && <NavLink to={`/documents/${activeDoc.id}`}><FileSpreadsheet size={18} /> Таблица</NavLink>}
      </aside>

      <section className="page">
        <Outlet />
      </section>
    </div>
  );
}
