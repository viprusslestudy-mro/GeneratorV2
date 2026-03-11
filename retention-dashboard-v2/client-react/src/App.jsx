import { useState, useEffect } from 'react';
import { useRetentionData } from './hooks/useRetentionData';
import { useRetentionStore } from './store/retentionStore';
import { Loader } from './components/shared/Loader/Loader';
import { Sidebar } from './components/shared/Sidebar/Sidebar';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { ChannelsDashboard } from './components/channels/ChannelsDashboard';
import { SupportDashboard } from './components/support/SupportDashboard';
import { DevModePanel } from './components/shared/DevModePanel/DevModePanel';
import './App.css';

export default function App() {
  const { data, loading, error } = useRetentionData();
  const language = useRetentionStore(state => state.language);
  const setLanguage = useRetentionStore(state => state.setLanguage);
  
  const [activeScreen, setActiveScreen] = useState('finance');

  const setCurrentScreen = useRetentionStore(state => state.setCurrentScreen);

  // Добавить useEffect для синхронизации
  useEffect(() => {
    setCurrentScreen(activeScreen);
  }, [activeScreen, setCurrentScreen]);

  // ═══ ДИНАМИЧЕСКИЙ TITLE И FAVICON ═══
  const projectSettings = useRetentionStore(state => state.projectSettings);

  useEffect(() => {
    if (!projectSettings) return;

    // 1. Смена названия вкладки
    document.title = projectSettings.pageTitle || projectSettings.name || 'Dashboard';

    // 2. Смена Favicon
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (projectSettings.logoUrl) {
      // Приоритет 1: Картинка логотипа
      link.href = projectSettings.logoUrl;
    } else if (projectSettings.icon) {
      // Приоритет 2: Emoji конвертируется в SVG
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${projectSettings.icon}</text></svg>`;
      link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } else {
      // Фолбэк по умолчанию
      link.href = '/vite.svg';
    }
  }, [projectSettings]);

  // Читаем только необходимые функции
  const setSupportPeriod = useRetentionStore(state => state.setSupportPeriod);
  const setRetentionPeriod = useRetentionStore(state => state.setPeriod);

  useEffect(() => {
    // Получаем текущее состояние из store только в момент смены экрана
    const state = useRetentionStore.getState();
    const supportPeriods = state.supportPeriodsCache || [];
    const retentionPeriods = state.data?.periods || [];

    if (activeScreen === 'support_tags') {
      const currentPeriod = supportPeriods.find(p => p.key === state.selectedSupportPeriod);
      if (currentPeriod && !currentPeriod.hasTags) {
        const firstValid = supportPeriods.find(p => p.hasTags);
        if (firstValid) setSupportPeriod(firstValid.key);
      }
    }
    
    if (activeScreen === 'support_stats') {
      const currentPeriod = supportPeriods.find(p => p.key === state.selectedSupportPeriod);
      if (currentPeriod && !currentPeriod.hasKPI) {
        const firstValid = supportPeriods.find(p => p.hasKPI);
        if (firstValid) setSupportPeriod(firstValid.key);
      }
    }
    
    if (activeScreen === 'channels') {
      const currentPeriod = retentionPeriods.find(p => p.key === state.selectedPeriod);
      if (currentPeriod && !currentPeriod.hasChannels) {
        const firstValid = retentionPeriods.find(p => p.hasChannels);
        if (firstValid) setRetentionPeriod(firstValid.key);
      }
    }
  }, [activeScreen, setSupportPeriod, setRetentionPeriod]);

  if (loading) return <Loader message="Загрузка данных..." />;

  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Ошибка загрузки</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>🔄 Попробовать снова</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="error-container">
        <h2>📭 Нет данных</h2>
        <p>Запустите сбор данных из таблицы</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="language-switcher-top">
        <button 
          className={`lang-btn-top ${language === 'RU' ? 'active' : ''}`}
          onClick={() => setLanguage('RU')}
        >RU</button>
        <button 
          className={`lang-btn-top ${language === 'EN' ? 'active' : ''}`}
          onClick={() => setLanguage('EN')}
        >EN</button>
      </div>

      <Sidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      
      <main className="main-content">
        {activeScreen === 'finance' && <FinanceDashboard />}
        {activeScreen === 'channels' && <ChannelsDashboard />}
        {activeScreen === 'support_stats' && <SupportDashboard type="stats" />}
        {activeScreen === 'support_tags' && <SupportDashboard type="tags" />}
      </main>

      <DevModePanel />
    </div>
  );
}