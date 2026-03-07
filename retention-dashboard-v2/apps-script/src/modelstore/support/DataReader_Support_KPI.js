/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DataReader_Support_KPI.js — Чтение KPI LiveChat
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Чтение KPI LiveChat — адаптивный парсер v3.2
 * Читает данные по локалям БЕЗ суммирования
 */
function readLiveChatKPI(spreadsheetId, sheetName, targetPeriod) {
  const result = createEmptyLiveChatKPI();
  
  try {
    const ssId = spreadsheetId || getSupportSpreadsheetId();
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log('[readLiveChatKPI] Sheet "' + sheetName + '" not found');
      return result;
    }
    
    Logger.log('[readLiveChatKPI] Reading: "' + sheetName + '"');

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const data = sheet.getRange(1, 1, Math.min(lastRow, 500), Math.min(lastCol, 50)).getValues();
    
    // ═══ ШАБЛОНЫ ПОИСКА МЕТРИК ═══
    const METRIC_PATTERNS = {
      totalChats: ['total chats', 'chats (count)'],
      firstResponse: ['first response', 'av. first response'],
      avgResponse: ['av. response', 'avg response'],
      duration: ['duration', 'chat duration', 'av. chat'],
      missedChats: ['missed chats', 'missed'],
      satisfaction: ['satisfaction', 'chat satisfaction'],
      ratedGood: ['rated good', 'chat rated good'],
      ratedBad: ['rated bad', 'chat rated bad']
    };
    
    // ═══ НАХОДИМ ВСЕ БЛОКИ (Total Month и Weeks) ═══
    const blocks = [];
    
    for (let i = 0; i < data.length; i++) {
      const cellA = String(data[i][0] || '').trim().toLowerCase();
      
      if (cellA.includes('total month')) {
        blocks.push({ type: 'total', row: i, label: 'Total Month' });
      } else if (cellA.includes('week #')) {
        const weekLabel = String(data[i][0] || '').trim();
        blocks.push({ type: 'week', row: i, label: weekLabel });
      }
    }
    
    Logger.log('[readLiveChatKPI] Found blocks: ' + JSON.stringify(blocks));
    
    if (blocks.length === 0) {
      Logger.log('[readLiveChatKPI] No blocks found');
      return result;
    }
    
    // ═══ ФУНКЦИЯ ПОИСКА КОЛОНОК ЛОКАЛЕЙ В БЛОКЕ ═══
    const findLocaleColumns = function(blockRow) {
      const localeColumns = {};
      const headerRow = data[blockRow];
      
      const normalizeLocaleName = function(name) {
        const n = String(name || '').trim().toUpperCase();
        if (!n) return null;
        
        if (n === 'ALL GEO' || n === 'ALL' || n === 'TOTAL') return 'ALL';
        
        let normalized = n
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/-BRAZIL/gi, '')
          .replace(/-MEXICO/gi, '')
          .replace(/ZH-HANT/gi, 'ZH')
          .replace(/ZH-HANS/gi, 'ZH')
          .replace(/PT-BR/gi, 'PT')
          .replace(/ES-MX/gi, 'ES')
          .trim();
        
        const knownLocales = ['DE', 'EN', 'ES', 'FR', 'PL', 'PT', 'UA', 'UZ', 'RU', 'KZ', 'TR', 'IT', 'FI', 'JA', 'KO', 'ZH'];
        
        for (var j = 0; j < knownLocales.length; j++) {
          if (normalized.includes(knownLocales[j])) return knownLocales[j];
        }
        
        return normalized.length === 2 ? normalized : null;
      };
      
      for (let col = 2; col < headerRow.length; col++) {
        const header = String(headerRow[col] || '').trim();
        const localeKey = normalizeLocaleName(header);
        
        if (localeKey && !localeColumns[localeKey]) {
          localeColumns[localeKey] = col;
        }
      }
      
      return localeColumns;
    };
    
    // ═══ ФУНКЦИЯ ПОИСКА СТРОКИ МЕТРИКИ (ищем в колонке B) ═══
    const findMetricRow = function(startRow, patterns, maxRows) {
      maxRows = maxRows || 15;
      for (let i = startRow; i < Math.min(data.length, startRow + maxRows); i++) {
        const cellB = String(data[i][1] || '').toLowerCase().trim();
        
        for (var p = 0; p < patterns.length; p++) {
          if (cellB.includes(patterns[p])) {
            return i;
          }
        }
      }
      return -1;
    };
    
    // ═══ ФУНКЦИЯ ЧТЕНИЯ ДАТЫ ═══
    const readDates = function(blockRow) {
      const nextRowA = String(data[blockRow + 1] && data[blockRow + 1][0] || '').trim();
      if (nextRowA.match(/\d{1,2}[\.\-\/]\d{1,2}/)) {
        return nextRowA;
      }
      return '';
    };
    
    // ═══ ФУНКЦИЯ ПАРСИНГА БЛОКА ДЛЯ ОДНОЙ ЛОКАЛИ ═══
    const parseBlockForLocale = function(blockRow, col) {
      const chatsRow = findMetricRow(blockRow, METRIC_PATTERNS.totalChats);
      const satRow = findMetricRow(blockRow, METRIC_PATTERNS.satisfaction);
      const firstRow = findMetricRow(blockRow, METRIC_PATTERNS.firstResponse);
      const avgRow = findMetricRow(blockRow, METRIC_PATTERNS.avgResponse);
      const durRow = findMetricRow(blockRow, METRIC_PATTERNS.duration);
      const missedRow = findMetricRow(blockRow, METRIC_PATTERNS.missedChats);
      const goodRow = findMetricRow(blockRow, METRIC_PATTERNS.ratedGood);
      const badRow = findMetricRow(blockRow, METRIC_PATTERNS.ratedBad);
      
      let sat = satRow >= 0 ? data[satRow][col] : 0;
      if (sat !== null && sat <= 1 && sat > 0) sat = sat * 100;
      
      // ✅ ИСПРАВЛЕНИЕ: Читаем ratedGood и ratedBad
      const ratedGood = parseNumber(goodRow >= 0 ? data[goodRow][col] : 0);
      const ratedBad = parseNumber(badRow >= 0 ? data[badRow][col] : 0);
      
      // ✅ ИСПРАВЛЕНИЕ: Если satisfaction пустой но есть оценки — вычисляем
      let finalSat = Math.round(parseNumber(sat));
      if (finalSat === 0 && (ratedGood > 0 || ratedBad > 0)) {
        const total = ratedGood + ratedBad;
        if (total > 0) {
          finalSat = Math.round((ratedGood / total) * 100);
        }
      }
      
      return {
        totalChats: parseNumber(chatsRow >= 0 ? data[chatsRow][col] : 0),
        satisfaction: finalSat,
        firstResponse: parseTimeStringToSeconds(firstRow >= 0 ? data[firstRow][col] : 0),
        avgResponse: parseTimeStringToSeconds(avgRow >= 0 ? data[avgRow][col] : 0),
        chatDuration: parseTimeStringToMinutes(durRow >= 0 ? data[durRow][col] : 0),
        missedChats: parseNumber(missedRow >= 0 ? data[missedRow][col] : 0),
        ratedGood: ratedGood,
        ratedBad: ratedBad
      };
    };
    
    // ═══ ПАРСИМ TOTAL MONTH ═══
    const totalBlock = blocks.find(function(b) { return b.type === 'total'; });
    
    if (totalBlock) {
      const localeColumns = findLocaleColumns(totalBlock.row);
      Logger.log('[readLiveChatKPI] Total Month locales: ' + JSON.stringify(localeColumns));
      
      const dates = readDates(totalBlock.row);
      
      // Читаем данные для КАЖДОЙ локали отдельно
      Object.keys(localeColumns).forEach(function(localeKey) {
        const col = localeColumns[localeKey];
        const localeData = parseBlockForLocale(totalBlock.row, col);
        
        if (localeKey === 'ALL') {
          // ALL GEO — общие данные
          result.totalChats = localeData.totalChats;
          result.chatSatisfaction = localeData.satisfaction;
          result.firstResponseTime = localeData.firstResponse;
          result.avgResponseTime = localeData.avgResponse;
          result.avgChatDuration = localeData.chatDuration;
          result.missedChats = localeData.missedChats;
          result.ratedGood = localeData.ratedGood;
          result.ratedBad = localeData.ratedBad;
        } else {
          // Конкретная локаль
          result.byLocale[localeKey] = {
            totalChats: localeData.totalChats,
            satisfaction: localeData.satisfaction,
            firstResponse: localeData.firstResponse,
            avgResponse: localeData.avgResponse,
            chatDuration: localeData.chatDuration,
            missedChats: localeData.missedChats,
            ratedGood: localeData.ratedGood,
            ratedBad: localeData.ratedBad,
            weeklyKPI: []
          };
          
          if (localeData.totalChats > 0) {
            Logger.log('[readLiveChatKPI] ' + localeKey + ': chats=' + localeData.totalChats + ', sat=' + localeData.satisfaction + '%');
          }
        }
      });
      
      // Локали из Total Month (добавим ещё из недель ниже)
      var allLocalesSet = {};
      Object.keys(localeColumns).forEach(function(k) {
        if (k !== 'ALL') allLocalesSet[k] = true;
      });
      
      Logger.log('[readLiveChatKPI] Total Month ALL GEO: chats=' + result.totalChats + ', sat=' + result.chatSatisfaction + '%');
    }
    
    // ═══ ПАРСИМ НЕДЕЛИ ═══
    const weekBlocks = blocks.filter(function(b) { return b.type === 'week'; });
    
    weekBlocks.forEach(function(weekBlock) {
      const localeColumns = findLocaleColumns(weekBlock.row);
      const dates = readDates(weekBlock.row);
      
      // Парсим ALL GEO для недели
      const allCol = localeColumns['ALL'];
      let weekData = { totalChats: 0, satisfaction: 0, ratedGood: 0, ratedBad: 0 };
      
      if (allCol !== undefined) {
        weekData = parseBlockForLocale(weekBlock.row, allCol);
      }
      
      // Сохраняем глобальную неделю
      result.weeklyKPI.push({
        label: weekBlock.label,
        dates: dates,
        totalChats: weekData.totalChats,
        satisfaction: weekData.satisfaction,
        firstResponseTime: weekData.firstResponse,
        avgResponseTime: weekData.avgResponse,
        avgChatDuration: weekData.chatDuration,
        missedChats: weekData.missedChats,
        ratedGood: weekData.ratedGood,
        ratedBad: weekData.ratedBad,
        trend: 0
      });
      
      // Парсим недели для каждой локали (включая те что только в этой неделе)
      Object.keys(localeColumns).forEach(function(localeKey) {
        if (localeKey === 'ALL') return;
        
        const col = localeColumns[localeKey];
        const localeWeekData = parseBlockForLocale(weekBlock.row, col);
        
        // Создаём локаль если её ещё нет (локаль только в неделях, не в Total Month)
        if (!result.byLocale[localeKey]) {
          result.byLocale[localeKey] = {
            totalChats: 0,
            satisfaction: 0,
            firstResponse: 0,
            avgResponse: 0,
            chatDuration: 0,
            missedChats: 0,
            ratedGood: 0,
            ratedBad: 0,
            weeklyKPI: []
          };
          
          // Заполняем пустыми неделями до текущей
          for (var prevWeek = 0; prevWeek < result.weeklyKPI.length - 1; prevWeek++) {
            result.byLocale[localeKey].weeklyKPI.push({
              label: result.weeklyKPI[prevWeek].label,
              dates: result.weeklyKPI[prevWeek].dates,
              totalChats: 0,
              satisfaction: 0,
              firstResponseTime: 0,
              avgResponseTime: 0,
              avgChatDuration: 0,
              missedChats: 0,
              ratedGood: 0,
              ratedBad: 0,
              trend: 0
            });
          }
        }
        
        // Добавляем неделю к локали
        result.byLocale[localeKey].weeklyKPI.push({
          label: weekBlock.label,
          dates: dates,
          totalChats: localeWeekData.totalChats,
          satisfaction: localeWeekData.satisfaction,
          firstResponseTime: localeWeekData.firstResponse,
          avgResponseTime: localeWeekData.avgResponse,
          avgChatDuration: localeWeekData.chatDuration,
          missedChats: localeWeekData.missedChats,
          ratedGood: localeWeekData.ratedGood,
          ratedBad: localeWeekData.ratedBad,
          trend: 0
        });
      });
      
      Logger.log('[readLiveChatKPI] ' + weekBlock.label + ' ALL GEO: chats=' + weekData.totalChats);
    });
    
    Logger.log('[readLiveChatKPI] Weekly blocks: ' + result.weeklyKPI.length);
    
    // Собираем ВСЕ локали из всех блоков (Total Month + недели)
    weekBlocks.forEach(function(weekBlock) {
      var weekLocaleColumns = findLocaleColumns(weekBlock.row);
      Object.keys(weekLocaleColumns).forEach(function(k) {
        if (k !== 'ALL') allLocalesSet[k] = true;
      });
    });
    
    result.locales = Object.keys(allLocalesSet);
    Logger.log('[readLiveChatKPI] All locales from all blocks: ' + result.locales.join(', '));
    
    // ═══ АВТОСУММИРОВАНИЕ: Если ALL GEO пустой — суммируем из локалей ═══
    var autoCalcEnabled = true;
    try {
      var appSettings = getAppSettings();
      autoCalcEnabled = appSettings.supportAutoCalcAllGeo !== false;
    } catch (e) {
      Logger.log('[readLiveChatKPI] getAppSettings error, auto-calc ON by default');
    }

    if (autoCalcEnabled) {
      _fillAllGeoFromLocales(result);
      Logger.log('[readLiveChatKPI] Auto-calc ALL GEO: enabled');
    } else {
      Logger.log('[readLiveChatKPI] Auto-calc ALL GEO: disabled by settings');
    }

    // Тренды
    _calculateKPITrends(result, result.locales || []);
    
  } catch (e) {
    Logger.log('[readLiveChatKPI] Error: ' + e.message);
    Logger.log(e.stack);
  }
  
  return result;
}

