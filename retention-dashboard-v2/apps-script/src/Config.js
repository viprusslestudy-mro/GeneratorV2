/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CONFIG.gs - Конфигурация мульти-источникового генератора отчетов v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CONFIG = {
  VERSION: '1.0.93.7',
  DEBUG: false,

  // ID таблицы с настройками (текущая таблица со скриптом)
  SETTINGS_SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId()
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    МАСТЕР-ТАБЛИЦА SETTINGS                                ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Ключ для хранения ID мастер-таблицы Settings в Script Properties
 */
const MASTER_SETTINGS_PROPERTY_KEY = 'MASTER_SETTINGS_SPREADSHEET_ID';

/**
 * ID мастер-таблицы Settings по умолчанию
 */
const DEFAULT_MASTER_SETTINGS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/**
 * Получить ID мастер-таблицы Settings из Script Properties
 * @returns {string} ID таблицы (дефолтный если не настроено)
 */
function getMasterSettingsSpreadsheetId() {
  try {
    const props = PropertiesService.getScriptProperties();
    const masterId = props.getProperty(MASTER_SETTINGS_PROPERTY_KEY);

    // Если не настроено, используем ID активной таблицы
    if (!masterId || masterId.trim() === '') {
      return SpreadsheetApp.getActiveSpreadsheet().getId();
    }

    return masterId.trim();
  } catch (e) {
    Logger.log('[getMasterSettingsSpreadsheetId] Error: ' + e.message + ', using default');
    return DEFAULT_MASTER_SETTINGS_ID;
  }
}

/**
 * Установить ID мастер-таблицы Settings
 * @param {string|null} spreadsheetId - ID таблицы или null для сброса к дефолтному
 */
function setMasterSettingsSpreadsheetId(spreadsheetId) {
  try {
    const props = PropertiesService.getScriptProperties();

    if (spreadsheetId === null || spreadsheetId === undefined || String(spreadsheetId).trim() === '') {
      props.deleteProperty(MASTER_SETTINGS_PROPERTY_KEY);
      Logger.log('[setMasterSettingsSpreadsheetId] Reset to default master Settings');
    } else {
      props.setProperty(MASTER_SETTINGS_PROPERTY_KEY, String(spreadsheetId).trim());
      Logger.log('[setMasterSettingsSpreadsheetId] Master Settings set to: ' + spreadsheetId);
    }
  } catch (e) {
    Logger.log('[setMasterSettingsSpreadsheetId] Error: ' + e.message);
    throw e;
  }
}

/**
 * Получить мастер-таблицу Settings
 * Всегда использует мастер-таблицу (без fallback на локальную)
 * 
 * @returns {Spreadsheet} Объект мастер-таблицы с Settings
 */
function getSettingsSpreadsheet() {
  const masterId = getMasterSettingsSpreadsheetId();

  try {
    const masterSs = SpreadsheetApp.openById(masterId);

    // Проверяем наличие любого из новых листов (например, Источники)
    const sourcesSheet = masterSs.getSheetByName(SHEETS.SOURCES);
    if (!sourcesSheet) {
      throw new Error(`Master Settings sheet "${SHEETS.SOURCES}" not found in spreadsheet "${masterSs.getName()}"`);
    }

    return masterSs;

  } catch (e) {
    const errorMsg = 'Cannot access master Settings spreadsheet (ID: ' + masterId + '): ' + e.message;
    Logger.log('[getSettingsSpreadsheet] ERROR: ' + errorMsg);
    throw new Error(errorMsg + '\n\nPlease check:\n• Master Settings ID is correct\n• You have access to the spreadsheet\n• Settings sheet exists');
  }
}


// ═══ НАСТРОЙКИ ОТОБРАЖЕНИЯ ═══
const DISPLAY_SETTINGS = {
  SHOW_ALL_TIME_PERIOD: false  // true = показывать "Все время", false = скрыть
};

/**
 * Получить настройку "Показывать период Все время"
 * Можно переопределить в листе Settings
 */
function getShowAllTimePeriod() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName(SHEETS.SETTINGS);

    if (settingsSheet) {
      // Ищем ячейку с настройкой (например, в колонке с заголовком "Показывать Все время")
      const data = settingsSheet.getDataRange().getValues();

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cell = String(data[i][j]).toLowerCase();
          if (cell.includes('все время') || cell.includes('all time')) {
            // Проверяем значение в соседней ячейке или чекбокс
            const valueCell = data[i][j + 1];
            if (valueCell === true || valueCell === false) {
              return valueCell;
            }
            if (String(valueCell).toLowerCase() === 'да' || String(valueCell).toLowerCase() === 'yes') {
              return true;
            }
            if (String(valueCell).toLowerCase() === 'нет' || String(valueCell).toLowerCase() === 'no') {
              return false;
            }
          }
        }
      }
    }
  } catch (e) {
    // Если ошибка — используем дефолт
  }

  return DISPLAY_SETTINGS.SHOW_ALL_TIME_PERIOD;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                         ЛИСТЫ НАСТРОЕК                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const SHEETS = {
  SOURCES: '📊 ИСТОЧНИКИ ДАННЫХ',
  RETENTION: '📊 RETENTION',
  FINANCE_METRICS: '💰 FINANCE METRICS',
  CHANNEL_METRICS: '📣 CHANNEL METRICS',
  SUPPORT: '🎧 SUPPORT',
  APP_SETTINGS: '⚙️ APP_SETTINGS',
  LOGS: 'Логи'
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                СТРУКТУРА МАСТЕР-ТАБЛИЦЫ Settings v3.0                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * СТРУКТУРА ЛИСТА "📊 ИСТОЧНИКИ ДАННЫХ":
 * | A (Источник) | B (ID таблицы) | C (Листы) | D (Иконка) | E (Цвет) | F (Вкл) | G (Тип) |
 */
const SOURCES_SECTION = {
  HEADER_ROW: 2,
  DATA_START_ROW: 3,
  COLUMNS: {
    NAME: 0,          // A: Название источника
    SPREADSHEET_ID: 1, // B: ID Google таблицы
    SHEETS_LIST: 2,   // C: Список листов через запятую
    ICON: 3,          // D: Иконка эмодзи
    COLOR: 4,         // E: Цвет HEX
    ENABLED: 5        // F: Чекбокс включен
  }
};

/**
 * СТРУКТУРА ЛИСТОВ "📊 RETENTION" и "🎧 SUPPORT":
 * | A (Месяц) | B (Год) | C (Ключ YYYY-MM) | D (Источник 1) | ... |
 */
const MONTHS_SECTION = {
  HEADER_ROW: 2,
  DATA_START_ROW: 3,
  COLUMNS: {
    MONTH_NAME: 0,    // A: Название месяца
    YEAR: 1,          // B: Год
    KEY: 2,           // C: Ключ YYYY-MM
    ENABLED: 3        // D: Включить месяц
  }
};

// ═══ КОНФИГУРАЦИЯ ШАБЛОНОВ (Роли листов) ═══
const TEMPLATE_CONFIG = {
  Retention: [
    { id: 'finance', label: 'Finance Tab', pattern: 'Product Stat' },
    { id: 'channels', label: 'Channels Tab', pattern: 'Комуникации TOTAL' }
  ],
  Support: [
    { id: 'livechat', label: 'LiveChat Tab', pattern: 'LiveChat - KPI' },
    { id: 'tags', label: 'Tags Tab', pattern: 'Tags Statistic' },
    { id: 'helpdesk', label: 'HelpDesk Tab', pattern: 'HelpDesk STATS' }
  ]
};

// ═══ ДЕФОЛТНЫЕ ИСТОЧНИКИ ═══
const DEFAULT_SOURCES = {
  RETENTION: {
    name: 'Retention',
    template: 'Retention',
    spreadsheetId: '1e-Z4_bvD9v8Ki7nXfUfDA5hO-m-tN0n_Ps9EJpGPQKQ',
    sheets: ['Product Stat', 'Комуникации TOTAL'],
    icon: '📊',
    color: '#9c27b0',
    reports: [
      { id: 'finance', label: '💰 Финансовый дашборд', default: true },
      { id: 'channels', label: '📈 Каналы маркетинга' }
    ]
  },
  SUPPORT: {
    name: 'Support',
    template: 'Support',
    spreadsheetId: '12yYxA10pZZe7_2BNGjplkvOAS6D_PsUnMy7m1ygny3Y',
    sheets: [],  // Будет определено анализатором
    icon: '🎧',
    color: '#2196f3',
    reports: [
      { id: 'stats', label: '📋 Основная статистика', default: true },
      { id: 'tags', label: '🏷️ Теги' }
    ]
  }
};

// Список месяцев
const MONTH_NAMES_LIST = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Маппинг месяцев
const MONTH_NAME_TO_NUMBER = {
  'январь': 1, 'февраль': 2, 'март': 3, 'апрель': 4, 'май': 5, 'июнь': 6,
  'июль': 7, 'август': 8, 'сентябрь': 9, 'октябрь': 10, 'ноябрь': 11, 'декабрь': 12
};

/**
 * Список годов для выпадающего списка
 */
function getYearsList() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    years.push(String(y));
  }
  return years;
}

