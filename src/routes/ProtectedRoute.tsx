import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export default function ProtectedRoute() {
  const user = useAppSelector(state => state.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
