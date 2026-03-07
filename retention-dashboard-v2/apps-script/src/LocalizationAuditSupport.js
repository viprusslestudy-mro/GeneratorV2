/**
 * Аудит ключей из ДАННЫХ Support (не из кода!)
 * Сканирует листы LiveChat KPI, Tags и т.д.
 * Находит все локали, метрики, заголовки — и проверяет есть ли переводы
 */
function auditSupportDataKeys() {
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('   🔍 SUPPORT DATA KEYS AUDIT — START');
  Logger.log('═══════════════════════════════════════════════════════════════');
  
  var dataKeys = [];
  
  // ═══ 1. Собираем данные Support ═══
  try {
    var supportData = collectSupportData();
    
    // Локали из KPI
    if (supportData.liveChat && supportData.liveChat.byLocale) {
      Object.keys(supportData.liveChat.byLocale).forEach(function(locale) {
        dataKeys.push({ key: locale, type: 'locale', source: 'LiveChat KPI' });
      });
    }
    
    // Метрики KPI (id)
    var kpiMetrics = ['total_chats', 'first_response', 'avg_response', 'avg_duration', 'missed_chats', 'chat_satisfaction'];
    kpiMetrics.forEach(function(metric) {
      dataKeys.push({ key: metric, type: 'kpi_metric', source: 'KPI Dashboard' });
    });
    
    // Теги (если есть)
    if (supportData.tags && supportData.tags.items) {
      supportData.tags.items.forEach(function(tag) {
        if (tag.name) {
          dataKeys.push({ key: tag.name, type: 'tag', source: 'Tags' });
        }
      });
    }
    
  } catch(e) {
    Logger.log('⚠️ Error collecting Support data: ' + e.message);
  }
  
  // ═══ 2. Загружаем существующие переводы ═══
  var existingKeys = _loadExistingTranslationKeys();
  var existingSet = {};
  existingKeys.forEach(function(k) {
    existingSet[k.original.toLowerCase()] = true;
    existingSet[k.noEmoji ? k.noEmoji.toLowerCase() : ''] = true;
  });
  
  // ═══ 3. Находим отсутствующие ═══
  var missing = [];
  dataKeys.forEach(function(entry) {
    var keyLower = entry.key.toLowerCase();
    if (!existingSet[keyLower]) {
      missing.push(entry);
    }
  });
  
  // ═══ 4. Отчёт ═══
  Logger.log('\n📊 РЕЗУЛЬТАТЫ:');
  Logger.log('Всего ключей в данных: ' + dataKeys.length);
  Logger.log('Отсутствуют в переводах: ' + missing.length);
  
  if (missing.length > 0) {
    Logger.log('\n🔴 ДОБАВЬТЕ В 🌐 TRANSLATIONS:');
    Logger.log('────────────────────────────────────────────────────────');
    
    missing.forEach(function(m) {
      var ruText = _getSupportRuText(m.key);
      var enText = _getSupportEnText(m.key);
      Logger.log(m.key + ' | ' + ruText + ' | ' + enText + '  [' + m.type + ']');
    });
  }
  
  return { total: dataKeys.length, missing: missing };
}

/**
 * Автоперевод для Support ключей
 */
function _getSupportRuText(key) {
  var map = {
    // Локали
    'ALL': 'Все локали',
    'ALL GEO': 'Все локали',
    'RU': 'Россия',
    'EN': 'Англия',
    'DE': 'Германия',
    'FR': 'Франция',
    'ES': 'Испания',
    'PT': 'Португалия',
    'PL': 'Польша',
    'UA': 'Украина',
    'UZ': 'Узбекистан',
    'KZ': 'Казахстан',
    'TR': 'Турция',
    'IT': 'Италия',
    'FI': 'Финляндия',
    'JA': 'Япония',
    'KO': 'Корея',
    'ZH': 'Китай',
    
    // KPI метрики - заголовки
    'total_chats': 'Чаты',
    'first_response': '1-й ответ',
    'avg_response': 'Ср. ответ',
    'avg_duration': 'Длительность',
    'missed_chats': 'Пропущено',
    'chat_satisfaction': 'Оценка',
    
    // Subtext для карточек
    'total_chats_subtext': 'Всего чатов',
    'first_response_subtext': 'Цель: < 0:15',
    'avg_response_subtext': 'Цель: < 1:00',
    'avg_duration_subtext': 'Среднее (минут)',
    'missed_chats_subtext': 'Кол-во пропущенных',
    'chat_satisfaction_subtext': 'Оценка клиентов',
    
    // Дополнительные термины
    'chats': 'чатов',
    'minutes': 'минут',
    'missed': 'пропущено',
    'rated_good': 'Хорошо',
    'rated_bad': 'Плохо',
    
    // Заголовки
    'Support Dashboard': 'Дашборд поддержки',
    'KPI Dashboard': 'KPI Дашборд',
    'Performance Trend': 'Динамика показателей',
    'By Locale': 'По локалям',
    'Отчет за': 'Отчет за',
    'Report for': 'Отчет за',
    
    // Вкладки
    'tab.support_stats': 'Статистика LiveChat',
    'tab.support_tags': 'Теги обращений'
  };
  return map[key] || key;
}

