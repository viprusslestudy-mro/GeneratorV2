RETENTION DASHBOARD v2.0 — React Migration Plan
Версия: 2.0.0 (ФИНАЛЬНАЯ)
Дата: 2025-01-16
ВАЖНО: Этот план составлен на основе полного анализа 16 файлов текущей кодовой базы.
Сохраните этот документ — он содержит пошаговые инструкции для миграции даже без помощи AI.

📋 СОДЕРЖАНИЕ
Executive Summary
Анализ текущей архитектуры
Целевая архитектура v2.0
Технологический стек
Структура проекта
Поток данных
API Контракты
Компонентная архитектура
Этапы миграции
Инструкции для продолжения
1. EXECUTIVE SUMMARY
Что мигрируем
Текущее состояние:

Монолитное Google Apps Script приложение
HTML генерируется на сервере (16,000+ строк кода)
jQuery + Chart.js для интерактивности
Google Sheets как единственный источник данных
Целевое состояние:

React SPA с серверным API
Google Apps Script только для Data Layer
Modern React stack (Hooks, Context, React Router)
Деплой через clasp + Vite
Ключевые метрики
Параметр	Текущее	После миграции
Файлов кода	60+ (GAS)	~120 (40 GAS + 80 React)
Размер HTML	~2-5 MB	~500 KB (initial) + lazy chunks
Time to Interactive	8-15 сек	2-4 сек
Maintainability	4/10	9/10
2. АНАЛИЗ ТЕКУЩЕЙ АРХИТЕКТУРЫ
2.1 Критические компоненты
Data Layer (Apps Script)
text

DataReader (оркестратор)
├── collectRetentionData()
│   ├── readRetentionFinance()    → Product Stat
│   └── readRetentionChannels()   → Комуникации TOTAL
│
└── createReportJSON()
    └── Returns: { periods, ui, localization, summary }
Ключевые особенности:

Динамические метрики — поддержка runtime добавления метрик через конфиг
Year-блоки — группировка периодов по годам с ON/OFF переключателями
Базовые месяцы — для первого месяца дельта не рассчитывается
Hierarchical config — трёхуровневая система (лист → год → месяц)
Settings Layer
text

SettingsManager
├── getMasterSettingsSpreadsheetId() → ID мастер-таблицы
├── getActiveMonthsForSource()       → фильтр периодов
└── getActiveDataSourcesV3()         → список источников

MetricsConfigManager (3 модуля)
├── Finance:  parseFinanceMetricsSheetConfig()
├── Channels: parseChannelMetricsSheetConfig()
└── Shared:   loadMetricsConfig() + кэш
Важные функции:

isFinanceMetricEnabledForPeriod(rowName, periodKey, sheetName) — проверка ON/OFF
isChannelMetricEnabledForPeriod(sheetName, periodKey, channel, metric)
refreshChannelMetaFromConfig() — обновление UI labels
HTML Builder Layer
text

HTMLBuilder (точка входа)
├── buildRetentionHTML()      → Standalone (preview)
├── buildAppShell()           → SPA wrapper
└── loadContent()             → Dynamic loading

HTMLBuilder_Body
└── buildRetentionBody()
    ├── Finance: buildFinanceDashboardHTML()
    └── Channels: buildChannelsDashboardHTML()
Генерируемая структура:

HTML

<div class="app">
  <aside class="sidebar">...</aside>
  <main class="dashboard">
    <div class="kpi-cards">...</div>
    <div class="charts">...</div>
    <div class="tables">...</div>
  </main>
  <div class="growth-sidebar">...</div>
</div>
2.2 Поток данных (текущий)
text

┌─────────────────────────────────────────┐
│   Google Sheets (Settings Master)      │
│   - Ret. FINANCE METRICS                │
│   - Ret. CHANNEL METRICS                │
│   - 📊 ИСТОЧНИКИ ДАННЫХ                 │
└────────────┬────────────────────────────┘
             │ (Apps Script API)
             ↓
┌─────────────────────────────────────────┐
│   DataReader (Apps Script)              │
│   - SettingsManager.getActiveMonths()   │
│   - collectRetentionData()              │
└────────────┬────────────────────────────┘
             │ (in-memory)
             ↓
┌─────────────────────────────────────────┐
│   DataModel (Apps Script)               │
│   - createReportJSON()                  │
│   - createFinanceCards()                │
│   - createChannelCards()                │
└────────────┬────────────────────────────┘
             │ (embedded JSON)
             ↓
┌─────────────────────────────────────────┐
│   HTMLBuilder (Apps Script)             │
│   - buildRetentionBody()                │
│   - Inline JavaScript (8000+ lines)     │
└────────────┬────────────────────────────┘
             │ (Base64 encoded)
             ↓
┌─────────────────────────────────────────┐
│   Browser (download .html)              │
│   - jQuery DOM manipulation             │
│   - Chart.js rendering                  │
└─────────────────────────────────────────┘
2.3 Узкие места текущей архитектуры
Проблема	Влияние	Решение в v2.0
HTML генерация на сервере	⏱️ 30-60 сек	Генерация JSON (2-5 сек)
Monolithic JS bundle	📦 2 MB+	Code splitting + lazy load
jQuery spaghetti code	🐛 Сложность отладки	React components
No proper state management	🔄 Дублирование логики	Zustand store
Manual DOM updates	🎨 Рассинхронизация UI	React virtual DOM
3. ЦЕЛЕВАЯ АРХИТЕКТУРА v2.0
3.1 Высокоуровневая архитектура
text

┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Components  │  │    Hooks     │  │    Store     │          │
│  │  - Finance   │  │  - useData   │  │  - Zustand   │          │
│  │  - Channels  │  │  - useFilter │  │  - Persist   │          │
│  │  - Shared    │  │  - useChart  │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            ↓                                     │
│                    ┌──────────────┐                              │
│                    │   API Layer  │                              │
│                    │  (gasApi.js) │                              │
│                    └──────┬───────┘                              │
└───────────────────────────┼──────────────────────────────────────┘
                            │ google.script.run
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  SERVER (Google Apps Script)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      API Endpoints                       │   │
│  │  - api_getRetentionReport()                             │   │
│  │  - api_getUISettings()                                  │   │
│  │  - api_getSources()                                     │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              Data Layer (UNCHANGED)                      │   │
│  │  - DataReader (collectRetentionData)                    │   │
│  │  - DataModel  (createReportJSON)                        │   │
│  │  - SettingsManager                                      │   │
│  │  - MetricsConfigManager                                 │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ↓
              ┌────────────────────────┐
              │   Google Sheets        │
              │  - Settings Master     │
              │  - Product Stat        │
              │  - Комуникации TOTAL   │
              └────────────────────────┘
3.2 Разделение ответственности
Слой	Текущее	v2.0	Преимущество
Презентация	jQuery + HTML strings	React components	Декларативный UI
Состояние	Global vars	Zustand store	Предсказуемость
Маршрутизация	Hash navigation	React Router	SEO + deep links
Данные	Embedded JSON	API calls	Кэширование
Графики	Chart.js	Recharts	React-native
4. ТЕХНОЛОГИЧЕСКИЙ СТЕК
4.1 Frontend
JSON

{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "recharts": "^2.10.3",
    "date-fns": "^3.0.6",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "vite-plugin-singlefile": "^0.13.5"
  }
}
Почему эти библиотеки:

