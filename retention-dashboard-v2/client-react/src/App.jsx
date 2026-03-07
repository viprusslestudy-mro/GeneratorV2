/*
 * ═══════════════════════════════════════════════════════════════════════════
 *  App.jsx - Главный компонент React приложения Retention Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useRetentionData } from './hooks/useRetentionData';
import { Loader } from './components/shared/Loader/Loader';
import { Sidebar } from './components/shared/Sidebar/Sidebar';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import './App.css';

export default function App() {
  const { data, loading, error } = useRetentionData();

  // Состояние загрузки
  if (loading) {
    return <Loader message="Загрузка данных из Google Sheets..." />;
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Ошибка загрузки</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          🔄 Попробовать снова
        </button>
      </div>
    );
  }

  // Нет данных
  if (!data) {
    return (
      <div className="error-container">
        <h2>📭 Нет данных</h2>
        <p>Проверьте настройки Google Sheets</p>
      </div>
    );
  }

  // Успешная загрузка — показываем Dashboard с Sidebar
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <FinanceDashboard />
      </main>
    </div>
  );
}