/**
 * Нормализация ключа локали
 */
/**
 * Нормализация ключа локали
 * Приводит к стандартному виду, неизвестные локали возвращает как есть (uppercase)
 */
function normalizeLocaleKey(locale) {
  if (!locale) return null;
  
  const upper = String(locale).trim().toUpperCase();
  if (!upper) return null;
  
  // Маппинг для известных вариантов написания
  const mapping = {
    // Стандартные
    'RU': 'RU',
    'UA': 'UA',
    'PT': 'PT',
    'PL': 'PL',
    'ES': 'ES',
    'FR': 'FR',
    'DE': 'DE',
    'EN': 'EN',
    'UZ': 'UZ',
    'KZ': 'KZ',
    'TR': 'TR',
    'IT': 'IT',
    'FI': 'FI',
    'JA': 'JA',
    'KO': 'KO',
    'ZH': 'ZH',
    
    // Варианты с регионом → базовый код
    'PT-BRAZIL': 'PT',
    'PT-BR': 'PT',
    'ES-MEXICO': 'ES',
    'ES-MX': 'ES',
    'ES-419': 'ES',
    'ZH-HANT': 'ZH',
    'ZH-HANS': 'ZH',
    'ZH-TW': 'ZH',
    'ZH-CN': 'ZH',
    'EN-US': 'EN',
    'EN-GB': 'EN',
    'FR-CA': 'FR',
    'DE-AT': 'DE',
    'DE-CH': 'DE'
  };
  
  // Если есть в маппинге — возвращаем нормализованное
  if (mapping[upper]) {
    return mapping[upper];
  }
  
  // Пробуем извлечь базовый код (первые 2 символа) для формата "XX-YY"
  if (upper.includes('-') && upper.length >= 2) {
    const baseCode = upper.split('-')[0];
    if (baseCode.length === 2 && mapping[baseCode]) {
      return mapping[baseCode];
    }
    // Если базовый код не в маппинге, но это 2 буквы — возвращаем его
    if (baseCode.length === 2 && /^[A-Z]{2}$/.test(baseCode)) {
      return baseCode;
    }
  }
  
  // Если это 2-буквенный код — возвращаем как есть (новая неизвестная локаль)
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  
  // Если это 3-буквенный код (ISO 639-2) — тоже возвращаем
  if (upper.length === 3 && /^[A-Z]{3}$/.test(upper)) {
    return upper;
  }
  
  // Для всего остального — возвращаем null (мусорные данные)
  return null;
}