React 18 — современные Hooks, Concurrent features
Zustand — легче Redux (2KB vs 40KB), без boilerplate
Recharts — React-native графики, SSR-ready
date-fns — легче moment.js, tree-shakeable
vite-plugin-singlefile — для Apps Script (один .html файл)
4.2 Backend (без изменений)
Google Apps Script — ES5 совместимость
Текущие модули — полностью переиспользуем Data Layer
4.3 Build Process
Bash

# Development
npm run dev          # Vite dev server (localhost:5173)
                     # + моки для google.script.run

# Production
npm run build        # → dist/index.html (inline CSS/JS)
clasp push           # → Apps Script deployment
5. СТРУКТУРА ПРОЕКТА
text

retention-dashboard-v2/
│
├── .git/
├── .gitignore
├── README.md
├── MIGRATION_PLAN.md          # 👈 этот документ
│
├── apps-script/               # 🔧 Серверная часть
│   ├── src/
│   │   ├── api/              # ✅ НОВОЕ
│   │   │   ├── RetentionAPI.js
│   │   │   ├── SupportAPI.js
│   │   │   └── SettingsAPI.js
│   │   │
│   │   ├── modelstore/       # ♻️ ПЕРЕИСПОЛЬЗУЕМ
│   │   │   ├── retention/
│   │   │   │   ├── DataReader.js
│   │   │   │   ├── DataReader_Finance.js
│   │   │   │   ├── DataReader_Channels.js
│   │   │   │   ├── DataModel.js
│   │   │   │   ├── DataModel_Finance.js
│   │   │   │   └── DataModel_Channels.js
│   │   │   ├── support/      # (для будущего)
│   │   │   └── shared/
│   │   │       └── SourceUtils.js
│   │   │
│   │   ├── managers/         # ♻️ ПЕРЕИСПОЛЬЗУЕМ
│   │   │   ├── SettingsManager.js
│   │   │   ├── MetricsConfigManager.js
│   │   │   ├── MetricsConfigManager_Finance.js
│   │   │   └── MetricsConfigManager_Channels.js
│   │   │
│   │   ├── Config.js         # ♻️ БЕЗ ИЗМЕНЕНИЙ
│   │   ├── Main.js           # ✅ ИЗМЕНЕНО (+ serveReactApp)
│   │   ├── Menu.js           # ♻️ БЕЗ ИЗМЕНЕНИЙ
│   │   └── Utils.js          # ♻️ БЕЗ ИЗМЕНЕНИЙ
│   │
│   ├── .clasp.json
│   └── appsscript.json
│
└── client-react/              # ⚛️ React приложение
    ├── public/
    │   ├── favicon.ico
    │   └── mocks/            # Моки для dev режима
    │       ├── api_getRetentionReport.json
    │       ├── api_getUISettings.json
    │       └── api_getSources.json
    │
    ├── src/
    │   ├── api/              # 🌐 GAS API wrappers
    │   │   ├── gasApi.js
    │   │   └── retentionApi.js
    │   │
    │   ├── components/
    │   │   ├── shared/       # ♻️ Переиспользуемые
    │   │   │   ├── Card/
    │   │   │   │   ├── Card.jsx
    │   │   │   │   └── Card.module.css
    │   │   │   ├── MetricCard/
    │   │   │   │   ├── MetricCard.jsx
    │   │   │   │   └── MetricCard.module.css
    │   │   │   ├── Sidebar/
    │   │   │   ├── Loader/
    │   │   │   └── ErrorBoundary/
    │   │   │
    │   │   ├── finance/      # 💰 Finance Dashboard
    │   │   │   ├── FinanceDashboard.jsx
    │   │   │   ├── FinanceKPI.jsx
    │   │   │   ├── FinanceTable.jsx
    │   │   │   ├── FinanceChart.jsx
    │   │   │   ├── FinanceGrowthSidebar.jsx
    │   │   │   └── styles/
    │   │   │
    │   │   └── channels/     # 📈 Channels Dashboard
    │   │       ├── ChannelsDashboard.jsx
    │   │       ├── ChannelKPI.jsx
    │   │       ├── ChannelTable.jsx
    │   │       ├── ChannelChart.jsx
    │   │       └── styles/
    │   │
    │   ├── hooks/            # 🪝 Custom Hooks
    │   │   ├── useRetentionData.js
    │   │   ├── useLocalization.js
    │   │   └── usePeriodFilter.js
    │   │
    │   ├── store/            # 🗄️ State Management
    │   │   ├── retentionStore.js
    │   │   └── uiStore.js
    │   │
    │   ├── utils/            # 🛠️ Helpers
    │   │   ├── formatters.js
    │   │   ├── chartHelpers.js
    │   │   └── constants.js
    │   │
    │   ├── styles/           # 🎨 Global Styles
    │   │   ├── global.css
    │   │   └── variables.css
    │   │
    │   ├── App.jsx           # 🏠 Root Component
    │   ├── main.jsx          # 🚀 Entry Point
    │   └── index.css
    │
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── .env
6. ПОТОК ДАННЫХ
6.1 Новый поток данных (v2.0)
text

┌──────────────────────────────────────────────────────────────┐
│  1. МОНТИРОВАНИЕ ПРИЛОЖЕНИЯ                                  │
│  App.jsx → useRetentionData() hook                           │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│  2. ЗАПРОС ДАННЫХ (клиент)                                   │
│  retentionApi.getReport()                                    │
│  ↓                                                            │
│  gasApi.call('api_getRetentionReport')                       │
└─────────────────────┬────────────────────────────────────────┘
                      │ google.script.run
                      ↓
┌──────────────────────────────────────────────────────────────┐
│  3. API ENDPOINT (сервер)                                    │
│  api_getRetentionReport() {                                  │
│    const data = collectRetentionData();                      │
│    const json = createReportJSON(activeMonths, data);        │
│    return json; // ← возврат чистого JSON                   │
│  }                                                            │
└─────────────────────┬────────────────────────────────────────┘
                      │ JSON response
                      ↓
┌──────────────────────────────────────────────────────────────┐
│  4. STATE UPDATE (клиент)                                    │
│  useRetentionStore.setState({ data: json })                  │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│  5. РЕНДЕРИНГ (React)                                        │
│  FinanceDashboard → FinanceKPI → MetricCard                  │
│  (автоматическое обновление при изменении store)             │
└──────────────────────────────────────────────────────────────┘
6.2 Оптимизация: кэширование
JavaScript

// client-react/src/api/gasApi.js

class GASApi {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут
  }

  async call(functionName, ...args) {
    const cacheKey = `${functionName}:${JSON.stringify(args)}`;
    
    // Проверяем кэш
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTimeout) {
        console.log(`[Cache HIT] ${functionName}`);
        return data;
      }
    }

    // Вызов сервера
    const data = await new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [functionName](...args);
    });

    // Сохраняем в кэш
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}
7. API КОНТРАКТЫ
7.1 API Endpoints (Apps Script)
api_getRetentionReport()
Response:

TypeScript

interface RetentionReport {
  project: string;                    // "RETENZA"
  reportTitle: string;                // "Retention Dashboard"
  generatedAt: string;                // ISO date
  periodsCount: number;               // 12
  periods: Period[];                  // Массив периодов
  ui: UISettings;                     // Настройки UI
  localization: LocalizationSettings; // Переводы
  baseMonths: {
    finance: string | null;           // "2024-12"
    channels: string | null;
  };
  summary: {
    totalDepositsCount: number;
    totalDepositsAmount: number;
    totalProfit: number;
  };
  meta?: {
    version: string;                  // "1.0.93.7"
  };
}