/**
 * Текст для выключенных метрик в дашборде
 * Можно переопределить в листе ⚙️ APP_SETTINGS
 * Варианты: '—', 'ВЫКЛ', 'N/A', '-', '∅'
 */
var DISABLED_METRIC_LABEL = '—';

function getDisabledMetricLabel() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 0; i < data.length; i++) {
        var key = String(data[i][0] || '').trim().toLowerCase();
        if (key === 'disabled_metric_label' || key === 'лейбл выключенной метрики') {
          var val = String(data[i][1] || '').trim();
          if (val) return val;
        }
      }
    }
  } catch (e) { }
  return DISABLED_METRIC_LABEL;
}

/**
 * Показывать метрики с нулевыми/пустыми данными
 * Можно переопределить в листе ⚙️ APP_SETTINGS
 * Значения: ON/OFF, TRUE/FALSE, ДА/НЕТ
 * @returns {boolean} true = показывать, false = скрывать
 */
function getShowEmptyMetrics() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 0; i < data.length; i++) {
        var key = String(data[i][0] || '').trim().toLowerCase();
        if (key === 'show_empty_metrics' || key === 'показывать пустые метрики') {
          var val = String(data[i][1] || '').trim().toUpperCase();
          if (val === 'ON' || val === 'TRUE' || val === 'ДА' || val === 'YES' || val === '1') {
            return true;
          }
          return false;
        }
      }
    }
  } catch (e) { }
  return false; // По умолчанию скрываем пустые метрики
}