function _getSupportEnText(key) {
  var map = {
    // Локали
    'ALL': 'All Locales',
    'ALL GEO': 'All Locales',
    'RU': 'Russia',
    'EN': 'English',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'PT': 'Portugal',
    'PL': 'Poland',
    'UA': 'Ukraine',
    'UZ': 'Uzbekistan',
    'KZ': 'Kazakhstan',
    'TR': 'Turkey',
    'IT': 'Italy',
    'FI': 'Finland',
    'JA': 'Japan',
    'KO': 'Korea',
    'ZH': 'China',
    
    // KPI метрики - заголовки
    'total_chats': 'Total Chats',
    'first_response': 'First Response',
    'avg_response': 'Avg Response',
    'avg_duration': 'Duration',
    'missed_chats': 'Missed',
    'chat_satisfaction': 'Satisfaction',
    
    // Subtext для карточек
    'total_chats_subtext': 'Total chats',
    'first_response_subtext': 'Target: < 0:15',
    'avg_response_subtext': 'Target: < 1:00',
    'avg_duration_subtext': 'Average minutes',
    'missed_chats_subtext': 'Missed chats count',
    'chat_satisfaction_subtext': 'Customer rating',
    
    // Дополнительные термины
    'chats': 'chats',
    'minutes': 'minutes',
    'missed': 'missed',
    'rated_good': 'Good',
    'rated_bad': 'Bad',
    
    // Заголовки
    'Support Dashboard': 'Support Dashboard',
    'KPI Dashboard': 'KPI Dashboard',
    'Performance Trend': 'Performance Trend',
    'By Locale': 'By Locale',
    'Отчет за': 'Report for',
    'Report for': 'Report for',
    
    // Вкладки
    'tab.support_stats': 'LiveChat Statistics',
    'tab.support_tags': 'Issue Tags'
  };
  return map[key] || key;
}

/**
 * Добавить недостающие Support ключи в таблицу
 */
function generateMissingSupportTranslations() {
  var audit = auditSupportDataKeys();
  
  if (audit.missing.length === 0) {
    Logger.log('✅ Все Support ключи уже есть в таблице!');
    return;
  }
  
  var ss = getSettingsSpreadsheet();
  var sheet = ss.getSheetByName(TRANSLATIONS_SHEET_NAME);
  if (!sheet) {
    Logger.log('❌ Лист ' + TRANSLATIONS_SHEET_NAME + ' не найден!');
    return;
  }
  
  var lastRow = sheet.getLastRow();
  
  // Добавляем разделитель
  lastRow++;
  sheet.getRange(lastRow, 1).setValue('___SUPPORT_AUTO_' + new Date().toISOString().slice(0,10));
  sheet.getRange(lastRow, 1, 1, 3).merge();
  
  // Добавляем ключи
  audit.missing.forEach(function(m) {
    lastRow++;
    sheet.getRange(lastRow, 1).setValue(m.key);
    sheet.getRange(lastRow, 2).setValue(_getSupportRuText(m.key));
    sheet.getRange(lastRow, 3).setValue(_getSupportEnText(m.key));
    Logger.log('✅ Added: ' + m.key);
  });
  
  Logger.log('\n✅ Добавлено ' + audit.missing.length + ' ключей!');
}