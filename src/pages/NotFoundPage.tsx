import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="simple-page">
      <h1>Страница не найдена</h1>
      <p>Такого адреса нет или документ был удалён.</p>
      <Link className="btn primary" to="/dashboard">К документам</Link>
    </main>
  );
}