/**
 * Вычисление трендов
 */
function _calculateKPITrends(result, locales) {
  // Глобальные тренды
  for (let j = 1; j < result.weeklyKPI.length; j++) {
    const curr = result.weeklyKPI[j].totalChats;
    const prev = result.weeklyKPI[j - 1].totalChats;
    if (prev > 0) {
      result.weeklyKPI[j].trend = Math.round(((curr - prev) / prev) * 100);
    }
  }
  
  // По локалям
  locales.forEach(loc => {
    if (!result.byLocale[loc] || !result.byLocale[loc].weeklyKPI) return;
    const weeks = result.byLocale[loc].weeklyKPI;
    for (let j = 1; j < weeks.length; j++) {
      const curr = weeks[j].totalChats;
      const prev = weeks[j - 1].totalChats;
      if (prev > 0) {
        weeks[j].trend = Math.round(((curr - prev) / prev) * 100);
      }
    }
  });
  
  // Основные метрики
  if (result.weeklyKPI.length >= 2) {
    const latest = result.weeklyKPI[result.weeklyKPI.length - 1];
    const prev = result.weeklyKPI[result.weeklyKPI.length - 2];
    const calcTrend = (c, p) => (p > 0) ? Math.round(((c - p) / p) * 100) : 0;
    
    result.totalChatsTrend = calcTrend(latest.totalChats, prev.totalChats);
    result.chatSatisfactionTrend = calcTrend(latest.satisfaction, prev.satisfaction);
    result.firstResponseTimeTrend = calcTrend(latest.firstResponseTime, prev.firstResponseTime);
    result.avgResponseTimeTrend = calcTrend(latest.avgResponseTime, prev.avgResponseTime);
    result.missedChatsTrend = calcTrend(latest.missedChats, prev.missedChats);
  }
}

