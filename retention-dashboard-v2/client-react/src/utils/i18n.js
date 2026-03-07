/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  i18n.js - Простая система локализации для React
 * ═══════════════════════════════════════════════════════════════════════════
 */

const translations = {
  RU: {
    // Общие
    'loading': 'Загрузка...',
    'no_data': 'Нет данных',
    'error': 'Ошибка',

    // Finance Dashboard
    'finance_dashboard_title': '💰 Главный Дашборд',
    'detailed_metrics': '📋 Детальные метрики',
    'month_comparison': 'Сравнение по месяцам',
    'total_bets': 'Всего ставок',

    // Channels Dashboard
    'channels_dashboard_title': '📈 Дашборд Каналов',
    'overall_channels_kpi': 'Основные KPI по каналам',
    'total_contacts': 'Всего контактов',
    'total_conversions': 'Всего конверсий',
    'conversion_rate': 'Конверсия',
    'total_clicks': 'Всего кликов',
    'conversions_by_channel': 'Конверсии по каналам',
    'sent_dynamics': 'Динамика отправок',

    // Table headers
    'metric': 'Метрика',
    'total_deposits_count': 'Всего депозитов',
    'total_deposits_amount': 'Сумма депозитов',
    'show_all': 'Показать все'
  },
  EN: {
    // Common
    'loading': 'Loading...',
    'no_data': 'No data',
    'error': 'Error',

    // Finance Dashboard
    'finance_dashboard_title': '💰 Main Dashboard',
    'detailed_metrics': '📋 Detailed Metrics',
    'month_comparison': 'Month comparison',
    'total_bets': 'Total Bets',

    // Channels Dashboard
    'channels_dashboard_title': '📈 Channels Dashboard',
    'overall_channels_kpi': 'Overall Channels KPI',
    'total_contacts': 'Total Contacts',
    'total_conversions': 'Total Conversions',
    'conversion_rate': 'Conversion Rate',
    'total_clicks': 'Total Clicks',
    'conversions_by_channel': 'Conversions by Channel',
    'sent_dynamics': 'Sent Dynamics',

    // Table headers
    'metric': 'Metric',
    'total_deposits_count': 'Total Deposits Count',
    'total_deposits_amount': 'Total Deposits Amount',
    'show_all': 'Show All'
  }
};

let currentLanguage = 'RU';

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
  }
};

export const getLanguage = () => currentLanguage;

export const t = (key, fallback = key) => {
  return translations[currentLanguage]?.[key] || fallback;
};

// React hook for using translations
export const useTranslation = () => {
  const translate = (key, fallback) => t(key, fallback);
  const changeLanguage = (lang) => setLanguage(lang);

  return {
    t: translate,
    language: currentLanguage,
    setLanguage: changeLanguage
  };
};
