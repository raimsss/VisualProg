import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export default function ProfilePage() {
  const user = useAppSelector(state => state.auth.user);
  const location = useLocation();

  return (
    <main className="simple-page">
      <h1>Профиль</h1>
      <p>Пользователь: {user.name}</p>
      <p>Текущий путь: {location.pathname}</p>
    </main>
  );
}