interface Period {
  key: string;                        // "2025-01"
  label: string;                      // "Январь 2025"
  enabled: boolean;
  hasFinance: boolean;
  hasChannels: boolean;
  cards: MetricCard[];                // Finance метрики
  channelCards: Record<string, ChannelData>;
  totalChannels: {
    sent: number;
    conversions: number;
    click: number;
  };
}

interface MetricCard {
  id: string;                         // "total_deposits_count"
  title: string;                      // "Тотал кол-во депозитов"
  value: number | null;
  diff: string;                       // "+15.5%" или ""
  valueFormat: 'currency' | 'integer' | 'percent' | 'decimal';
  icon: string;                       // "💰"
  category: string;                   // "deposits", "sport", etc
  order: number;
  disabled?: boolean;
}

interface ChannelData {
  name: string;                       // "App Push"
  icon: string;                       // "📱"
  cards: MetricCard[];
  fullyDisabled: boolean;
}

interface UISettings {
  financeTabs?: Record<string, string>;  // { deposits: "ДЕПОЗИТЫ" }
  channelTabs?: Record<string, string>;
}

interface LocalizationSettings {
  defaultLang: string;                // "RU"
  showSwitcher: boolean;
  translations?: Record<string, Record<string, string>>;
}
api_getUISettings()
Response:

TypeScript

interface UISettingsResponse {
  financeTabs: Record<string, string>;
  channelTabs: Record<string, string>;
  showEmptyMetrics: boolean;
  disabledLabel: string;              // "—"
}
api_getSources()
Response:

TypeScript

interface SourceInfo {
  key: string;                        // "retention"
  name: string;                       // "Retention"
  template: string;                   // "Retention"
  icon: string;                       // "📊"
  color: string;                      // "#9c27b0"
}

type SourcesResponse = SourceInfo[];
7.2 Client API (React)
Файл: client-react/src/api/retentionApi.js

JavaScript

import { gasApi } from './gasApi';

export const retentionApi = {
  /**
   * Получить полный отчёт Retention
   */
  async getReport() {
    return gasApi.call('api_getRetentionReport');
  },

  /**
   * Получить настройки UI
   */
  async getUISettings() {
    return gasApi.call('api_getUISettings');
  },

  /**
   * Получить список источников
   */
  async getSources() {
    return gasApi.call('api_getSources');
  }
};
8. КОМПОНЕНТНАЯ АРХИТЕКТУРА
8.1 Component Tree
text

App
├── ErrorBoundary
└── BrowserRouter
    ├── Sidebar
    │   ├── Logo
    │   ├── Navigation
    │   │   ├── NavItem (Finance) ✅
    │   │   └── NavItem (Channels) ✅
    │   └── PeriodSelector
    │       └── PeriodItem (×12) ✅
    │
    ├── Routes
    │   ├── Route /finance
    │   │   └── FinanceDashboard
    │   │       ├── FinanceKPI
    │   │       │   └── MetricCard (×4)
    │   │       ├── FinanceChart
    │   │       │   ├── MetricSelector
    │   │       │   └── LineChart (Recharts)
    │   │       └── FinanceTable
    │   │           ├── TabNav (Deposits/Sport/Casino)
    │   │           └── MetricsTable
    │   │
    │   └── Route /channels
    │       └── ChannelsDashboard
    │           ├── ChannelKPI
    │           │   └── MetricCard (×3)
    │           ├── ChannelChart
    │           │   ├── ChannelSelector
    │           │   └── BarChart (Recharts)
    │           └── ChannelTable
    │               ├── TabNav (Email/Push/SMS...)
    │               └── MetricsTable
    │
    └── GrowthSidebar (collapsible)
        ├── SectionSelector
        └── GrowthChart (sparkline)
8.2 Ключевые компоненты
Shared Components
React

// Card.jsx
export function Card({ children, title, className }) {
  return (
    <div className={clsx(styles.card, className)}>
      {title && <div className={styles.title}>{title}</div>}
      {children}
    </div>
  );
}

// MetricCard.jsx
export function MetricCard({ metric }) {
  const { icon, title, value, diff, valueFormat, disabled } = metric;

  return (
    <div className={clsx(styles.metric, disabled && styles.disabled)}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.value}>
          {disabled ? '—' : formatValue(value, valueFormat)}
        </div>
        {diff && !disabled && (
          <div className={clsx(styles.diff, getDiffClass(diff))}>
            {diff}
          </div>
        )}
      </div>
    </div>
  );
}
Finance Dashboard
React

// FinanceDashboard.jsx
export function FinanceDashboard() {
  const { currentPeriodData } = usePeriodFilter();
  const { financeTabs } = useRetentionStore(state => state.ui);

  if (!currentPeriodData) {
    return <EmptyState message="Выберите период" />;
  }

  return (
    <div className={styles.dashboard}>
      <FinanceKPI period={currentPeriodData} />
      <FinanceChart period={currentPeriodData} />
      <FinanceTable period={currentPeriodData} tabs={financeTabs} />
    </div>
  );
}

