/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MetricsConfigManager_Channels.js - Конфиг канальных метрик
 *  Tab: Ret. CHANNEL METRICS
 *
 *  Парсинг листа CHANNEL METRICS + API проверок isChannelMetric*()
 *  + CHANNEL_META (глобальный реестр каналов)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    CHANNEL META (ГЛОБАЛЬНЫЙ РЕЕСТР)                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

var CHANNEL_META_DEFAULTS = {
  mail:          { name: 'E-mail',            icon: '📧' },
  push:          { name: 'App Push',          icon: '🔔' },
  webpush:       { name: 'Web-Push',          icon: '🌐' },
  sms:           { name: 'SMS',               icon: '📱' },
  tg:            { name: 'Telegram',          icon: '✈️' },
  wa:            { name: 'WhatsApp',          icon: '💬' },
  popup:         { name: 'Pop-up',            icon: '🪟' },
  ai:            { name: 'AI',                icon: '🤖' },
  call_center:   { name: 'Call Center',       icon: '📞' },
  reactivation:  { name: 'Reactivation Team', icon: '♻️' }
};

var CHANNEL_META = CHANNEL_META || JSON.parse(JSON.stringify(CHANNEL_META_DEFAULTS));

// ✅ Глобальный словарь UI-лейблов подметрик: CHANNEL_METRIC_LABELS[channelKey][metricKey] = uiName
var CHANNEL_METRIC_LABELS = CHANNEL_METRIC_LABELS || {};

/**
 * Обновляет CHANNEL_META из конфига CHANNEL METRICS (названия каналов из таблицы)
 * И ДОПОЛНИТЕЛЬНО заполняет CHANNEL_METRIC_LABELS для подметрик (UI labels)
 */
