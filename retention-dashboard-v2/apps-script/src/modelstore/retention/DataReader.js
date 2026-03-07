/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATAREADER.js - SHARED утилиты чтения + оркестратор (RETENTION)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (SHARED)                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Получить ID таблицы Retention
 */
function getRetentionSpreadsheetId() {
  try {
    var sources = getActiveDataSources();
    var retention = sources.find(function(s) { return s.name === 'Retention'; });
    if (retention && retention.spreadsheetId) return retention.spreadsheetId;
  } catch (e) { }
  return (CONFIG && CONFIG.SOURCE_SPREADSHEET_ID) || '1e-Z4_bvD9v8Ki7nXfUfDA5hO-m-tN0n_Ps9EJpGPQKQ';
}

function setValueByPath(obj, path, value) {
  var parts = path.split('.');
  var current = obj;
  for (var i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function getSeriesByPath(obj, path) {
  var parts = path.split('.');
  var current = obj;
  for (var i = 0; i < parts.length; i++) {
    current = current[parts[i]];
  }
  return current;
}

function isMonthName(title) {
  if (!title) return false;
  var t = String(title).trim().toLowerCase();
  return ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
          'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
    .some(function(m) { return t.startsWith(m); });
}

function isDeltaColumn(title) {
  if (!title) return false;
  var t = String(title).trim().toLowerCase();
  
  // Пустая строка после месяца — это diff колонка
  if (t === '') return false; // Пустые обрабатываем отдельно
  
  // Явные маркеры дельты
  if (t.includes('δ') || t.includes('дельта') || t.includes('delta')) return true;
  if (t.includes('%') || t.includes('diff') || t.includes('изм')) return true;
  
  // Начинается с + или - и цифры
  if (/^[+-]?\d/.test(t)) return true;
  
  return false;
}

function createMonthDescriptors(headerRow, startColIndex) {
  var months = [];
  var col = startColIndex || 1;
  
  while (col < headerRow.length) {
    var title = String(headerRow[col] || '').trim();
    
    // Пропускаем пустые ячейки
    if (!title) { 
      col++; 
      continue; 
    }
    
    // Пропускаем колонки с дельтой/процентами
    if (isDeltaColumn(title)) { 
      col++; 
      continue; 
    }
    
    // Проверяем: это месяц?
    if (!isMonthName(title)) { 
      col++; 
      continue; 
    }
    
    // Нашли месяц! Ищем колонку с diff (следующая колонка)
    var diffCol = null;
    if (col + 1 < headerRow.length) {
      var nextTitle = String(headerRow[col + 1] || '').trim();
      // Следующая колонка — diff, если она пустая или содержит дельту, или НЕ месяц
      if (!nextTitle || isDeltaColumn(nextTitle) || !isMonthName(nextTitle)) {
        diffCol = col + 1;
      }
    }

    months.push({ 
      name: title, 
      valueCol: col, 
      diffCol: diffCol 
    });
    
    // Переходим к следующей колонке после diff (или после value если diff нет)
    col = diffCol !== null ? diffCol + 1 : col + 1;
  }
  
  Logger.log('[createMonthDescriptors] Found ' + months.length + ' months: ' + 
    months.map(function(m) { return m.name + '(col:' + m.valueCol + ')'; }).join(', '));
  
  return months;
}

function readMonthlySeriesRow(rowIndex, data, months) {
  var series = createEmptyMonthlySeries();
  var row = data[rowIndex] || [];
  for (var i = 0; i < months.length; i++) {
    var m = months[i];
    var val = m.valueCol < row.length ? row[m.valueCol] : '';
    series.values.push(parseNumber(val || 0));
    series.diffs.push(m.diffCol != null && m.diffCol < row.length ? String(row[m.diffCol] || '').trim() : '');
  }
  return series;
}

/**
 * Умный поиск листа с вариациями названия
 */
function findSheetSmart(ss, targetName) {
  var sheet = ss.getSheetByName(targetName);
  if (sheet) return sheet;

  var variants = [
    targetName,
    targetName.replace(/\s*-\s*/g, ' '),
    targetName.replace(/\s+/g, ' '),
    targetName.replace(/\s*-\s*(\d{4})/, ' $1'),
    targetName.replace(/\s(\d{4})/, ' - $1')
  ];

  for (var i = 0; i < variants.length; i++) {
    sheet = ss.getSheetByName(variants[i]);
    if (sheet) {
      Logger.log('[findSheetSmart] Found "' + targetName + '" as "' + variants[i] + '"');
      return sheet;
    }
  }

  return null;
}

/**
 * Проверяет, является ли строка секцией "Total вверху" (источник KPI шапки Channels)
 */
function isTotalTopRow(name) {
  var n = String(name || '').trim().toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/["'""]/g, '')
    .replace(/\s+/g, ' ');
  return n === 'total вверху' || n === 'total top' || n === 'итого вверху';
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                   СБОР ВСЕХ ДАННЫХ (ОРКЕСТРАТОР)                          ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Сбор всех данных Retention для конкретного источника
 */
function collectRetentionData(sourceConfig) {
  if (!sourceConfig) {
    var sources = getActiveDataSourcesV3();
    sourceConfig = sources.find(function(s) { return s.template === 'Retention'; });
  }

  var data = createEmptyRetentionData();

  // Finance — из DataReader_Finance.js
  data.finance = readRetentionFinance(sourceConfig);
  // Channels — из DataReader_Channels.js
  data.channels = readRetentionChannels(sourceConfig);

  return data;
}

/**
 * Отладочная функция
 */
function debugRetentionData() {
  Logger.log('========== DEBUG RETENTION DATA ==========');

  try {
    var sources = getActiveDataSourcesV3();
    var retentionSource = sources.find(function(s) { return s.template === 'Retention'; });

    if (!retentionSource) {
      Logger.log('❌ Retention source not found!');
      Logger.log('Available sources: ' + sources.map(function(s) { return s.name; }));
      return null;
    }

    Logger.log('✅ Source: ' + retentionSource.name);
    Logger.log('   ID: ' + retentionSource.spreadsheetId);

    var data = collectRetentionData(retentionSource);

    Logger.log('\n--- FINANCE ---');
    Logger.log('Months: ' + JSON.stringify(data.finance.months));
    Logger.log('Deposits Count: ' + JSON.stringify(data.finance.series.totalDepositsCount.values));
    Logger.log('Deposits Amount: ' + JSON.stringify(data.finance.series.totalDepositsAmount.values));
    Logger.log('Profit: ' + JSON.stringify(data.finance.series.totalProfit.values));

    Logger.log('\n--- CHANNELS ---');
    Logger.log('Months: ' + JSON.stringify(data.channels.months));
    Logger.log('Channels: ' + Object.keys(data.channels.byChannel).join(', '));

    if (data.channels.byChannel.push) {
      Logger.log('\nPush metrics:');
      Object.keys(data.channels.byChannel.push.metrics).forEach(function(metric) {
        Logger.log('  ' + metric + ': ' + JSON.stringify(data.channels.byChannel.push.metrics[metric].values));
      });
    }

    return data;
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log(e.stack);
    return null;
  }
}