/**
 * Получить список секций для Growth Sidebar Finance
 * Читает из ⚙️ APP_SETTINGS строку "Growth Sidebar Finance"
 * Формат значения: "ДЕПОЗИТЫ, КАЗИНО, Профит и Бонусы" (через запятую)
 * 
 * @returns {Array|null} массив названий секций или null (показывать все)
 */
function getGrowthSidebarFinanceSections() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'growth sidebar finance' || key === 'growth_sidebar_finance' || key === 'секции growth sidebar') {
        var val = String(data[i][1] || '').trim();
        if (!val) return null; // Пустое значение = показывать все
        
        // ✅ Убираем кавычки если есть
        val = val.replace(/^["']|["']$/g, '');
        
        // ✅ Заменяем переносы строк на запятые
        val = val.replace(/[\r\n]+/g, ',');
        
        // ✅ Парсим список через запятую
        var sections = val.split(',').map(function(s) {
          // Убираем пробелы, табы, переносы
          return s.replace(/[\r\n\t]/g, '').trim();
        }).filter(function(s) {
          return s.length > 0;
        });
        
        Logger.log('[getGrowthSidebarFinanceSections] Raw value: "' + val + '"');
        Logger.log('[getGrowthSidebarFinanceSections] Parsed: ' + JSON.stringify(sections));
        
        return sections.length > 0 ? sections : null;
      }
    }
  } catch (e) {
    Logger.log('[getGrowthSidebarFinanceSections] Error: ' + e.message);
  }
  return null; // Не найдено = показывать все
}

