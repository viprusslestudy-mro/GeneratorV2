/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  App.jsx - Главный компонент React приложения Retention Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { useRetentionData } from './hooks/useRetentionData';
import { Loader } from './components/shared/Loader/Loader';
import { Sidebar } from './components/shared/Sidebar/Sidebar';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { ChannelsDashboard } from './components/channels/ChannelsDashboard';
import './App.css';

export default function App() {
  const { data, loading, error } = useRetentionData();
  const [language, setLanguage] = useState('RU');
  
  // Добавляем state для активного экрана (временно, потом перенесём в store/router)
  const [activeScreen, setActiveScreen] = useState('finance'); // 'finance' | 'channels'

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
      {/* Language Switcher - Top Right */}
      <div className="language-switcher-top">
        <button
          className={`lang-btn-top ${language === 'RU' ? 'active' : ''}`}
          onClick={() => setLanguage('RU')}
        >
          RU
        </button>
        <button
          className={`lang-btn-top ${language === 'EN' ? 'active' : ''}`}
          onClick={() => setLanguage('EN')}
        >
          EN
        </button>
      </div>

      <Sidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      
      <main className="main-content">
        {activeScreen === 'finance' ? <FinanceDashboard /> : <ChannelsDashboard />}
      </main>
    </div>
  );
}