function refreshChannelMetaFromConfig() {
  try {
    var config = loadMetricsConfig();
    var channelByYear = config.channelByYear || {};
    var years = Object.keys(channelByYear);
    if (years.length === 0) return;

    years.sort();
    var lastYear = years[years.length - 1];
    var channels = channelByYear[lastYear] || {};

    // Собираем ВСЕ известные названия метрик (подметрик) из CHANNEL_METRIC_MAP
    // чтобы отличать "название канала" от "название метрики"
    var knownMetricNames = {};
    if (typeof CHANNEL_METRIC_MAP !== 'undefined') {
      Object.keys(CHANNEL_METRIC_MAP).forEach(function(k) {
        knownMetricNames[k.toLowerCase()] = true;
      });
    }
    // Дополняем из листа: все подметрики всех каналов
    var allSubMetricNames = [
      'sent', 'delivered', 'delivery rate', 'opened', 'open rate',
      'click', 'clicked', 'clicks', 'click rate',
      'conversions', 'conversion', 'converted', 'conversion rate', 'convert rate',
      'calls', 'success calls', 'success rate',
      'interested on call', 'interested rate',
      'contacts', 'reply', 'reply rate',
      'reactivations', 'reactivation rate', 'reactivated sum',
      'total contacts', 'total conversions', 'total conversion rate', 'total clicks'
    ];
    allSubMetricNames.forEach(function(name) {
      knownMetricNames[name.toLowerCase()] = true;
    });

    Object.keys(channels).forEach(function(channelKey) {
      if (!CHANNEL_META[channelKey]) return;
      var metricMap = channels[channelKey] || {};

      Logger.log('[refreshChannelMeta] Processing channel: ' + channelKey + 
        ', metricMap keys: ' + Object.keys(metricMap || {}).join(', '));

      var metricKeys = Object.keys(metricMap);
      for (var i = 0; i <metricKeys.length; i++) {
        var mk = metricKeys[i];
        if (mk === '__channel__') continue;

        var cfg = metricMap[mk];
        if (!cfg || !cfg.name) continue;

        // Проверяем: нормализуется ли имя в тот же channelKey?
        var headerKey = normalizeChannelKeyForConfig(cfg.name);
        if (headerKey !== channelKey) continue;

        // Проверяем: это название КАНАЛА, а не подметрики?
        var nameLower = cfg.name.toLowerCase().trim();
        if (knownMetricNames[nameLower]) {
          // Это подметрика (Reactivation Rate, Reactivations, etc.) — пропускаем
          continue;
        }

        // Прошло все проверки — это название канала
        CHANNEL_META[channelKey].name = cfg.name;
        Logger.log('[refreshChannelMetaFromConfig] Updated ' + channelKey + ' → "' + cfg.name + '"');
        break; // Берём только первое совпадение
      }
      
      // Если ничего не обновили — логируем
      if (CHANNEL_META[channelKey].name === CHANNEL_META_DEFAULTS[channelKey].name) {
        Logger.log('[refreshChannelMetaFromConfig] NOT updated ' + channelKey + ', stayed: "' + CHANNEL_META[channelKey].name + '"');
      }

      // ───────────── 2) Обновляем ИМЕНА ПОДМЕТРИК (UI для Sent/Open Rate/...) ─────────────
      CHANNEL_METRIC_LABELS[channelKey] = CHANNEL_METRIC_LABELS[channelKey] || {};

      metricKeys.forEach(function(mk) {
        if (mk === '__channel__') return;
        var cfg = metricMap[mk];
        if (!cfg) return;
        if (typeof cfg !== 'object' || !cfg.name) return;

        var nameLower = String(cfg.name || '').toLowerCase().trim();
        if (!nameLower) return;
        if (!knownMetricNames[nameLower]) {
          // Это не подметрика (скорее всего, заголовок канала), пропускаем
          return;
        }

        var internalKey = null;
        try {
          internalKey = (typeof normalizeChannelMetric === 'function')
            ? normalizeChannelMetric(cfg.name, channelKey)
            : null;
        } catch(e) {
          Logger.log('[refreshChannelMetaFromConfig] normalizeChannelMetric error: ' + e.message);
          return;
        }

        if (!internalKey) return;

        // Сохраняем UI label, если ещё не был задан
        if (!CHANNEL_METRIC_LABELS[channelKey][internalKey]) {
          CHANNEL_METRIC_LABELS[channelKey][internalKey] = cfg.name;
          Logger.log('[refreshChannelMetaFromConfig] Metric label for ' + channelKey + '.' + internalKey + ' → "' + cfg.name + '"');
        }
      });
    });
  } catch (e) {
    Logger.log('[refreshChannelMetaFromConfig] Error: ' + e.message);
  }
}

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
    if (result.length > 0) return result;
  } catch (e) {
    Logger.log('[getConfiguredChannelKeys] Error: ' + e.message);
  }
  
  // Фолбэк: дефолтный список
  return ['mail', 'push', 'webpush', 'sms', 'tg', 'wa', 'popup', 'ai', 'call_center', 'reactivation'];
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ПОИСК ЛИСТА                                            ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function getChannelMetricsSheet(ss) {
  return getSheetByAliases(ss, [
    SHEETS.CHANNEL_METRICS,
    'CHANNEL METRICS',
    '📣 CHANNEL METRICS',
    'Ret. CHANNEL METRICS'
  ]);
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    НОРМАЛИЗАЦИЯ КАНАЛОВ                                   ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function normalizeChannelKeyForConfig(name) {
  var raw = String(name || '').trim().toLowerCase();
  if (!raw) return '';

  var n = raw
    .replace(/[\r\n]+/g, ' ')
    .replace(/["'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Для известных алиасов можно пробовать и вариант без цифр
  var noDigits = n.replace(/\d+$/g, '').trim();

  var map = {
    'mail': 'mail', 'email': 'mail', 'e-mail': 'mail', 'e mail': 'mail',
    'push': 'push', 'app push': 'push', 'app-push': 'push',
    'web-push': 'webpush', 'web push': 'webpush', 'webpush': 'webpush',
    'sms': 'sms',
    'tg': 'tg', 'telegram': 'tg',
    'wa': 'wa', 'whatsapp': 'wa', 'whats app': 'wa',
    'popup': 'popup', 'pop-up': 'popup', 'pop up': 'popup',
    'ai': 'ai', 'ai calls': 'ai', 'ai call': 'ai',
    'call center': 'call_center', 'call-center': 'call_center', 'callcenter': 'call_center',
    'reactivation': 'reactivation', 'reactivation team': 'reactivation'
  };

  // 1) Сначала точное имя
  if (map[n]) return map[n];

  // 2) Потом вариант без цифр (НО только если он стал известным алиасом)
  if (map[noDigits]) return map[noDigits];

  if (n.indexOf('reactivation') !== -1 || noDigits.indexOf('reactivation') !== -1) return 'reactivation';

  // "total вверху" — псевдо-канал для KPI шапки
  if (n === 'total вверху' || n === 'total top' || n === 'итого вверху') return 'total';

  // остальные "total..." — не канал
  if (n.indexOf('total') === 0 || noDigits.indexOf('total') === 0) return '';

  // Защита: известные подметрики — не каналы
  var knownMetrics = [
    'sent', 'delivered', 'delivery rate', 'opened', 'open rate',
    'click', 'clicked', 'clicks', 'click rate',
    'conversions', 'conversion', 'converted', 'conversion rate', 'convert rate',
    'calls', 'success calls', 'success rate',
    'interested on call', 'interested rate',
    'contacts', 'reply', 'reply rate',
    'reactivations', 'reactivation rate', 'reactivated sum'
  ];
  if (knownMetrics.indexOf(n) !== -1 || knownMetrics.indexOf(noDigits) !== -1) return '';

  // ✅ Для неизвестных каналов цифры сохраняем (Test1 → test1)
  var autoKey = n.replace(/[^a-zа-яё0-9]+/g, '_').replace(/^_|_$/g, '');
  if (autoKey) {
    Logger.log('[normalizeChannelKeyForConfig] Auto-key: "' + name + '" → ' + autoKey);
    return autoKey;
  }

  return '';
}

function normalizeChannelMetricName(name) {
  // ✅ ВАЖНО: цифры НЕ отрезаем (Total Contacts1 ≠ Total Contacts)
  var raw = String(name || '').trim().toLowerCase().trim();

  return raw
    .replace(/[%()]/g, ' ')
    .replace(/[^a-zа-яё0-9\s_-]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function getChannelMetricNameCandidates(name) {
  var raw = String(name || '').trim();
  if (!raw) return [];

  var base = normalizeChannelMetricName(raw);              // с цифрами
  var baseNoDigits = base.replace(/\d+$/g, '').trim();     // без цифр (fallback)
  var compact = base.replace(/\s+/g, '');
  var compactNoDigits = baseNoDigits.replace(/\s+/g, '');

  var out = [];
  function add(v) {
    var n = normalizeChannelMetricName(v);
    if (!n) return;
    if (out.indexOf(n) === -1) out.push(n);
  }

  // 1) приоритет: как есть (с цифрами)
  add(raw.toLowerCase());
  add(base);
  add(compact);

  // 2) fallback: без цифр (для старых конфигов)
  if (baseNoDigits && baseNoDigits !== base) {
    add(baseNoDigits);
    add(compactNoDigits);
  }

  if (/[a-z][A-Z]/.test(raw)) {
    var spaced = raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    add(spaced);
  }

  return out;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ПАРСИНГ ЛИСТА CHANNEL METRICS                          ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function parseChannelMetricsSheetConfig(sheet) {
  var result = { byYear: {}, sheetByYear: {} };
  if (!sheet) return result;

  var data = sheet.getDataRange().getDisplayValues();
  if (!data || data.length < 3) return result;

  var resolved = resolveYearBlocksFromSheetData(data);
  var blocks = resolved.blocks || [];
  var dataStart = resolved.dataStartRowIndex;
  if (!blocks.length) return result;
  var channelStateByYear = {};

  // Уровень 1: "Включить лист" (sheet-level toggle)
  for (var sr = 0; sr < data.length; sr++) {
    var sheetRow = data[sr] || [];
    var sheetRowName = String(sheetRow[0] || sheetRow[1] || '').trim();
    if (!isEnableSheetRowName(sheetRowName)) continue;

    blocks.forEach(function (b) {
      var yearStatus = parseOnOff(sheetRow[b.statusCol], true);
      var yearFlag = getYearBlockFlag(sheetRow, b, true);
      var enabledForYear = !!(yearStatus && yearFlag);

      var monthMap = {};
      b.monthCols.forEach(function (m) {
        monthMap[m.periodKey] = enabledForYear && parseMonthFlagWithDefault(sheetRow[m.col], true);
      });

      result.sheetByYear[b.year] = {
        enabled: enabledForYear,
        months: monthMap
      };
    });

    break;
  }

  var currentChannelKey = '';
  for (var r = dataStart; r < data.length; r++) {
    var row = data[r] || [];
    var nameColA = String(row[0] || '').trim();
    var nameColB = String(row[1] || '').trim();
    var name = nameColA || nameColB;
    if (!name) continue;
    if (isEnableSheetRowName(name)) continue;

    var maybeChannelKey = normalizeChannelKeyForConfig(nameColA);

    // ✅ Динамические каналы разрешены: если ключ получился — это channel-row
    var isChannelRow = !!maybeChannelKey;

    if (isChannelRow) {
      currentChannelKey = maybeChannelKey;

      // ✅ гарантируем мету для динамического канала
      if (typeof CHANNEL_META !== 'undefined' && !CHANNEL_META[currentChannelKey]) {
        CHANNEL_META[currentChannelKey] = { name: nameColA || currentChannelKey, icon: '📊' };
        Logger.log('[parseChannelMetricsSheetConfig] Auto-created CHANNEL_META[' + currentChannelKey + '] = "' + (nameColA || '') + '"');
      }

      if (!channelStateByYear[currentChannelKey]) channelStateByYear[currentChannelKey] = {};

      blocks.forEach(function (b) {
        var sheetState = result.sheetByYear[b.year] || { enabled: true, months: {} };
        var yearStatus = parseOnOff(row[b.statusCol], true);
        var yearFlag = getYearBlockFlag(row, b, true);
        var enabledForYear = !!(sheetState.enabled && yearStatus && yearFlag);

        var monthMap = {};
        b.monthCols.forEach(function (m) {
          var sheetMonthEnabled = sheetState.months[m.periodKey];
          if (sheetMonthEnabled === undefined) sheetMonthEnabled = true;
          monthMap[m.periodKey] = enabledForYear && sheetMonthEnabled && parseMonthFlagWithDefault(row[m.col], true);
        });

        channelStateByYear[currentChannelKey][b.year] = {
          enabled: enabledForYear,
          months: monthMap
        };

        if (!result.byYear[b.year]) result.byYear[b.year] = {};
        if (!result.byYear[b.year][currentChannelKey]) result.byYear[b.year][currentChannelKey] = {};

        result.byYear[b.year][currentChannelKey].__channel__ = {
          name: '__channel__',
          enabled: enabledForYear,
          months: monthMap
        };

        var channelMetricNorm = normalizeChannelMetricName(name);
        result.byYear[b.year][currentChannelKey][channelMetricNorm] = {
          name: name,
          enabled: enabledForYear,
          months: monthMap
        };
      });

      continue;
    }

    var hasSignalsAnyYear = blocks.some(function (b) {
      if (row[b.statusCol] !== '' && row[b.statusCol] !== undefined) return true;
      if (b.yearCol != null && row[b.yearCol] !== '' && row[b.yearCol] !== undefined) return true;
      if (b.groupStartCol != null && row[b.groupStartCol] !== '' && row[b.groupStartCol] !== undefined) return true;
      return b.monthCols.some(function (m) { return row[m.col] !== '' && row[m.col] !== undefined; });
    });

    if (!hasSignalsAnyYear) continue;

    if (!currentChannelKey) continue;

    var metricName = name;
    var metricNorm = normalizeChannelMetricName(metricName);

    blocks.forEach(function (b) {
      var sheetState = result.sheetByYear[b.year] || { enabled: true, months: {} };
      var yearStatus = parseOnOff(row[b.statusCol], true);
      var yearFlag = getYearBlockFlag(row, b, true);
      var enabledForYear = !!(sheetState.enabled && yearStatus && yearFlag);

      var channelYearState =
        channelStateByYear[currentChannelKey] && channelStateByYear[currentChannelKey][b.year]
          ? channelStateByYear[currentChannelKey][b.year]
          : { enabled: true, months: {} };

      var finalYearEnabled = !!(channelYearState.enabled && enabledForYear);

      if (!result.byYear[b.year]) result.byYear[b.year] = {};
      if (!result.byYear[b.year][currentChannelKey]) result.byYear[b.year][currentChannelKey] = {};

      result.byYear[b.year][currentChannelKey][metricNorm] = {
        name: metricName,
        enabled: finalYearEnabled,
        months: {}
      };

      b.monthCols.forEach(function (m) {
        var metricMonthEnabled = parseMonthFlag(row[m.col]);
        var channelMonthEnabled = channelYearState.months[m.periodKey];
        if (channelMonthEnabled === undefined) channelMonthEnabled = true;
        var sheetMonthEnabled = sheetState.months[m.periodKey];
        if (sheetMonthEnabled === undefined) sheetMonthEnabled = true;

        result.byYear[b.year][currentChannelKey][metricNorm].months[m.periodKey] =
          finalYearEnabled && sheetMonthEnabled && channelMonthEnabled && metricMonthEnabled;
      });
    });
  }

  return result;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    API ПРОВЕРОК CHANNELS                                   ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Проверить, включена ли подметрика канала (глобально)
 */
function isChannelMetricEnabled(sheetName, channelKey, metricOriginalName) {
  var config = loadMetricsConfig();
  var metricCandidates = getChannelMetricNameCandidates(metricOriginalName);
  var metricCandidatesCompact = metricCandidates.map(function (m) { return m.replace(/\s+/g, ''); });

  var year = extractYearFromSheetName(sheetName || '');
  var byYear = config.channelByYear || {};
  if (year && byYear[year] && byYear[year][channelKey]) {
    var yearMetricMap = byYear[year][channelKey] || {};
    for (var c = 0; c < metricCandidates.length; c++) {
      var metricCfg = yearMetricMap[metricCandidates[c]];
      if (metricCfg) {
        return metricCfg.enabled !== false;
      }
    }

    var yearMetricKeys = Object.keys(yearMetricMap);
    for (var yk = 0; yk < yearMetricKeys.length; yk++) {
      var keyCompact = String(yearMetricKeys[yk] || '').replace(/\s+/g, '');
      if (metricCandidatesCompact.indexOf(keyCompact) !== -1) {
        return yearMetricMap[yearMetricKeys[yk]].enabled !== false;
      }
    }

    if (yearMetricMap.__channel__) {
      return yearMetricMap.__channel__.enabled !== false;
    }
  }

  // Per-sheet настройка (точное совпадение)
  if (config.channels[sheetName] &&
    config.channels[sheetName][channelKey] &&
    config.channels[sheetName][channelKey][metricOriginalName] !== undefined) {
    var result = config.channels[sheetName][channelKey][metricOriginalName].show !== false;
    Logger.log('[isChannelMetricEnabled] EXACT MATCH: ' + sheetName + ' -> ' + channelKey + '.' + metricOriginalName + ' = ' + result);
    return result;
  }

  // Нормализованный поиск
  var normalizedInput = normalizeSheetNameForCompare(sheetName);
  var sheetKeys = Object.keys(config.channels);
  for (var i = 0; i < sheetKeys.length; i++) {
    if (normalizeSheetNameForCompare(sheetKeys[i]) === normalizedInput) {
      var foundSheet = sheetKeys[i];
      if (config.channels[foundSheet][channelKey] &&
        config.channels[foundSheet][channelKey][metricOriginalName] !== undefined) {
        var result2 = config.channels[foundSheet][channelKey][metricOriginalName].show !== false;
        Logger.log('[isChannelMetricEnabled] NORMALIZED MATCH: "' + sheetName + '" -> "' + foundSheet + '" -> ' + channelKey + '.' + metricOriginalName + ' = ' + result2);
        return result2;
      }
    }
  }

  // Фолбэк: глобальная настройка
  if (config.channels['__global__'] &&
    config.channels['__global__'][channelKey] &&
    config.channels['__global__'][channelKey][metricOriginalName] !== undefined) {
    return config.channels['__global__'][channelKey][metricOriginalName].show !== false;
  }

  // Фолбэк: плоский формат
  if (config.channels[channelKey] &&
    config.channels[channelKey][metricOriginalName] !== undefined) {
    return config.channels[channelKey][metricOriginalName].show !== false;
  }

  Logger.log('[isChannelMetricEnabled] NOT FOUND (default=true): ' + sheetName + ' -> ' + channelKey + '.' + metricOriginalName);
  return true;
}

function shouldTraceChannelMetricDecision(sheetName, channelKey, metricOriginalName) {
  var year = extractYearFromSheetName(sheetName || '');
  if (year !== '2025') return false;
  if (String(channelKey || '').toLowerCase() !== 'push') return false;

  var candidates = getChannelMetricNameCandidates(metricOriginalName);
  var compact = candidates.map(function (c) { return String(c || '').replace(/\s+/g, ''); });
  return compact.indexOf('sent') !== -1 || compact.indexOf('send') !== -1 || compact.indexOf('sends') !== -1;
}

function isChannelMetricEnabledForPeriod(sheetName, periodKey, channelKey, metricOriginalName) {
  // ═══ Total-метрики всегда включены (нет ON/OFF в настройках) ═══
  if (channelKey === 'total') return true;

  var config = loadMetricsConfig();
  var year = extractYearFromSheetName(sheetName || periodKey || '');

  Logger.log('[DEBUG isChannelMetricEnabledForPeriod] INPUT: sheet=' + sheetName +
    ', period=' + periodKey + ', channel=' + channelKey + ', metric=' + metricOriginalName);

  // ★ НОВОЕ: Логируем структуру метрик для этого канала
  if (config.channelByYear && config.channelByYear[year] && config.channelByYear[year][channelKey]) {
    var metricMap = config.channelByYear[year][channelKey];
    Logger.log('[DEBUG] Available metric keys for ' + channelKey + ':');
    Object.keys(metricMap).forEach(function(k) {
      if (k === '__channel__') return;
      var m = metricMap[k];
      Logger.log('  - "' + k + '" (name: "' + m.name + '", months: ' + JSON.stringify(m.months || {}) + ')');
    });
  }

  if (!config.channelByYear || !config.channelByYear[year]) {
    Logger.log('[DEBUG] No config for year: ' + year);
    return isChannelMetricEnabled(sheetName, channelKey, metricOriginalName);
  }

  if (!config.channelByYear[year][channelKey]) {
    Logger.log('[DEBUG] No config for channel: ' + channelKey + ' in year ' + year);
    return isChannelMetricEnabled(sheetName, channelKey, metricOriginalName);
  }

  var metricMap = config.channelByYear[year][channelKey];
  Logger.log('[DEBUG] Available metrics for ' + channelKey + ': ' + Object.keys(metricMap).join(', '));

  var metricCandidates = getChannelMetricNameCandidates(metricOriginalName);
  Logger.log('[DEBUG] Looking for candidates: ' + metricCandidates.join(', '));

  var metricCfg = null;
  for (var i = 0; i < metricCandidates.length; i++) {
    if (metricMap[metricCandidates[i]]) {
      metricCfg = metricMap[metricCandidates[i]];
      Logger.log('[DEBUG] Found metric config by key: ' + metricCandidates[i] + ', enabled=' + metricCfg.enabled);
      break;
    }
  }

  if (!metricCfg) {
    Logger.log('[DEBUG] Metric not found in config, fallback to channel level');
    var channelCfg = metricMap.__channel__;
    if (channelCfg && channelCfg.enabled === false) {
      Logger.log('[DEBUG] Channel is disabled, returning false');
      return false;
    }
    return true;
  }

  if (!metricCfg.enabled) {
    Logger.log('[DEBUG] Metric explicitly disabled');
    return false;
  }

  if (!periodKey || !metricCfg.months || metricCfg.months[periodKey] === undefined) {
    Logger.log('[DEBUG] No period override, returning: ' + metricCfg.enabled);
    return metricCfg.enabled;
  }

  var result = metricCfg.months[periodKey] === true;
  Logger.log('[DEBUG] Period ' + periodKey + ' value: ' + metricCfg.months[periodKey] + ', result=' + result);
  return result;
}

/**
 * Проверяет, включена ли метрика канала для КОНКРЕТНОГО месяца
 */
function isChannelMetricEnabledForMonth(monthName, channelKey, metricName) {
  var yearMatch = monthName.match(/\d{4}/);
  var year = yearMatch ? yearMatch[0] : '';

  if (!year) {
    Logger.log('[isChannelMetricEnabledForMonth] Не удалось определить год из: ' + monthName);
    return true;
  }

  var sheetName = 'Комуникация Total ' + year;
  var isEnabled = isChannelMetricEnabled(sheetName, channelKey, metricName);

  Logger.log('[isChannelMetricEnabledForMonth] ' + monthName + ' -> ' + channelKey + '.' + metricName + ' = ' + isEnabled);
  return isEnabled;
}