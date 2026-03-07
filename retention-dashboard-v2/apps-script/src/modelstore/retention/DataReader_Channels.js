/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATAREADER_CHANNELS.js - Чтение данных каналов коммуникации
 *  Tab: Ret. CHANNEL METRICS
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   МАППИНГ МЕТРИК КАНАЛОВ                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

var CHANNEL_METRIC_MAP = CHANNEL_METRIC_MAP || {
  'sent': 'sent',
  'delivered': 'delivered',
  'delivery rate': 'deliveryRate',
  'deliveryrate': 'deliveryRate',
  'opened': 'opened',
  'open rate': 'openRate',
  'openrate': 'openRate',
  'click': 'click',
  'clicked': 'click',
  'clicks': 'click',
  'click rate': 'clickRate',
  'clickrate': 'clickRate',
  'conversions': 'conversions',
  'conversion': 'conversions',
  'converted': 'conversions',
  'conversion rate': 'conversionRate',
  'conversionrate': 'conversionRate',
  'convert rate': 'conversionRate',
  'calls': 'calls',
  'success calls': 'successCalls',
  'success rate': 'successRate',
  'interested on call': 'interested',
  'interested rate': 'interestedRate',
  'contacts': 'contacts',
  'reply': 'reply',
  'reply rate': 'replyRate',
  'reactivations': 'reactivations',
  'reactivation rate': 'reactivationRate',
  'reactivated sum': 'reactivatedSum',
  'total contacts': 'totalContacts',
  'total conversions': 'totalConversions',
  'total conversion rate': 'totalConversionRate',
  'total clicks': 'totalClicks'
};