/**
 * Получить список каналов для Growth Sidebar Channels
 * Читает из ⚙️ APP_SETTINGS строку "Growth Sidebar Channels"
 * 
 * @returns {Array|null} массив названий каналов или null (показывать все)
 */
function getGrowthSidebarChannelsList() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0] || '').trim().toLowerCase();
      if (key === 'growth sidebar channels' || key === 'growth_sidebar_channels' || key === 'каналы growth sidebar') {
        var val = String(data[i][1] || '').trim();
        if (!val) return null;
        
        // Убираем кавычки и переносы
        val = val.replace(/^["']|["']$/g, '');
        val = val.replace(/[\r\n]+/g, ',');
        
        var channels = val.split(',').map(function(s) {
          return s.replace(/[\r\n\t]/g, '').trim();
        }).filter(function(s) {
          return s.length > 0;
        });
        
        Logger.log('[getGrowthSidebarChannelsList] Raw: "' + val + '"');
        Logger.log('[getGrowthSidebarChannelsList] Parsed: ' + JSON.stringify(channels));
        return channels.length > 0 ? channels : null;
      }
    }
  } catch (e) {
    Logger.log('[getGrowthSidebarChannelsList] Error: ' + e.message);
  }
  return null;
}

/**
 * Получить конфигурацию локализации
 * Вызывается один раз при генерации отчёта
 */
function getLocalizationSettings() {
  return {
    defaultLang: getDefaultLanguage(),
    showSwitcher: getShowLanguageSwitcher(),
    translations: loadTranslations()
  };
}

/**
 * Автовычисление Total KPI если нет данных в "Total вверху"
 * Читает из ⚙️ APP_SETTINGS строку "auto_calc_channel_totals"
 * @returns {boolean} true = включено, false = выключено
 */
function getAutoCalcChannelTotals() {
  try {
    var ss = getSettingsSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 0; i < data.length; i++) {
        var key = String(data[i][0] || '').trim().toLowerCase();
        if (key === 'auto_calc_channel_totals' || key === 'автовычисление total kpi') {
          var val = String(data[i][1] || '').trim().toUpperCase();
          if (val === 'ON' || val === 'TRUE' || val === 'ДА' || val === 'YES' || val === '1') {
            return true;
          }
          return false;
        }
      }
    }
  } catch (e) {
    Logger.log('[getAutoCalcChannelTotals] Error: ' + e.message);
  }
  return true; // По умолчанию включено
}

/**
 * Настроить лист переводов с базовыми переводами
 * Вызывается один раз для инициализации 🌐 TRANSLATIONS
 */