/**
 * Заполняет ALL GEO данные суммированием из локалей,
 * если колонка ALL GEO в таблице пустая
 */
function _fillAllGeoFromLocales(result) {
  var localeKeys = Object.keys(result.byLocale || {});
  
  if (localeKeys.length === 0) return;
  
  // ═══ TOTAL MONTH ═══
  if (result.totalChats === 0) {
    var sumChats = 0;
    var sumGood = 0;
    var sumBad = 0;
    var sumMissed = 0;
    var weightedSat = 0;
    var weightedFirst = 0;
    var weightedAvg = 0;
    var weightedDur = 0;
    var totalWeightChats = 0;
    
    localeKeys.forEach(function(loc) {
      var d = result.byLocale[loc];
      if (!d) return;
      var chats = d.totalChats || 0;
      
      sumChats += chats;
      sumGood += (d.ratedGood || 0);
      sumBad += (d.ratedBad || 0);
      sumMissed += (d.missedChats || 0);
      
      if (chats > 0) {
        totalWeightChats += chats;
        weightedSat += (d.satisfaction || 0) * chats;
        weightedFirst += (d.firstResponse || 0) * chats;
        weightedAvg += (d.avgResponse || 0) * chats;
        weightedDur += (d.chatDuration || 0) * chats;
      }
    });
    
    if (sumChats > 0) {
      result.totalChats = sumChats;
      result.ratedGood = sumGood;
      result.ratedBad = sumBad;
      result.missedChats = sumMissed;
      
      if (totalWeightChats > 0) {
        result.chatSatisfaction = Math.round(weightedSat / totalWeightChats);
        result.firstResponseTime = Math.round(weightedFirst / totalWeightChats);
        result.avgResponseTime = Math.round(weightedAvg / totalWeightChats);
        result.avgChatDuration = Math.round((weightedDur / totalWeightChats) * 100) / 100;
      }
      
      // Fallback: satisfaction из good/bad
      if (result.chatSatisfaction === 0 && (sumGood + sumBad) > 0) {
        result.chatSatisfaction = Math.round((sumGood / (sumGood + sumBad)) * 100);
      }
      
      Logger.log('[_fillAllGeoFromLocales] Total Month filled from locales: chats=' + sumChats + ', sat=' + result.chatSatisfaction + '%');
    }
  }
  
  // ═══ WEEKLY ═══
  for (var wi = 0; wi < result.weeklyKPI.length; wi++) {
    var week = result.weeklyKPI[wi];
    
    if ((week.totalChats || 0) === 0) {
      var wSumChats = 0;
      var wSumGood = 0;
      var wSumBad = 0;
      var wSumMissed = 0;
      var wWeightedSat = 0;
      var wWeightedFirst = 0;
      var wWeightedAvg = 0;
      var wWeightedDur = 0;
      var wTotalWeight = 0;
      
      localeKeys.forEach(function(loc) {
        var locData = result.byLocale[loc];
        if (!locData || !locData.weeklyKPI || !locData.weeklyKPI[wi]) return;
        
        var lw = locData.weeklyKPI[wi];
        var chats = lw.totalChats || 0;
        
        wSumChats += chats;
        wSumGood += (lw.ratedGood || 0);
        wSumBad += (lw.ratedBad || 0);
        wSumMissed += (lw.missedChats || 0);
        
        if (chats > 0) {
          wTotalWeight += chats;
          wWeightedSat += (lw.satisfaction || 0) * chats;
          wWeightedFirst += (lw.firstResponseTime || 0) * chats;
          wWeightedAvg += (lw.avgResponseTime || 0) * chats;
          wWeightedDur += (lw.avgChatDuration || 0) * chats;
        }
      });
      
      if (wSumChats > 0) {
        week.totalChats = wSumChats;
        week.ratedGood = wSumGood;
        week.ratedBad = wSumBad;
        week.missedChats = wSumMissed;
        
        if (wTotalWeight > 0) {
          week.satisfaction = Math.round(wWeightedSat / wTotalWeight);
          week.firstResponseTime = Math.round(wWeightedFirst / wTotalWeight);
          week.avgResponseTime = Math.round(wWeightedAvg / wTotalWeight);
          week.avgChatDuration = Math.round((wWeightedDur / wTotalWeight) * 100) / 100;
        }
        
        if (week.satisfaction === 0 && (wSumGood + wSumBad) > 0) {
          week.satisfaction = Math.round((wSumGood / (wSumGood + wSumBad)) * 100);
        }
        
        Logger.log('[_fillAllGeoFromLocales] ' + week.label + ' filled: chats=' + wSumChats + ', sat=' + week.satisfaction + '%');
      }
    }
  }

  // ═══ FALLBACK: Если Total Month пустой — суммируем из недель ═══
  if (result.totalChats === 0 && result.weeklyKPI.length > 0) {
    var weekSumChats = 0;
    var weekSumGood = 0;
    var weekSumBad = 0;
    var weekSumMissed = 0;
    var weekWeightedSat = 0;
    var weekWeightedFirst = 0;
    var weekWeightedAvg = 0;
    var weekWeightedDur = 0;
    var weekTotalWeight = 0;
    
    result.weeklyKPI.forEach(function(week) {
      var chats = week.totalChats || 0;
      
      weekSumChats += chats;
      weekSumGood += (week.ratedGood || 0);
      weekSumBad += (week.ratedBad || 0);
      weekSumMissed += (week.missedChats || 0);
      
      if (chats > 0) {
        weekTotalWeight += chats;
        weekWeightedSat += (week.satisfaction || 0) * chats;
        weekWeightedFirst += (week.firstResponseTime || 0) * chats;
        weekWeightedAvg += (week.avgResponseTime || 0) * chats;
        weekWeightedDur += (week.avgChatDuration || 0) * chats;
      }
    });
    
    if (weekSumChats > 0) {
      result.totalChats = weekSumChats;
      result.ratedGood = weekSumGood;
      result.ratedBad = weekSumBad;
      result.missedChats = weekSumMissed;
      
      if (weekTotalWeight > 0) {
        result.chatSatisfaction = Math.round(weekWeightedSat / weekTotalWeight);
        result.firstResponseTime = Math.round(weekWeightedFirst / weekTotalWeight);
        result.avgResponseTime = Math.round(weekWeightedAvg / weekTotalWeight);
        result.avgChatDuration = Math.round((weekWeightedDur / weekTotalWeight) * 100) / 100;
      }
      
      // Fallback: satisfaction из good/bad
      if (result.chatSatisfaction === 0 && (weekSumGood + weekSumBad) > 0) {
        result.chatSatisfaction = Math.round((weekSumGood / (weekSumGood + weekSumBad)) * 100);
      }
      
      Logger.log('[_fillAllGeoFromLocales] Total Month filled FROM WEEKS: chats=' + weekSumChats + ', sat=' + result.chatSatisfaction + '%');
    }
  }

  // ═══ FALLBACK: Заполняем Total Month для локалей из их недель ═══
  localeKeys.forEach(function(loc) {
    var locData = result.byLocale[loc];
    if (!locData) return;
    
    // Если Total Month для локали пустой — суммируем из её недель
    if ((locData.totalChats || 0) === 0 && locData.weeklyKPI && locData.weeklyKPI.length > 0) {
      var locSumChats = 0;
      var locSumGood = 0;
      var locSumBad = 0;
      var locSumMissed = 0;
      var locWeightedSat = 0;
      var locWeightedFirst = 0;
      var locWeightedAvg = 0;
      var locWeightedDur = 0;
      var locTotalWeight = 0;
      
      locData.weeklyKPI.forEach(function(week) {
        var chats = week.totalChats || 0;
        
        locSumChats += chats;
        locSumGood += (week.ratedGood || 0);
        locSumBad += (week.ratedBad || 0);
        locSumMissed += (week.missedChats || 0);
        
        if (chats > 0) {
          locTotalWeight += chats;
          locWeightedSat += (week.satisfaction || 0) * chats;
          locWeightedFirst += (week.firstResponseTime || 0) * chats;
          locWeightedAvg += (week.avgResponseTime || 0) * chats;
          locWeightedDur += (week.avgChatDuration || 0) * chats;
        }
      });
      
      if (locSumChats > 0) {
        locData.totalChats = locSumChats;
        locData.ratedGood = locSumGood;
        locData.ratedBad = locSumBad;
        locData.missedChats = locSumMissed;
        
        if (locTotalWeight > 0) {
          locData.satisfaction = Math.round(locWeightedSat / locTotalWeight);
          locData.firstResponse = Math.round(locWeightedFirst / locTotalWeight);
          locData.avgResponse = Math.round(locWeightedAvg / locTotalWeight);
          locData.chatDuration = Math.round((locWeightedDur / locTotalWeight) * 100) / 100;
        }
        
        if (locData.satisfaction === 0 && (locSumGood + locSumBad) > 0) {
          locData.satisfaction = Math.round((locSumGood / (locSumGood + locSumBad)) * 100);
        }
        
        Logger.log('[_fillAllGeoFromLocales] ' + loc + ' Total Month filled from weeks: chats=' + locSumChats);
      }
    }
  });
}

/**
 * Fallback чтение KPI
 */
function readLiveChatKPIFallback(spreadsheetId, sheetName) {
  const result = createEmptyLiveChatKPI();
  
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId || SUPPORT_CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName || SUPPORT_CONFIG.SHEETS.KPI_LIVECHAT);
    if (!sheet) return result;
    
    const data = sheet.getRange(1, 13, 20, 2).getValues();
    const findVal = (k) => {
      const r = data.find(r => String(r[0]).toLowerCase().includes(k.toLowerCase()));
      return r ? r[1] : null;
    };
    
    result.totalChats = parseNumber(findVal('Total Chats'));
    let sat = findVal('satisfaction');
    if (sat && sat < 1) sat *= 100;
    result.chatSatisfaction = Math.round(parseNumber(sat));
    
  } catch (e) {
    Logger.log('[readLiveChatKPIFallback] Error: ' + e.message);
  }
  
  return result;
}