var CHANNEL_ROW_RANGES = CHANNEL_ROW_RANGES || {
  mail:          { startRow: 2,  endRow: 10 },
  push:          { startRow: 12, endRow: 16 },
  sms:           { startRow: 18, endRow: 24 },
  tg:            { startRow: 26, endRow: 32 },
  wa:            { startRow: 34, endRow: 40 },
  popup:         { startRow: 42, endRow: 48 },
  webpush:       { startRow: 50, endRow: 56 },
  ai:            { startRow: 58, endRow: 64 },
  call_center:   { startRow: 66, endRow: 72 },
  reactivation:  { startRow: 74, endRow: 82 }
};

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   ХЕЛПЕРЫ КАНАЛОВ                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function normalizeChannelName(name) {
  var n = String(name || '').trim()
    .replace(/[\r\n]+/g, ' ')
    .replace(/["'""]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

  if (!n) return '';

  // Известные маппинги
  var map = {
    'mail': 'mail', 'email': 'mail', 'e-mail': 'mail',
    'push': 'push', 'app push': 'push', 'app-push': 'push',
    'web-push': 'webpush', 'web push': 'webpush', 'webpush': 'webpush',
    'sms': 'sms',
    'tg': 'tg', 'telegram': 'tg',
    'wa': 'wa', 'whatsapp': 'wa', 'whats app': 'wa',
    'popup': 'popup', 'pop-up': 'popup', 'pop up': 'popup',
    'ai': 'ai', 'ai calls': 'ai', 'ai call': 'ai',
    'call center': 'call_center', 'call-center': 'call_center', 'callcenter': 'call_center'
  };

  if (map[n]) return map[n];
  if (n.includes('reactivation')) return 'reactivation';
  if (n.includes('total')) return 'total';

  // ═══ ЗАЩИТА: известные подметрики в colA — НЕ каналы ═══
  var knownMetrics = [
    'sent', 'delivered', 'delivery rate', 'opened', 'open rate',
    'click', 'clicked', 'clicks', 'click rate',
    'conversions', 'conversion', 'converted', 'conversion rate', 'convert rate',
    'calls', 'success calls', 'success rate',
    'interested on call', 'interested rate',
    'contacts', 'reply', 'reply rate',
    'reactivations', 'reactivation rate', 'reactivated sum'
  ];
  if (knownMetrics.indexOf(n) !== -1) return '';

  // ★ АВТОСОЗДАНИЕ: неизвестный канал → генерируем ключ из названия
  var autoKey = n.replace(/[^a-zа-яё0-9]+/g, '_').replace(/^_|_$/g, '');
  if (autoKey) {
    Logger.log('[normalizeChannelName] AUTO-KEY for unknown channel "' + name + '" → ' + autoKey);

    // Автоматически добавляем в CHANNEL_META если нет
    if (typeof CHANNEL_META !== 'undefined' && !CHANNEL_META[autoKey]) {
      CHANNEL_META[autoKey] = {
        name: String(name || '').trim(),  // оригинальное название как есть
        icon: '📊'                        // дефолтная иконка
      };
      Logger.log('[normalizeChannelName] Auto-created CHANNEL_META[' + autoKey + '] = "' + name + '"');
    }

    return autoKey;
  }

  return '';
}

function isSummaryChannelRow(name) {
  var text = String(name || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!text) return false;

  var normalized = text
    .replace(/[.:;!?()\[\]{}\-_/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // ═══ ТОЧНЫЕ summary-заголовки (колонка A) ═══
  var exactSummary = [
    'total', 'итог', 'итого', 'всего',
    'total внизу',
    'итого внизу'
  ];
  
  if (exactSummary.indexOf(normalized) !== -1) {
    return true;
  }

  // ═══ НЕ считаем summary подметрики с "total" ═══
  if (normalized.indexOf('total ') === 0) {
    return false;
  }

  // ═══ Русские префиксы ═══
  var prefixes = ['итог', 'итого', 'всего'];
  for (var j = 0; j < prefixes.length; j++) {
    var p = prefixes[j];
    if (normalized === p) return true;
  }

  return false;
}

function normalizeChannelMetric(name, channelKey) {
  var raw = String(name || '').trim();
  if (!raw) return '';

  var lower = raw.toLowerCase().trim();

  // Суффикс-цифры (если есть)
  var m = lower.match(/(\d+)$/);
  var suffix = m ? m[1] : '';
  var baseLower = suffix ? lower.slice(0, -suffix.length).trim() : lower;

  // 1) Точное совпадение (если когда-то добавят в map с цифрами)
  if (CHANNEL_METRIC_MAP[lower]) {
    return CHANNEL_METRIC_MAP[lower];
  }

  // 2) Базовое совпадение + суффикс
  if (CHANNEL_METRIC_MAP[baseLower]) {
    var baseKey = CHANNEL_METRIC_MAP[baseLower];
    return suffix ? (baseKey + suffix) : baseKey;
  }

  // 3) Авто-camelize (цифры сохраняются)
  var parts = lower.split(/\s+/);
  var mapped = parts[0] || '';
  for (var i = 1; i < parts.length; i++) {
    mapped += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
  }
  return mapped;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   ЧТЕНИЕ КОММУНИКАЦИИ TOTAL                               ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Получить список каналов из конфига CHANNEL METRICS
 * Если конфига нет — возвращает дефолтный список
 */
function getConfiguredChannelKeys() {
  try {
    var config = loadMetricsConfig();
    var channelByYear = config.channelByYear || {};
    var allChannels = {};
    
    Object.keys(channelByYear).forEach(function(year) {
      Object.keys(channelByYear[year] || {}).forEach(function(chKey) {
        allChannels[chKey] = true;
      });
    });
    
    var result = Object.keys(allChannels);
    if (result.length > 0) {
      Logger.log('[getConfiguredChannelKeys] From config: ' + result.join(', '));
      return result;
    }
  } catch (e) {
    Logger.log('[getConfiguredChannelKeys] Error: ' + e.message);
  }
  
  // Убрали 'lk', переименовали 'ai_calls' → 'ai'
  return ['mail', 'push', 'webpush', 'sms', 'tg', 'wa', 'popup', 'ai', 'call_center', 'reactivation'];
}

function readRetentionChannels(sourceConfig) {
  var activeMonths = getActiveMonthsForSource(sourceConfig ? sourceConfig.key : 'retention');
  if (activeMonths.length === 0) return createEmptyRetentionChannels();

  // Фильтруем: только месяцы где есть channels лист
  var channelsMonths = activeMonths.filter(function(m) {
    var hasChannels = m.roleSheets && m.roleSheets.channels;
    if (!hasChannels) {
      Logger.log('[readRetentionChannels] Month SKIPPED (no channels sheet): ' + m.name);
    }
    return hasChannels;
  });

  if (channelsMonths.length === 0) {
    Logger.log('[readRetentionChannels] No months with channels sheets enabled');
    return createEmptyRetentionChannels();
  }

  var ss = SpreadsheetApp.openById(sourceConfig ? sourceConfig.spreadsheetId : getRetentionSpreadsheetId());

  refreshChannelMetaFromConfig();
  var channelsData = createEmptyRetentionChannels();

  // ★ Получаем базовый месяц для CHANNELS (для него нет дельты)
  var baseMonthChannels = null;
  try {
    baseMonthChannels = getBaseMonthChannels();
    if (baseMonthChannels) {
      Logger.log('[readRetentionChannels] ★ Base month Channels (no delta): ' + baseMonthChannels);
    }
  } catch (e) {
    Logger.log('[readRetentionChannels] getBaseMonthChannels error: ' + e.message);
  }

  // ★ Хелпер: проверка базового месяца
  function isBaseMonthPeriod(monthKey) {
    if (!baseMonthChannels) return false;
    return (monthKey || '').toLowerCase() === baseMonthChannels.toLowerCase();
  }

  // ★ Хелпер: парсинг и форматирование дельты
  function parseDiffValue(rawDiff, monthKey) {
    // Базовый месяц — без дельты
    if (isBaseMonthPeriod(monthKey)) {
      return '';
    }
    
    if (rawDiff === null || rawDiff === undefined || rawDiff === '') {
      return '';
    }
    
    var parsedDiff = null;
    if (typeof rawDiff === 'number') {
      parsedDiff = rawDiff;
    } else if (typeof rawDiff === 'string') {
      var cleaned = String(rawDiff).replace(',', '.').replace('%', '').trim();
      parsedDiff = parseFloat(cleaned);
    }
    
    if (!isNaN(parsedDiff)) {
      // Если дельта уже в процентах (0.05 или 5) — нормализуем
      var pct = (Math.abs(parsedDiff) < 1 ? parsedDiff * 100 : parsedDiff).toFixed(2);
      return (parsedDiff >= 0 ? '+' : '') + pct + '%';
    } else {
      return String(rawDiff || '').trim();
    }
  }

  // Инициализируем только каналы, которые реально есть в конфиге
  var configChannels = getConfiguredChannelKeys();
  configChannels.forEach(function(ch) {
    channelsData.byChannel[ch] = { metrics: createEmptyChannelMetrics() };
  });

  var sheetsMap = new Map();
  channelsMonths.forEach(function(m) {
    var manualSheet = m.roleSheets ? m.roleSheets.channels : null;
    if (!manualSheet) {
      Logger.log('[readRetentionChannels] No channels sheet for ' + m.name + ', skipping');
      return;
    }
    var sheetName = manualSheet;
    if (!sheetsMap.has(sheetName)) sheetsMap.set(sheetName, []);
    sheetsMap.get(sheetName).push(m);
  });

  // ═══ ЕДИНСТВЕННЫЙ ЦИКЛ ОБРАБОТКИ ЛИСТОВ ═══
  sheetsMap.forEach(function(months, sheetName) {
    if (!isSheetEnabled(sheetName)) {
      Logger.log('[readRetentionChannels] Sheet DISABLED: ' + sheetName);
      return;
    }

    var sheet = findSheetSmart(ss, sheetName);
    if (!sheet) {
      Logger.log('[readRetentionChannels] Лист не найден: ' + sheetName);
      return;
    }

    var data = sheet.getDataRange().getValues();
    if (data.length < 3) return;

    // Автоопределение строки с месяцами
    var headerRow = data[1];
    var dataStartRow = 2;

    var monthsInRow0 = 0;
    var monthsInRow1 = 0;

    for (var c = 0; c < Math.min(data[0].length, 20); c++) {
      if (isMonthName(data[0][c])) monthsInRow0++;
      if (data[1] && isMonthName(data[1][c])) monthsInRow1++;
    }

    if (monthsInRow0 > monthsInRow1) {
      headerRow = data[0];
      dataStartRow = 1;
      Logger.log('[readRetentionChannels] Months found in Row 1');
    } else {
      Logger.log('[readRetentionChannels] Months found in Row 2');
    }

    // Парсим месяцы из заголовка
    var sheetMonths = [];
    for (var col = 2; col < headerRow.length; col++) {
      var cellValue = String(headerRow[col] || '').trim();
      if (isMonthName(cellValue)) {
        sheetMonths.push({
          name: cellValue.toLowerCase(),
          valueCol: col,
          diffCol: col + 1 < headerRow.length ? col + 1 : null
        });
      }
    }

    Logger.log('Лист: ' + sheetName + ', найдено месяцев: ' + sheetMonths.length);

    // ═══ МАППИНГ МЕСЯЦЕВ ═══
    var targetIndices = [];
    months.forEach(function(targetMonth) {
      var targetNameLower = targetMonth.nameOnly.toLowerCase();
      var sheetMonth = sheetMonths.find(function(sm) { return sm.name.startsWith(targetNameLower); });

      if (sheetMonth) {
        var resultIndex = channelsMonths.findIndex(function(am) { return am.key === targetMonth.key; });
        if (resultIndex !== -1) {
          targetIndices.push({
            resultIndex: resultIndex,
            valueCol: sheetMonth.valueCol,
            diffCol: sheetMonth.diffCol,
            monthKey: targetMonth.key,
            monthName: targetMonth.name,
            year: targetMonth.year,
            sheetName: sheetName
          });
          
          // ★ Логируем если это базовый месяц
          if (isBaseMonthPeriod(targetMonth.key)) {
            Logger.log('[readRetentionChannels] ★ BASE MONTH detected: ' + targetMonth.name + ' — delta will be skipped');
          } else {
            Logger.log('Маппинг: ' + targetMonth.name + ' -> col ' + sheetMonth.valueCol);
          }
        }
      }
    });

    if (targetIndices.length === 0) {
      Logger.log('Не удалось сопоставить месяцы для листа ' + sheetName);
      return;
    }

    // ═══ ЧИТАЕМ ДАННЫЕ ПО КАНАЛАМ ═══
    var currentChannel = null;

    for (var i = dataStartRow; i < data.length; i++) {
      var row = data[i];
      var colA = String(row[0] || '').trim();
      var colB = String(row[1] || '').trim();

      // Определяем текущий канал
      if (colA) {
        // ═══ "Total вверху" — псевдо-канал для KPI шапки ═══
        if (isTotalTopRow(colA)) {
          if (!channelsData.byChannel['total']) {
            channelsData.byChannel['total'] = { metrics: createEmptyChannelMetrics() };
          }
          if (typeof CHANNEL_META !== 'undefined' && !CHANNEL_META['total']) {
            CHANNEL_META['total'] = { name: 'Total', icon: '📊' };
          }
          currentChannel = 'total';
          Logger.log('[readRetentionChannels] Total Top section found: ' + colA);

          // ═══ Если в этой же строке colB содержит метрику — обработать сразу ═══
          if (colB) {
            var inlineMetricKey = normalizeChannelMetric(colB, 'total');
            if (inlineMetricKey) {
              if (!channelsData.byChannel['total'].metrics[inlineMetricKey]) {
                channelsData.byChannel['total'].metrics[inlineMetricKey] = createEmptyMonthlySeries();
              }
              if (!channelsData.byChannel['total'].metricLabels) {
                channelsData.byChannel['total'].metricLabels = {};
              }
              if (!channelsData.byChannel['total'].metricLabels[inlineMetricKey]) {
                channelsData.byChannel['total'].metricLabels[inlineMetricKey] = colB;
              }

              var inlineSeries = channelsData.byChannel['total'].metrics[inlineMetricKey];
              targetIndices.forEach(function(idx) {
                while (inlineSeries.values.length <= idx.resultIndex) {
                  inlineSeries.values.push(null);
                  inlineSeries.diffs.push(null);
                }
                var rawValue = idx.valueCol < row.length ? row[idx.valueCol] : 0;
                inlineSeries.values[idx.resultIndex] = parseNumber(rawValue);
                
                // ★ Используем хелпер для дельты
                if (idx.diffCol !== null && idx.diffCol < row.length) {
                  inlineSeries.diffs[idx.resultIndex] = parseDiffValue(row[idx.diffCol], idx.monthKey);
                }
              });
              Logger.log('[readRetentionChannels] Total inline metric: ' + colB + ' → ' + inlineMetricKey);
            }
          }
          continue; // Строка полностью обработана

        } else if (isSummaryChannelRow(colA)) {
          Logger.log('[readRetentionChannels] Skipping summary row: ' + colA);
          currentChannel = null;
          continue;

        } else {
          var normalized = normalizeChannelName(colA);
          if (normalized && normalized !== 'total') {
            if (!channelsData.byChannel[normalized]) {
              channelsData.byChannel[normalized] = { metrics: createEmptyChannelMetrics() };
              Logger.log('[readRetentionChannels] Auto-created channel: ' + normalized);
            }
            currentChannel = normalized;
          }
        }
      }

      if (!currentChannel) continue;

      // Определяем метрику
      var metricRawName = '';
      if (colB) {
        var colAIsChannel = colA && normalizeChannelName(colA);
        if (colAIsChannel || !colA) {
          metricRawName = colB;
        } else {
          metricRawName = colA;
        }
      } else if (colA && !normalizeChannelName(colA)) {
        metricRawName = colA;
      }

      if (!metricRawName) continue;

      var metricKey = normalizeChannelMetric(metricRawName, currentChannel);
      if (!metricKey) continue;

      // Создаём метрику если не существует
      if (!channelsData.byChannel[currentChannel].metrics[metricKey]) {
        channelsData.byChannel[currentChannel].metrics[metricKey] = createEmptyMonthlySeries();
      }

      // ═══ СОХРАНЯЕМ ОРИГИНАЛЬНОЕ НАЗВАНИЕ ═══
      if (!channelsData.byChannel[currentChannel].metricLabels) {
        channelsData.byChannel[currentChannel].metricLabels = {};
      }
      if (!channelsData.byChannel[currentChannel].metricLabels[metricKey]) {
        channelsData.byChannel[currentChannel].metricLabels[metricKey] = metricRawName;
      }

      var series = channelsData.byChannel[currentChannel].metrics[metricKey];

      // Заполняем данные для каждого месяца
      targetIndices.forEach(function(idx) {
        while (series.values.length <= idx.resultIndex) {
          series.values.push(null);
          series.diffs.push(null);
        }

        var actualSheetName = idx.sheetName || sheetName;
        var isEnabledForThisMonth = isChannelMetricEnabledForPeriod(
          actualSheetName,
          idx.monthKey,
          currentChannel,
          metricRawName
        );

        // ★ DEBUG: логируем решение для каждой метрики
        Logger.log('[SYNC_DEBUG] channel=' + currentChannel +
          ' metric=' + metricKey + '(' + metricRawName + ')' +
          ' sheet=' + actualSheetName +
          ' month=' + idx.monthKey +
          ' enabled=' + isEnabledForThisMonth);

        if (!isEnabledForThisMonth) {
          series.values[idx.resultIndex] = null;
          series.diffs[idx.resultIndex] = null;
          return;
        }

        var rawValue = idx.valueCol < row.length ? row[idx.valueCol] : 0;
        series.values[idx.resultIndex] = parseNumber(rawValue);

        // ★ Используем хелпер для дельты
        if (idx.diffCol !== null && idx.diffCol < row.length) {
          series.diffs[idx.resultIndex] = parseDiffValue(row[idx.diffCol], idx.monthKey);
        }
      });
    }
  });

  channelsData.months = channelsMonths.map(function(m) { return m.name; });
  return channelsData;
}