function setupTranslations() {
  var ss = getSettingsSpreadsheet();
  var sheet = ss.getSheetByName(TRANSLATIONS_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(TRANSLATIONS_SHEET_NAME);
  } else {
    sheet.clear();
  }
  
  var data = [
    ['key', 'RU', 'EN'],
    
    // ═══ ТАБЫ ═══
    ['tab.finance', '💰 Главный Дашборд', '💰 Main Dashboard'],
    ['tab.channels', '📈 Каналы коммуникации', '📈 Communication channels'],
    ['tab.support_stats', '📊 Статистика LiveChat', '📊 LiveChat Statistics'],
    ['tab.support_tags', '🏷️ Теги обращений', '🏷️ Issue Tags'],
    
    // ═══ НАВИГАЦИЯ ═══
    ['label.navigation', 'Навигация', 'Navigation'],
    ['label.channel_selection', '✨ Выбор канала', '✨ Channel selection'],
    ['label.show_all', '✨ ОТОБРАЗИТЬ ВСЕ', '✨ SHOW ALL'],
    ['label.period', 'Отчетный период', 'Reporting period'],
    ['label.all_time', 'За все время', 'All time'],
    ['label.first_month', 'Первый месяц', 'First month'],
    
    // ═══ ОБЩИЕ ЛЕЙБЛЫ ═══
    ['label.metric', 'Метрика', 'Metrics'],
    ['label.detail_chart', '— динамический график', '— dynamic report'],
    ['label.percent_change', 'Процент изменений по месяцам', 'Percentage change by month'],
    ['label.by_month', 'Сравнение по месяцам', 'Compared by month'],
    ['label.by_channel', 'По каналам', 'By channel'],
    ['label.bet_sum', 'Сумма ставок', 'Bet sum'],
    
    // ═══ KPI FINANCE ═══
    ['kpi.deposits_count', 'Депозиты (Кол-во)', 'Deposit (Count)'],
    ['kpi.deposits_sum', 'Депозиты (Сумма)', 'Deposit (Sum)'],
    ['kpi.profit_sum', 'Профит (Сумма)', 'Profit (Sum)'],
    ['kpi.ftd_sum', 'ФТД (Сумма)', 'FTD (Sum)'],
    
    // ═══ KPI CHANNELS ═══
    ['kpi.total_contacts', 'Тотал касаний', 'Total Contacts'],
    ['kpi.total_conversions', 'Тотал конверсий', 'Total Conversions'],
    ['kpi.total_conversion_rate', 'Тотал конверсий к касаниям (%)', 'Total Conversion Rate'],
    ['kpi.total_clicks', 'Тотал клики', 'Total Clicks'],
    
    // ═══ ГРАФИКИ FINANCE ═══
    ['chart.all_metrics', 'Все метрики — динамический график', 'All metrics - dynamic report'],
    ['chart.deposits_detail', 'Сумма депозитов — динамический график', 'Deposit sum - dynamic report'],
    ['chart.profit_detail', 'Сумма профита — динамический график', 'Profit sum - dynamic report'],
    ['chart.casino_detail', 'Сумма ставок казино — динамический график', 'Casino bet sum - dynamic report'],
    ['chart.sport_detail', 'Сумма ставок спорт — динамический график', 'Sport bet sum - dynamic report'],
    ['chart.deposit_count_detail', 'Количество депозитов — динамический график', 'Deposit count - dynamic report'],
    ['chart.deposit_volume', 'Объём депозитов', 'Deposit volume'],
    ['chart.bet_category', 'Категория ставок', 'Bet category'],
    ['chart.deposits_and_profit', 'Депозиты и Профит (Сумма)', 'Deposits and Profit (Sum)'],
    
    // ═══ ГРАФИКИ CHANNELS ═══
    ['chart.all_channels', 'Все каналы — динамический график', 'All metrics - dynamic report'],
    ['chart.email_detail', 'E-mail — динамический график', 'E-mail — dynamic report'],
    ['chart.push_detail', 'App Push — динамический график', 'App Push — dynamic report'],
    ['chart.webpush_detail', 'Web-Push — динамический график', 'Web-Push — dynamic report'],
    ['chart.sms_detail', 'SMS — динамический график', 'SMS — dynamic report'],
    ['chart.telegram_detail', 'Telegram — динамический график', 'Telegram — dynamic report'],
    ['chart.whatsapp_detail', 'WhatsApp — динамический график', 'WhatsApp — dynamic report'],
    ['chart.popup_detail', 'Pop-up — динамический график', 'Pop-up — dynamic report'],
    ['chart.ai_detail', 'AI — динамический график', 'AI — dynamic report'],
    ['chart.conversions_by_channel', 'Конверсии по каналам', 'Conversions by channel'],
    ['chart.sent_distribution', 'Распределение отправок', 'Sent amount'],
    ['chart.sent_by_channel', 'Отправки по каналам', 'Sent by channel'],
    
    // ═══ СЕКЦИИ ТАБЛИЦ ═══
    ['section.deposits', 'ДЕПОЗИТЫ', 'DEPOSITS'],
    ['section.sport', 'СПОРТ', 'SPORT'],
    ['section.casino', 'КАЗИНО', 'CASINO'],
    ['section.profit', 'Профит и Бонусы', 'Profit and Bonuses'],
    
    // ═══ МЕТРИКИ ТАБЛИЦ (Finance) ═══
    ['metric.deposit_count', 'Кол-во депозитов', 'Deposit count'],
    ['metric.deposit_sum', 'Сумма депозитов', 'Deposit sum'],
    ['metric.avg_deposit_count_per_day', 'Ср. кол-во депозитов в день', 'Av. dep count per day'],
    ['metric.avg_deposit_sum_per_day', 'Ср. сумма депозитов в день', 'Av. dep sum per day'],
    ['metric.ftd_sum', 'Сумма ФТД', 'FTD Sum'],
    ['metric.ftd_users_redep_sum', 'Сумма редеп юзеров с ФТД', 'FTD users re-dep sum'],
    ['metric.ftd_to_total_dep_percent', 'Сумма ФТД / Тотал сумма деп ФТД юзеров (%)', 'FTD sum / FTD users total dep sum (%)'],
    ['metric.redep_1m_plus_sum', 'Сумма редеп юзеров с ФТД 1м+', 'Re-dep sum of users with FTD 1m+'],
    ['metric.redep_1m_plus_to_total_percent', 'Сумма редеп юзеров 1м+ / Тотал сумма деп (%)', 'Re-dep sum of users 1m+ / Total dep sum (%)'],
    
    ['metric.bet_sum', 'Сумма ставок', 'Bet sum'],
    ['metric.bet_count', 'Количество ставок', 'Bet count'],
    ['metric.total_ggr', 'Тотал GGR', 'Total GGR'],
    ['metric.avg_bet_sum_per_day', 'Ср. сумма ставок в день', 'Av. bet sum per day'],
    ['metric.avg_bet_count_per_day', 'Ср. кол-во ставок в день', 'Av. bet count per day'],
    ['metric.avg_bettors_per_day', 'Ср. кол-во ставочников в день', 'Av. users with bet per day'],
    
    ['metric.total_profit', 'Тотал профит (Деп-вывод)', 'Total profit (Dep-WD)'],
    ['metric.avg_profit_per_day', 'Ср. профит в день', 'Av. profit per day'],
    ['metric.credited_bonuses', 'Выданные бонусы', 'Credited bonuses'],
    ['metric.bonus_to_deposits_percent', 'Бонусы к депозитам (%)', 'Bonus to deposits (%)'],
    
    // ═══ МЕСЯЦЫ ═══
    ['month.january', 'Январь', 'January'],
    ['month.february', 'Февраль', 'February'],
    ['month.march', 'Март', 'March'],
    ['month.april', 'Апрель', 'April'],
    ['month.may', 'Май', 'May'],
    ['month.june', 'Июнь', 'June'],
    ['month.july', 'Июль', 'July'],
    ['month.august', 'Август', 'August'],
    ['month.september', 'Сентябрь', 'September'],
    ['month.october', 'Октябрь', 'October'],
    ['month.november', 'Ноябрь', 'November'],
    ['month.december', 'Декабрь', 'December']
  ];
  
  sheet.getRange(1, 1, data.length, 3).setValues(data);
  
  // Стили
  var headerRange = sheet.getRange('A1:C1');
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  
  sheet.setColumnWidth(1, 300);
  sheet.setColumnWidth(2, 400);
  sheet.setColumnWidth(3, 400);
  
  Logger.log('[setupTranslations] Created ' + (data.length - 1) + ' translations');
}