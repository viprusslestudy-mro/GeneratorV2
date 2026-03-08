import { useState, useEffect } from 'react';
import { useRetentionData } from './hooks/useRetentionData';
import { useRetentionStore } from './store/retentionStore';
import { Loader } from './components/shared/Loader/Loader';
import { Sidebar } from './components/shared/Sidebar/Sidebar';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { ChannelsDashboard } from './components/channels/ChannelsDashboard';
import { SupportDashboard } from './components/support/SupportDashboard';
import './App.css';

export default function App() {
  const { data, loading, error } = useRetentionData();
  const language = useRetentionStore(state => state.language);
  const setLanguage = useRetentionStore(state => state.setLanguage);
  
  const [activeScreen, setActiveScreen] = useState('finance');

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
    </div>
  );
}