// FinanceKPI.jsx
export function FinanceKPI({ period }) {
  const kpiMetrics = period.cards
    .filter(c => KPI_METRIC_IDS.includes(c.id))
    .sort((a, b) => a.order - b.order);

  return (
    <Card title="Ключевые показатели">
      <div className={styles.grid}>
        {kpiMetrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </Card>
  );
}

const KPI_METRIC_IDS = [
  'total_deposits_count',
  'total_deposits_amount',
  'total_profit',
  'ftd_amount'
];
Channels Dashboard
React

// ChannelsDashboard.jsx
export function ChannelsDashboard() {
  const { currentPeriodData } = usePeriodFilter();
  const { channelTabs } = useRetentionStore(state => state.ui);

  return (
    <div className={styles.dashboard}>
      <ChannelKPI period={currentPeriodData} />
      <ChannelChart period={currentPeriodData} />
      <ChannelTable period={currentPeriodData} tabs={channelTabs} />
    </div>
  );
}

// ChannelTable.jsx
export function ChannelTable({ period, tabs }) {
  const [activeChannel, setActiveChannel] = useState('push');

  const channelData = period.channelCards[activeChannel];

  return (
    <Card title="Детальная статистика">
      <div className={styles.tabs}>
        {Object.entries(tabs).map(([key, label]) => (
          <button
            key={key}
            className={clsx(styles.tab, activeChannel === key && styles.active)}
            onClick={() => setActiveChannel(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {channelData.fullyDisabled ? (
        <EmptyState message="Канал отключён" />
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Метрика</th>
              <th>Значение</th>
              <th>Изменение</th>
            </tr>
          </thead>
          <tbody>
            {channelData.cards.map(metric => (
              <tr key={metric.id}>
                <td>{metric.title}</td>
                <td>{formatValue(metric.value, metric.valueFormat)}</td>
                <td className={getDiffClassName(metric.diff)}>
                  {metric.diff || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
8.3 Custom Hooks
JavaScript

// useRetentionData.js
import { useEffect } from 'react';
import { useRetentionStore } from '../store/retentionStore';

export function useRetentionData() {
  const { data, loading, error, fetchData } = useRetentionStore();

  useEffect(() => {
    if (!data && !loading && !error) {
      fetchData();
    }
  }, [data, loading, error, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// usePeriodFilter.js
import { useRetentionStore } from '../store/retentionStore';

export function usePeriodFilter() {
  const selectedPeriod = useRetentionStore(state => state.selectedPeriod);
  const setPeriod = useRetentionStore(state => state.setPeriod);
  const periods = useRetentionStore(state => state.periods);

  const currentPeriodData = periods.find(p => p.key === selectedPeriod);

  return {
    selectedPeriod,
    setPeriod,
    periods,
    currentPeriodData
  };
}
8.4 Zustand Store
JavaScript

// retentionStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { retentionApi } from '../api/retentionApi';

export const useRetentionStore = create(
  persist(
    (set, get) => ({
      // State
      data: null,
      loading: false,
      error: null,
      selectedPeriod: null,

      // Actions
      async fetchData() {
        set({ loading: true, error: null });
        
        try {
          const data = await retentionApi.getReport();
          
          set({ 
            data, 
            loading: false,
            // Выбираем последний период по умолчанию
            selectedPeriod: data.periods[data.periods.length - 1]?.key || null
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      setPeriod(periodKey) {
        set({ selectedPeriod: periodKey });
      },

      // Derived state (computed values)
      get periods() {
        return get().data?.periods || [];
      },

      get ui() {
        return get().data?.ui || {};
      },

      get baseMonths() {
        return get().data?.baseMonths || {};
      }
    }),
    {
      name: 'retention-store',
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod
      })
    }
  )
);
9. ЭТАПЫ МИГРАЦИИ
📦 ЭТАП 0: Подготовка окружения (1 день)
Задачи:
✅ Создать структуру проекта
✅ Инициализировать React + Vite
✅ Настроить clasp для Apps Script
✅ Установить зависимости
Команды:
Bash

# 1. Создание корневой папки
mkdir retention-dashboard-v2
cd retention-dashboard-v2

# 2. Создание React проекта
npm create vite@latest client-react -- --template react
cd client-react
npm install

# 3. Установка зависимостей
npm install zustand recharts react-router-dom date-fns clsx
npm install -D vite-plugin-singlefile

# 4. Настройка Apps Script
cd ..
mkdir apps-script
cd apps-script
npm install -g @google/clasp
clasp login
clasp create --type standalone --title "Retention Dashboard v2.0"

# 5. Копируем существующий код
# (вручную скопировать файлы из старого проекта в apps-script/src/)
Файлы для создания:
client-react/vite.config.js

JavaScript

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // Для Apps Script (один HTML файл)
  ],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000 // Inline все ассеты
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
apps-script/.clasp.json

JSON

{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./src"
}
client-react/.env

Bash

VITE_DEV_MODE=true
VITE_MOCK_API=true
📦 ЭТАП 1: API Layer (2 дня)
1.1 Серверный API (Apps Script)
Файл: apps-script/src/api/RetentionAPI.js

JavaScript

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RETENTION API - Endpoints для React приложения
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Получить JSON данные Retention отчёта
 * @returns {Object} { periods, ui, localization, summary }
 */
function api_getRetentionReport() {
  try {
    logInfo('[API] getRetentionReport called');
    
    // Инвалидируем кэш для актуальных данных
    invalidateMetricsConfigCache();
    
    // Получаем конфиг источника
    const sourceConfig = getSourceByKey('retention');
    
    // Получаем активные месяцы
    const activeMonths = getActiveMonthsForSource('retention');
    
    // Собираем данные (используем существующую логику)
    const retentionData = collectRetentionData(sourceConfig);
    
    // Создаём JSON отчёт
    const reportJSON = createReportJSON(activeMonths, retentionData);
    
    // Добавляем метаданные
    reportJSON.meta = {
      generatedAt: new Date().toISOString(),
      version: CONFIG.VERSION
    };
    
    logSuccess('[API] Report generated', `${reportJSON.periodsCount} periods`);
    
    return reportJSON;
    
  } catch (e) {
    logError('[API] getRetentionReport error', e.message);
    throw new Error('Failed to load retention data: ' + e.message);
  }
}

/**
 * Получить настройки UI (табы, лейблы)
 * @returns {Object} { financeTabs, channelTabs, showEmptyMetrics, disabledLabel }
 */
function api_getUISettings() {
  try {
    return {
      financeTabs: getFinanceTabLabelsFromSheet_(),
      channelTabs: getChannelTabLabelsFromSheet_(),
      showEmptyMetrics: getShowEmptyMetrics(),
      disabledLabel: getDisabledMetricLabel(),
      autoCalcChannelTotals: getAutoCalcChannelTotals()
    };
  } catch (e) {
    logError('[API] getUISettings error', e.message);
    return {
      financeTabs: {},
      channelTabs: {},
      showEmptyMetrics: false,
      disabledLabel: '—',
      autoCalcChannelTotals: true
    };
  }
}

/**
 * Получить список активных источников
 * @returns {Array} [{ key, name, template, icon, color }]
 */
function api_getSources() {
  try {
    const sources = getActiveDataSourcesV3();
    return sources.map(function(s) {
      return {
        key: s.key,
        name: s.name,
        template: s.template,
        icon: s.icon,
        color: s.color
      };
    });
  } catch (e) {
    logError('[API] getSources error', e.message);
    return [];
  }
}
Обновление Main.js:

JavaScript

// Добавить в конец файла

/**
 * Показать React Dashboard в диалоге
 */
function showReactDashboard() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const htmlContent = getReactAppHTML();
    
    const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(1600)
      .setHeight(900)
      .setTitle('Retention Dashboard v2.0');

    ui.showModalDialog(htmlOutput, '📊 Retention Dashboard v2.0');
    
  } catch (error) {
    ui.alert('❌ Ошибка', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Получить HTML React приложения
 */
function getReactAppHTML() {
  if (CONFIG.DEBUG) {
    // Dev режим: редирект на localhost
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Redirect to Dev</title></head>
        <body>
          <script>
            window.location.href = 'http://localhost:5173';
          </script>
        </body>
      </html>
    `;
  }
  
  // Production: встроенный HTML (после build)
  return HtmlService.createHtmlOutputFromFile('index').getContent();
}
1.2 Клиентский API wrapper
Файл: client-react/src/api/gasApi.js

JavaScript

/**
 * Базовый wrapper для google.script.run
 * Превращает callback-based API в Promise-based
 */

class GASApi {
  constructor() {
    this.isDevelopment = import.meta.env.VITE_DEV_MODE === 'true';
    this.useMocks = import.meta.env.VITE_MOCK_API === 'true';
  }

  /**
   * Вызвать серверную функцию
   * @param {string} functionName - имя функции в Apps Script
   * @param {...any} args - аргументы
   * @returns {Promise}
   */
  async call(functionName, ...args) {
    if (this.isDevelopment && this.useMocks) {
      return this.mockCall(functionName, ...args);
    }

    return new Promise((resolve, reject) => {
      // Проверяем наличие google.script.run
      if (typeof google === 'undefined' || !google.script) {
        reject(new Error('google.script.run недоступен. Запустите в Google Apps Script.'));
        return;
      }

      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [functionName](...args);
    });
  }

  /**
   * Моки для разработки (без Apps Script)
   */
  async mockCall(functionName, ...args) {
    console.log(`[MOCK] ${functionName}(${JSON.stringify(args)})`);
    
    // Эмулируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Загружаем моки из /public/mocks/
    try {
      const response = await fetch(`/mocks/${functionName}.json`);
      if (!response.ok) {
        throw new Error(`Mock not found: ${functionName}`);
      }
      return response.json();
    } catch (error) {
      console.error(`[MOCK ERROR] ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Инвалидация кэша (для force refresh)
   */
  clearCache() {
    // Можно добавить кэширование позже
  }
}

export const gasApi = new GASApi();
Файл: client-react/src/api/retentionApi.js

JavaScript

import { gasApi } from './gasApi';

/**
 * API для работы с Retention данными
 */
export const retentionApi = {
  /**
   * Получить полный отчёт Retention
   */
  async getReport() {
    return gasApi.call('api_getRetentionReport');
  },

  /**
   * Получить настройки UI
   */
  async getUISettings() {
    return gasApi.call('api_getUISettings');
  },

  /**
   * Получить список источников
   */
  async getSources() {
    return gasApi.call('api_getSources');
  }
};

1.3 Моки для разработки
Файл: client-react/public/mocks/api_getRetentionReport.json

JSON

{
  "project": "RETENZA",
  "reportTitle": "Retention Dashboard",
  "generatedAt": "2025-01-16T10:00:00.000Z",
  "periodsCount": 3,
  "periods": [
    {
      "key": "2024-11",
      "label": "Ноябрь 2024",
      "enabled": true,
      "hasFinance": true,
      "hasChannels": true,
      "cards": [
        {
          "id": "total_deposits_count",
          "title": "Тотал кол-во депозитов",
          "value": 1234,
          "diff": "+15.5%",
          "valueFormat": "integer",
          "icon": "💰",
          "category": "deposits",
          "order": 1
        },
        {
          "id": "total_deposits_amount",
          "title": "Тотал сумма депозитов",
          "value": 567890,
          "diff": "+12.3%",
          "valueFormat": "currency",
          "icon": "💳",
          "category": "deposits",
          "order": 2
        },
        {
          "id": "total_profit",
          "title": "Тотал профит",
          "value": 123456,
          "diff": "+8.9%",
          "valueFormat": "currency",
          "icon": "📈",
          "category": "profit",
          "order": 3
        },
        {
          "id": "ftd_amount",
          "title": "Сумма ФТД",
          "value": 234567,
          "diff": "+20.1%",
          "valueFormat": "currency",
          "icon": "🆕",
          "category": "deposits",
          "order": 4
        }
      ],
      "channelCards": {
        "push": {
          "name": "App Push",
          "icon": "📱",
          "cards": [
            {
              "id": "push_sent",
              "title": "Sent",
              "value": 50000,
              "diff": "+10%",
              "valueFormat": "integer",
              "disabled": false,
              "order": 1
            },
            {
              "id": "push_conversions",
              "title": "Conversions",
              "value": 2500,
              "diff": "+15%",
              "valueFormat": "integer",
              "disabled": false,
              "order": 2
            }
          ],
          "fullyDisabled": false
        },
        "mail": {
          "name": "E-mail",
          "icon": "📧",
          "cards": [
            {
              "id": "mail_sent",
              "title": "Sent",
              "value": 30000,
              "diff": "+5%",
              "valueFormat": "integer",
              "disabled": false,
              "order": 1
            }
          ],
          "fullyDisabled": false
        }
      },
      "totalChannels": {
        "sent": 80000,
        "conversions": 4000,
        "click": 12000
      }
    },
    {
      "key": "2024-12",
      "label": "Декабрь 2024",
      "enabled": true,
      "hasFinance": true,
      "hasChannels": true,
      "cards": [
        {
          "id": "total_deposits_count",
          "title": "Тотал кол-во депозитов",
          "value": 1456,
          "diff": "+18%",
          "valueFormat": "integer",
          "icon": "💰",
          "category": "deposits",
          "order": 1
        }
      ],
      "channelCards": {
        "push": {
          "name": "App Push",
          "icon": "📱",
          "cards": [
            {
              "id": "push_sent",
              "title": "Sent",
              "value": 55000,
              "diff": "+10%",
              "valueFormat": "integer",
              "disabled": false,
              "order": 1
            }
          ],
          "fullyDisabled": false
        }
      },
      "totalChannels": {
        "sent": 85000,
        "conversions": 4500,
        "click": 13000
      }
    },
    {
      "key": "2025-01",
      "label": "Январь 2025",
      "enabled": true,
      "hasFinance": true,
      "hasChannels": true,
      "cards": [
        {
          "id": "total_deposits_count",
          "title": "Тотал кол-во депозитов",
          "value": 1678,
          "diff": "+15.2%",
          "valueFormat": "integer",
          "icon": "💰",
          "category": "deposits",
          "order": 1
        }
      ],
      "channelCards": {
        "push": {
          "name": "App Push",
          "icon": "📱",
          "cards": [
            {
              "id": "push_sent",
              "title": "Sent",
              "value": 60000,
              "diff": "+9.1%",
              "valueFormat": "integer",
              "disabled": false,
              "order": 1
            }
          ],
          "fullyDisabled": false
        }
      },
      "totalChannels": {
        "sent": 90000,
        "conversions": 5000,
        "click": 14000
      }
    }
  ],
  "ui": {
    "financeTabs": {
      "deposits": "ДЕПОЗИТЫ",
      "sport": "СПОРТ",
      "casino": "КАЗИНО",
      "profit": "ПРОФИТ И БОНУСЫ"
    },
    "channelTabs": {
      "mail": "E-mail",
      "push": "App Push",
      "sms": "SMS"
    }
  },
  "localization": {
    "defaultLang": "RU",
    "showSwitcher": false
  },
  "baseMonths": {
    "finance": "2024-11",
    "channels": "2024-11"
  },
  "summary": {
    "totalDepositsCount": 4368,
    "totalDepositsAmount": 1500000,
    "totalProfit": 350000
  },
  "meta": {
    "version": "1.0.93.7"
  }
}
Файл: client-react/public/mocks/api_getUISettings.json

JSON

{
  "financeTabs": {
    "deposits": "ДЕПОЗИТЫ",
    "sport": "СПОРТ",
    "casino": "КАЗИНО",
    "profit": "ПРОФИТ И БОНУСЫ"
  },
  "channelTabs": {
    "mail": "E-mail",
    "push": "App Push",
    "webpush": "Web-Push",
    "sms": "SMS",
    "tg": "Telegram",
    "wa": "WhatsApp"
  },
  "showEmptyMetrics": false,
  "disabledLabel": "—",
  "autoCalcChannelTotals": true
}
📦 ЭТАП 2: State Management (1 день)
Файл: client-react/src/store/retentionStore.js

JavaScript

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { retentionApi } from '../api/retentionApi';

export const useRetentionStore = create(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════════
      // STATE
      // ═══════════════════════════════════════════════════════════════
      data: null,              // RetentionReport
      loading: false,
      error: null,
      selectedPeriod: null,    // "2025-01" или null

      // ═══════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════
      async fetchData() {
        set({ loading: true, error: null });
        
        try {
          const data = await retentionApi.getReport();
          
          set({ 
            data, 
            loading: false,
            // Выбираем последний период по умолчанию
            selectedPeriod: data.periods[data.periods.length - 1]?.key || null
          });
        } catch (error) {
          set({ 
            error: error.message, 
            loading: false 
          });
          console.error('[retentionStore] fetchData error:', error);
        }
      },

      setPeriod(periodKey) {
        set({ selectedPeriod: periodKey });
      },

      reset() {
        set({
          data: null,
          loading: false,
          error: null,
          selectedPeriod: null
        });
      },

      // ═══════════════════════════════════════════════════════════════
      // COMPUTED VALUES (getters)
      // ═══════════════════════════════════════════════════════════════
      get periods() {
        return get().data?.periods || [];
      },

      get currentPeriod() {
        const { data, selectedPeriod } = get();
        if (!data || !selectedPeriod) return null;
        return data.periods.find(p => p.key === selectedPeriod) || null;
      },

      get ui() {
        return get().data?.ui || { financeTabs: {}, channelTabs: {} };
      },

      get baseMonths() {
        return get().data?.baseMonths || { finance: null, channels: null };
      },

      get summary() {
        return get().data?.summary || {
          totalDepositsCount: 0,
          totalDepositsAmount: 0,
          totalProfit: 0
        };
      }
    }),
    {
      name: 'retention-store',
      // Сохраняем только выбранный период (не весь data!)
      partialize: (state) => ({
        selectedPeriod: state.selectedPeriod
      })
    }
  )
);
Файл: client-react/src/store/uiStore.js

JavaScript

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      // State
      sidebarOpen: true,
      activeTab: 'finance',    // 'finance' | 'channels'
      language: 'RU',          // 'RU' | 'EN'
      
      // Finance specific
      activeFinanceSection: 'deposits',  // 'deposits' | 'sport' | 'casino' | 'profit'
      
      // Channels specific
      activeChannel: 'push',             // 'mail' | 'push' | 'sms' | ...

      // Actions
      toggleSidebar() {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setActiveTab(tab) {
        set({ activeTab: tab });
      },

      setLanguage(lang) {
        set({ language: lang });
      },

      setActiveFinanceSection(section) {
        set({ activeFinanceSection: section });
      },

      setActiveChannel(channel) {
        set({ activeChannel: channel });
      }
    }),
    {
      name: 'ui-store'
    }
  )
);
📦 ЭТАП 3: Custom Hooks (1 день)
Файл: client-react/src/hooks/useRetentionData.js

JavaScript

import { useEffect } from 'react';
import { useRetentionStore } from '../store/retentionStore';

/**
 * Главный hook для работы с Retention данными
 * Автоматически загружает данные при монтировании
 */
export function useRetentionData() {
  const data = useRetentionStore((state) => state.data);
  const loading = useRetentionStore((state) => state.loading);
  const error = useRetentionStore((state) => state.error);
  const fetchData = useRetentionStore((state) => state.fetchData);

  useEffect(() => {
    // Загружаем только если данных ещё нет
    if (!data && !loading && !error) {
      fetchData();
    }
  }, [data, loading, error, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
Файл: client-react/src/hooks/usePeriodFilter.js

JavaScript

import { useRetentionStore } from '../store/retentionStore';

/**
 * Hook для работы с выбором периода
 */
export function usePeriodFilter() {
  const selectedPeriod = useRetentionStore((state) => state.selectedPeriod);
  const setPeriod = useRetentionStore((state) => state.setPeriod);
  const periods = useRetentionStore((state) => state.periods);
  const currentPeriod = useRetentionStore((state) => state.currentPeriod);

  return {
    selectedPeriod,
    setPeriod,
    periods,
    currentPeriodData: currentPeriod
  };
}
📦 ЭТАП 4: Shared Components (2 дня)
Card Component
Файл: client-react/src/components/shared/Card/Card.jsx

React

import styles from './Card.module.css';
import clsx from 'clsx';

export function Card({ children, title, className = '', ...props }) {
  return (
    <div className={clsx(styles.card, className)} {...props}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
Файл: client-react/src/components/shared/Card/Card.module.css

CSS

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

.content {
  /* Контент карточки */
}
MetricCard Component
Файл: client-react/src/components/shared/MetricCard/MetricCard.jsx

React

import styles from './MetricCard.module.css';
import clsx from 'clsx';
import { formatValue } from '../../../utils/formatters';

export function MetricCard({ metric }) {
  const { icon, title, value, diff, valueFormat, disabled } = metric;

  const diffClass = getDiffClass(diff);

  return (
    <div className={clsx(styles.metric, disabled && styles.disabled)}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.value}>
          {disabled ? '—' : formatValue(value, valueFormat)}
        </div>
        {diff && !disabled && (
          <div className={clsx(styles.diff, styles[diffClass])}>
            {diff}
          </div>
        )}
      </div>
    </div>
  );
}

function getDiffClass(diff) {
  if (!diff) return '';
  if (diff.startsWith('+')) return 'positive';
  if (diff.startsWith('-')) return 'negative';
  return 'neutral';
}
Файл: client-react/src/components/shared/MetricCard/MetricCard.module.css

CSS

.metric {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.metric:hover {
  background: #e9ecef;
  transform: scale(1.02);
}

.metric.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
  line-height: 1.2;
}

.diff {
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.diff.positive {
  color: #28a745;
}

.diff.positive::before {
  content: '↑';
}

.diff.negative {
  color: #dc3545;
}

.diff.negative::before {
  content: '↓';
}

.diff.neutral {
  color: #6c757d;
}
Loader Component
Файл: client-react/src/components/shared/Loader/Loader.jsx

React

import styles from './Loader.module.css';

export function Loader({ message = 'Загрузка...' }) {
  return (
    <div className={styles.loader}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
Файл: client-react/src/components/shared/Loader/Loader.module.css

CSS

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.message {
  font-size: 16px;
  color: #6c757d;
  font-weight: 500;
}
📦 ЭТАП 5: Utility Functions (1 день)
Файл: client-react/src/utils/formatters.js

JavaScript

/**
 * Форматирование значений метрик
 */

export function formatValue(value, format) {
  if (value === null || value === undefined) return '—';

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'integer':
      return formatInteger(value);
    case 'decimal':
      return formatDecimal(value);
    default:
      return String(value);
  }
}

/**
 * Форматирование валюты
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Форматирование процентов
 */
export function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

/**
 * Форматирование целых чисел
 */
export function formatInteger(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

/**
 * Форматирование дробных чисел
 */
export function formatDecimal(value, decimals = 2) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Форматирование дат
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Сокращение больших чисел (1000 → 1K, 1000000 → 1M)
 */
export function abbreviateNumber(value) {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}
Файл: client-react/src/utils/constants.js

JavaScript

/**
 * Константы приложения
 */

// KPI метрики для Finance
export const FINANCE_KPI_METRIC_IDS = [
  'total_deposits_count',
  'total_deposits_amount',
  'total_profit',
  'ftd_amount'
];

// KPI метрики для Channels
export const CHANNEL_KPI_METRIC_IDS = [
  'total_contacts',
  'total_conversions',
  'total_conversion_rate'
];

// Цвета для графиков
export const CHART_COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40'
};

// Форматы метрик
export const METRIC_FORMATS = {
  CURRENCY: 'currency',
  PERCENT: 'percent',
  INTEGER: 'integer',
  DECIMAL: 'decimal'
};
📦 ЭТАП 6: Finance Dashboard (3 дня)
Файл: client-react/src/components/finance/FinanceDashboard.jsx

React

import { usePeriodFilter } from '../../hooks/usePeriodFilter';
import { FinanceKPI } from './FinanceKPI';
import { FinanceTable } from './FinanceTable';
import { FinanceChart } from './FinanceChart';
import styles from './FinanceDashboard.module.css';

export function FinanceDashboard() {
  const { currentPeriodData } = usePeriodFilter();

  if (!currentPeriodData) {
    return (
      <div className={styles.empty}>
        <p>Выберите период для отображения данных</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <FinanceKPI period={currentPeriodData} />
      <FinanceChart period={currentPeriodData} />
      <FinanceTable period={currentPeriodData} />
    </div>
  );
}
Файл: client-react/src/components/finance/FinanceKPI.jsx

React

import { Card } from '../shared/Card/Card';
import { MetricCard } from '../shared/MetricCard/MetricCard';
import { FINANCE_KPI_METRIC_IDS } from '../../utils/constants';
import styles from './FinanceKPI.module.css';

export function FinanceKPI({ period }) {
  // Фильтруем KPI метрики
  const kpiMetrics = period.cards
    .filter(c => FINANCE_KPI_METRIC_IDS.includes(c.id))
    .sort((a, b) => a.order - b.order);

  return (
    <Card title="Ключевые показатели">
      <div className={styles.grid}>
        {kpiMetrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </Card>
  );
}
Файл: client-react/src/components/finance/FinanceKPI.module.css

CSS

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
Файл: client-react/src/components/finance/FinanceTable.jsx

React

import { useState } from 'react';
import { Card } from '../shared/Card/Card';
import { useRetentionStore } from '../../store/retentionStore';
import { formatValue } from '../../utils/formatters';
import clsx from 'clsx';
import styles from './FinanceTable.module.css';

export function FinanceTable({ period }) {
  const financeTabs = useRetentionStore((state) => state.ui.financeTabs);
  
  // Берём первую секцию по умолчанию
  const defaultSection = Object.keys(financeTabs)[0] || 'deposits';
  const [activeSection, setActiveSection] = useState(defaultSection);

  // Фильтруем метрики по выбранной секции
  const sectionMetrics = period.cards.filter(c => c.category === activeSection);

  return (
    <Card title="Детальная статистика">
      {/* Табы секций */}
      <div className={styles.tabs}>
        {Object.entries(financeTabs).map(([key, label]) => (
          <button
            key={key}
            className={clsx(styles.tab, activeSection === key && styles.active)}
            onClick={() => setActiveSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Таблица метрик */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Метрика</th>
              <th>Значение</th>
              <th>Изменение</th>
            </tr>
          </thead>
          <tbody>
            {sectionMetrics.map(metric => (
              <tr 
                key={metric.id} 
                className={metric.disabled ? styles.disabled : ''}
              >
                <td>
                  <span className={styles.icon}>{metric.icon}</span>
                  <span className={styles.metricTitle}>{metric.title}</span>
                </td>
                <td className={styles.value}>
                  {formatValue(metric.value, metric.valueFormat)}
                </td>
                <td className={getDiffClassName(metric.diff)}>
                  {metric.diff || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function getDiffClassName(diff) {
  const baseClass = styles.diff;
  if (!diff) return baseClass;
  if (diff.startsWith('+')) return `${baseClass} ${styles.positive}`;
  if (diff.startsWith('-')) return `${baseClass} ${styles.negative}`;
  return baseClass;
}
Файл: client-react/src/components/finance/FinanceTable.module.css

CSS

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
  overflow-x: auto;
}

.tab {
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.tab:hover {
  color: #667eea;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tableWrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #6c757d;
  border-bottom: 2px solid #f0f0f0;
}

.table tbody td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.table tbody tr.disabled {
  opacity: 0.5;
}

.icon {
  margin-right: 8px;
  font-size: 18px;
}

.metricTitle {
  font-weight: 500;
  color: #2c3e50;
}

.value {
  font-weight: 700;
  color: #2c3e50;
  text-align: right;
}

.diff {
  text-align: right;
  font-weight: 600;
  font-size: 14px;
}

.diff.positive {
  color: #28a745;
}

.diff.negative {
  color: #dc3545;
}

Файл: client-react/src/components/finance/FinanceChart.jsx

React

import { useState } from 'react';
import { Card } from '../shared/Card/Card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useRetentionStore } from '../../store/retentionStore';
import { formatCurrency, formatInteger } from '../../utils/formatters';
import styles from './FinanceChart.module.css';

export function FinanceChart() {
  const periods = useRetentionStore((state) => state.periods);
  const [selectedMetric, setSelectedMetric] = useState('total_deposits_amount');

  // Метрики для выбора
  const metrics = [
    { id: 'total_deposits_amount', label: 'Сумма депозитов', format: 'currency' },
    { id: 'total_profit', label: 'Профит', format: 'currency' },
    { id: 'total_deposits_count', label: 'Количество депозитов', format: 'integer' },
    { id: 'sport_stake_amount', label: 'Спорт (ставки)', format: 'currency' },
    { id: 'casino_stake_amount', label: 'Казино (ставки)', format: 'currency' }
  ];

  const selectedMetricConfig = metrics.find(m => m.id === selectedMetric);

  // Подготовка данных для графика
  const chartData = periods.map(period => {
    const metric = period.cards.find(c => c.id === selectedMetric);
    return {
      name: period.label,
      value: metric?.value || 0
    };
  });

  // Форматтер для tooltip
  const tooltipFormatter = (value) => {
    if (!selectedMetricConfig) return value;
    
    if (selectedMetricConfig.format === 'currency') {
      return formatCurrency(value);
    }
    if (selectedMetricConfig.format === 'integer') {
      return formatInteger(value);
    }
    return value;
  };

  return (
    <Card title="Динамика показателей">
      {/* Выбор метрики */}
      <div className={styles.controls}>
        <select 
          className={styles.select}
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
        >
          {metrics.map(metric => (
            <option key={metric.id} value={metric.id}>
              {metric.label}
            </option>
          ))}
        </select>
      </div>

      {/* График */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6c757d"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6c757d"
            style={{ fontSize: '12px' }}
            tickFormatter={tooltipFormatter}
          />
          <Tooltip 
            formatter={tooltipFormatter}
            contentStyle={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#667eea" 
            strokeWidth={3}
            dot={{ fill: '#667eea', r: 5 }}
            activeDot={{ r: 7 }}
            name={selectedMetricConfig?.label || 'Значение'}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
Файл: client-react/src/components/finance/FinanceChart.module.css

CSS

.controls {
  margin-bottom: 24px;
}

.select {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  font-size: 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.select:hover {
  border-color: #667eea;
}

.select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
📦 ЭТАП 7: App Shell & Routing (1 день)
Файл: client-react/src/components/shared/Sidebar/Sidebar.jsx

React

import { Link, useLocation } from 'react-router-dom';
import { usePeriodFilter } from '../../../hooks/usePeriodFilter';
import clsx from 'clsx';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const location = useLocation();
  const { periods, selectedPeriod, setPeriod } = usePeriodFilter();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>📊</span>
        <span className={styles.logoText}>Retention</span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <Link 
          to="/finance" 
          className={clsx(styles.navItem, isActive('/finance') && styles.active)}
        >
          💰 Finance
        </Link>
        <Link 
          to="/channels" 
          className={clsx(styles.navItem, isActive('/channels') && styles.active)}
        >
          📈 Channels
        </Link>
      </nav>

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        <div className={styles.selectorTitle}>Период</div>
        <div className={styles.periodList}>
          {periods.map(period => (
            <button
              key={period.key}
              className={clsx(
                styles.periodItem,
                selectedPeriod === period.key && styles.selected
              )}
              onClick={() => setPeriod(period.key)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

Файл: client-react/src/components/shared/Sidebar/Sidebar.module.css

CSS

.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  position: sticky;
  top: 0;
}

.logo {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logoIcon {
  font-size: 32px;
}

.logoText {
  font-size: 24px;
  font-weight: 700;
}

.nav {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navItem {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.navItem:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.navItem.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.periodSelector {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.selectorTitle {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  opacity: 0.8;
}

.periodList {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.periodItem {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.periodItem:hover {
  background: rgba(255, 255, 255, 0.15);
}

.periodItem.selected {
  background: rgba(255, 255, 255, 0.25);
  font-weight: 600;
}

Файл: client-react/src/App.jsx

React

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/shared/Sidebar/Sidebar';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { ChannelsDashboard } from './components/channels/ChannelsDashboard';
import { Loader } from './components/shared/Loader/Loader';
import { useRetentionData } from './hooks/useRetentionData';
import styles from './App.module.css';

export default function App() {
  const { loading, error } = useRetentionData();

  if (loading) {
    return <Loader message="Загрузка данных..." />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>❌ Ошибка загрузки</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Sidebar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/finance" replace />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/channels" element={<ChannelsDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
Файл: client-react/src/App.module.css

CSS

.app {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  text-align: center;
}

.error h2 {
  color: #dc3545;
  margin-bottom: 16px;
}

.error p {
  color: #6c757d;
  max-width: 600px;
}
Файл: client-react/src/main.jsx

React

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
Файл: client-react/src/index.css

CSS

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
    'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: 'Fira Code', 'Courier New', monospace;
}

#root {
  min-height: 100vh;
}

/* Scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
📦 ЭТАП 8: Production Build & Deploy (1 день)
Build Process
Обновление vite.config.js:

JavaScript

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // Инлайн все ассеты в один файл
  ],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000, // Очень большой лимит = всё inline
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true // Убираем console.log в production
      }
    }
  }
});
Deploy Script
Создать deploy.sh в корне проекта:

Bash

#!/bin/bash

set -e

echo "🚀 Starting deployment process..."

# 1. Build React app
echo "📦 Building React app..."
cd client-react
npm run build

# 2. Copy dist/index.html to Apps Script
echo "📋 Copying build to Apps Script..."
cp dist/index.html ../apps-script/src/index.html

# 3. Deploy to Apps Script
echo "☁️ Deploying to Google Apps Script..."
cd ../apps-script
clasp push

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Open Google Apps Script editor: clasp open"
echo "2. Run 'showReactDashboard' from menu"
Сделать скрипт исполняемым:

Bash

chmod +x deploy.sh
Использование:
Bash

# Development
cd client-react
npm run dev           # → http://localhost:5173

# Production deployment
./deploy.sh           # → Build + Deploy

# Manual testing
cd apps-script
clasp open            # → Открыть в браузере
10. ИНСТРУКЦИИ ДЛЯ ПРОДОЛЖЕНИЯ
10.1 Чек-лист выполнения
Этап	Готово	Комментарий
0. Setup	☐	Создана структура, установлены зависимости
1. API Layer	☐	Endpoints работают, моки загружаются
2. State Management	☐	Zustand store возвращает данные
3. Hooks	☐	useRetentionData() загружает данные
4. Shared Components	☐	Card/MetricCard отображаются
5. Finance Dashboard	☐	Таблица/KPI/График работают
6. Channels Dashboard	☐	(опционально, аналогично Finance)
7. Routing	☐	Навигация Finance ↔ Channels
8. Production	☐	Build → clasp push → работает
10.2 Тестирование на каждом этапе
Этап 1 (API):

JavaScript

// В Apps Script консоли
function testAPI() {
  const result = api_getRetentionReport();
  console.log(JSON.stringify(result, null, 2));
}
Этап 2 (Store):

JavaScript

// В React Dev Tools Console
useRetentionStore.getState().fetchData();
useRetentionStore.getState().data; // Должно быть заполнено
Этап 3 (Hooks):

React

// В любом компоненте
const { data } = useRetentionData();
console.log('Periods:', data?.periods.length);
Этап 4-7 (UI):

Bash

# Dev режим
npm run dev
# Открыть http://localhost:5173
# Проверить:
# - Загрузка данных
# - Переключение периодов
# - Навигация Finance/Channels
Этап 8 (Production):

Bash

./deploy.sh
# Потом в Google Sheets:
# Меню → Генератор Отчетов → 📊 Retention v2.0
10.3 Решение проблем
Проблема	Решение
google.script.run is not defined	Используй dev mode с моками (VITE_MOCK_API=true)
Ошибка CORS в dev	Добавь proxy в vite.config.js
Компоненты не обновляются	Проверь зависимости в useEffect
Стили не применяются	Проверь импорт CSS modules
Build файл слишком большой	Убедись что viteSingleFile работает
clasp push ошибка	Проверь .clasp.json, выполни clasp login

10.4 Продолжение без AI
Если диалог прервётся:

Этап 0-2 — Критичны, выполни полностью
Этап 3-4 — Скопируй код из примеров выше
Этап 5 — Finance Dashboard самый важный
Этап 6 — Channels Dashboard — копия Finance (поменяй только данные)
Этап 7-8 — Финальная сборка
Важные файлы для сохранения:

text

📁 retention-dashboard-v2/
  📁 client-react/
    📁 src/
      📁 api/
        📄 gasApi.js          ← ключевой файл
        📄 retentionApi.js
      📁 store/
        📄 retentionStore.js  ← ключевой файл
      📁 components/
        📁 finance/
          📄 FinanceDashboard.jsx ← начни отсюда
  📁 apps-script/
    📁 src/
      📁 api/
        📄 RetentionAPI.js    ← ключевой файл
10.5 Полезные ссылки
Zustand Docs
Recharts Examples
React Router Tutorial
Vite Plugin Singlefile
Google Apps Script Docs
🎯 РЕЗЮМЕ
Что получим после миграции:
✅ Быстрый — загрузка в 3-4 секунды вместо 15
✅ Масштабируемый — легко добавлять новые дашборды
✅ Поддерживаемый — React компоненты + TypeScript (опционально)
✅ Современный — актуальный стек технологий
✅ Тестируемый — можно покрыть тестами

Риски и митигация:
Риск	Вероятность	Митигация
Проблемы с clasp	Средняя	Fallback на ручной copy-paste
Большой размер build	Низкая	viteSingleFile + terser
Несовместимость браузеров	Низкая	Vite автоматически делает polyfills
Потеря функционала	Низкая	Поэтапная миграция, старая версия остаётся
Удачи с миграцией! 🚀

Если возникнут вопросы — этот план содержит 90% ответов. Остальные 10% — гуглить по ссылкам выше.ёёёёёёёёёёёёёёёёёёёёёё