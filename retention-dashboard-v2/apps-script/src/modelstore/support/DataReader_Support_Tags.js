/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DataReader_Support_Tags.js — Чтение Tags Statistic
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Умное чтение Tags Statistic v3.0
 * Динамический поиск колонок по заголовкам
 */
function readTagsStatisticSmart(targetPeriod, spreadsheetId, sheetName) {
  const result = {
    tags: createEmptyTagsStatistic(),
    period: null,
    weeklyTotals: {}
  };

  try {
    const ssId = spreadsheetId || getSupportSpreadsheetId();
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log(`[readTagsStatisticSmart] Sheet "${sheetName}" not found`);
      return result;
    }
    
    Logger.log(`[readTagsStatisticSmart] Reading: "${sheetName}"`);
    
    const data = sheet.getDataRange().getValues();
    const displayData = sheet.getDataRange().getDisplayValues();
    
    // ═══ ДИНАМИЧЕСКИЙ ПОИСК ЗАГОЛОВКОВ (строка 2) ═══
    const headerRowIdx = 1; // Индекс 1 = строка 2
    const headerRow = data[headerRowIdx] || [];
    
    const localeColumns = {}; // { 'ALL': colIdx, 'RU': colIdx, ... }
    let categoryCol = 0;
    let tagCol = 1;
    let periodCol = -1;
    
    // Нормализация имени локали
    const normalizeLocaleName = (name) => {
      const n = String(name || '').trim().toUpperCase();
      if (!n) return null;
      
      if (n === 'ALL GEO' || n === 'ALL' || n === 'TOTAL') return 'ALL';
      if (n === 'CATEGORY' || n === 'КАТЕГОРИЯ') return null;
      if (n === 'TAGS' || n === 'TAG' || n === 'ТЕГ') return null;
      if (n === 'PERIOD' || n === 'ПЕРИОД') return null;
      
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
      
      for (const loc of knownLocales) {
        if (normalized === loc || normalized.startsWith(loc)) return loc;
      }
      
      return null;
    };
    
    // Сканируем заголовки
    for (let col = 0; col < headerRow.length; col++) {
      const header = String(headerRow[col] || '').trim();
      const headerLower = header.toLowerCase();
      
      if (headerLower === 'category' || headerLower === 'категория') {
        categoryCol = col;
      } else if (headerLower === 'tags' || headerLower === 'tag' || headerLower === 'тег') {
        tagCol = col;
      } else if (headerLower === 'period' || headerLower === 'период') {
        periodCol = col;
      } else {
        const localeKey = normalizeLocaleName(header);
        if (localeKey && !localeColumns[localeKey]) {
          localeColumns[localeKey] = col;
        }
      }
    }
    
    Logger.log(`[readTagsStatisticSmart] Category col: ${categoryCol}, Tag col: ${tagCol}`);
    Logger.log(`[readTagsStatisticSmart] Locale columns: ${JSON.stringify(localeColumns)}`);
    
    // ═══ НАХОДИМ БЛОК "TOTAL MONTH" ═══
    let totalMonthRow = -1;
    
    for (let i = 0; i < data.length; i++) {
      const cellA = String(data[i][0] || '').toLowerCase().trim();
      if (cellA.includes('total month')) {
        totalMonthRow = i;
        
        // ═══ ПАРСИМ ДАТЫ ПЕРИОДА ═══
        // ВСЕГДА используем targetPeriod как основной источник (он точнее)
        if (targetPeriod && targetPeriod.monthNum && targetPeriod.year) {
          var monthNum = targetPeriod.monthNum;
          var year = targetPeriod.year;
          var lastDay = new Date(year, monthNum, 0).getDate();
          var monthStr = String(monthNum).padStart(2, '0');
          
          result.period = {
            startDate: '01.' + monthStr,
            endDate: String(lastDay) + '.' + monthStr,
            monthNum: monthNum,
            year: year
          };
          
          Logger.log('[readTagsStatisticSmart] Period dates (from targetPeriod): ' + 
                     result.period.startDate + ' - ' + result.period.endDate);
        } else if (periodCol >= 0) {
          // Fallback: читаем из листа
          var startDateVal = displayData[i][periodCol] || '';
          var endDateVal = displayData[i][periodCol + 1] || '';
          
          if (startDateVal && startDateVal.indexOf('-') !== -1) {
            var parts = startDateVal.split('-');
            startDateVal = parts[0].trim();
            endDateVal = parts[1].trim();
          }
          
          result.period = {
            startDate: startDateVal,
            endDate: endDateVal
          };
          
          Logger.log('[readTagsStatisticSmart] Period dates (from sheet): ' + startDateVal + ' - ' + endDateVal);
        }
        
        Logger.log(`[readTagsStatisticSmart] Total Month at row ${i + 1}`);
        break;
      }
    }
    
    if (totalMonthRow === -1) {
      Logger.log('[readTagsStatisticSmart] Total Month not found');
      return result;
    }
    
    // ═══ ОПРЕДЕЛЯЕМ КОЛОНКУ ДЛЯ ДАННЫХ ═══
    // Проверяем настройку auto_calc_allgeo
    var autoCalcEnabled = true;
    try {
      var appSettings = getAppSettings();
      autoCalcEnabled = appSettings.supportAutoCalcAllGeo !== false;
    } catch (e) {
      Logger.log('[readTagsStatisticSmart] getAppSettings error, auto-calc ON by default');
    }

    const allGeoCol = localeColumns['ALL'];
    let useAllGeo = false;

    if (allGeoCol !== undefined) {
      // Проверяем есть ли данные в ALL GEO (строка после Total Month)
      const testRow = data[totalMonthRow + 1];
      if (testRow && parseNumber(testRow[allGeoCol]) > 0) {
        useAllGeo = true;
      }
    }

    // ✅ УЧЁТ НАСТРОЙКИ: Если auto_calc_allgeo = OFF — не используем ALL GEO
    if (!autoCalcEnabled) {
      useAllGeo = false;
      Logger.log('[readTagsStatisticSmart] Auto-calc disabled, ALL GEO will be empty');
    }

    Logger.log(`[readTagsStatisticSmart] Auto-calc: ${autoCalcEnabled}, Use ALL GEO: ${useAllGeo}`);

    // ═══ ФУНКЦИЯ ПОЛУЧЕНИЯ ЗНАЧЕНИЯ ИЗ СТРОКИ ═══
    const getRowValue = (rowIdx) => {
      if (rowIdx >= data.length) return 0;
      const row = data[rowIdx];
      
      if (useAllGeo && allGeoCol !== undefined) {
        return parseNumber(row[allGeoCol]);
      }
      
      // ✅ НОВОЕ: Если auto_calc_allgeo = ON — суммируем из локалей
      if (autoCalcEnabled && !useAllGeo) {
        var sum = 0;
        Object.keys(localeColumns).forEach(function(locale) {
          if (locale !== 'ALL') {
            sum += parseNumber(row[localeColumns[locale]]);
          }
        });
        return sum;
      }
      
      // ALL GEO пустой и auto-calc = OFF — возвращаем 0
      return 0;
    };
    
    // ═══ ФУНКЦИЯ ПОЛУЧЕНИЯ ЗНАЧЕНИЙ ПО ЛОКАЛЯМ ═══
    const getRowByLocale = (rowIdx) => {
      if (rowIdx >= data.length) return {};
      const row = data[rowIdx];
      const byGeo = {};
      
      Object.keys(localeColumns).forEach(locale => {
        if (locale !== 'ALL') {
          byGeo[locale] = parseNumber(row[localeColumns[locale]]);
        }
      });
      
      return byGeo;
    };
    
    // ═══ НАХОДИМ НЕДЕЛЬНЫЕ БЛОКИ ДЛЯ byWeekByGeo ═══
    const weekBlocks = [];
    for (let i = 0; i < data.length; i++) {
      const cellA = String(data[i][0] || '').toLowerCase().trim();
      if (cellA.includes('week #') || cellA.includes('week#') || cellA.match(/week\s*\d/)) {
        weekBlocks.push({ row: i, label: cellA });
      }
    }

    Logger.log(`[readTagsStatisticSmart] Found ${weekBlocks.length} week blocks`);

    // ═══ ПАРСИМ КАТЕГОРИИ И ТЕГИ ═══
    const categoriesMap = {};
    let currentCategory = null;
    let totalCount = 0;
    
    for (let i = totalMonthRow + 1; i < data.length; i++) {
      const row = data[i];
      const catVal = String(row[categoryCol] || '').trim();
      const tagVal = String(row[tagCol] || '').trim();
      
      // Проверяем конец блока
      const cellA = String(row[0] || '').toLowerCase().trim();
      if (cellA.includes('total month') || cellA.includes('week #') || cellA.includes('week#')) {
        break;
      }
      
      // Ограничение
      if (i > totalMonthRow + 500) break;
      
      // Новая категория
      if (catVal) {
        currentCategory = catVal;
        if (!categoriesMap[currentCategory]) {
          categoriesMap[currentCategory] = {
            name: currentCategory,
            tags: [],
            total: 0
          };
        }
      }
      
      // Тег с данными
      if (tagVal && currentCategory) {
        const allGeoValue = getRowValue(i);
        const byGeo = getRowByLocale(i);
        
        // ✅ НОВОЕ: Читаем недельные данные для каждой локали
        const byWeekByGeo = {};
        
        // Для каждого недельного блока собираем данные
        weekBlocks.forEach((weekBlock, weekIdx) => {
          // Ищем строку с этим тегом в недельном блоке
          const weekTagRow = findTagInWeekBlock(data, weekBlock.row, tagVal, tagCol, categoryCol, currentCategory);
          
          if (weekTagRow >= 0) {
            // Читаем данные по локалям для этой недели
            Object.keys(localeColumns).forEach(locale => {
              if (locale !== 'ALL') {
                const colIdx = localeColumns[locale];
                const value = parseNumber(data[weekTagRow][colIdx]);
                
                if (!byWeekByGeo[locale]) {
                  byWeekByGeo[locale] = [];
                }
                byWeekByGeo[locale][weekIdx] = value;
              }
            });
          } else {
            // Если данных нет — заполняем нулями
            Object.keys(localeColumns).forEach(locale => {
              if (locale !== 'ALL') {
                if (!byWeekByGeo[locale]) {
                  byWeekByGeo[locale] = [];
                }
                byWeekByGeo[locale][weekIdx] = 0;
              }
            });
          }
        });
        
        const tagObj = {
          name: tagVal,
          allGeo: allGeoValue,
          count: allGeoValue,
          byGeo: byGeo,
          byWeekByGeo: byWeekByGeo  // ✅ НОВОЕ ПОЛЕ
        };
        
        categoriesMap[currentCategory].tags.push(tagObj);
        categoriesMap[currentCategory].total += allGeoValue;
        totalCount += allGeoValue;
      }
    }
    
    result.tags.categories = Object.values(categoriesMap);
    result.tags.totalCount = totalCount;
    
    // Агрегируем byGeo
    const aggregatedByGeo = {};
    result.tags.categories.forEach(cat => {
      cat.tags.forEach(tag => {
        Object.keys(tag.byGeo || {}).forEach(locale => {
          aggregatedByGeo[locale] = (aggregatedByGeo[locale] || 0) + tag.byGeo[locale];
        });
      });
    });
    result.tags.byGeo = aggregatedByGeo;
    
    // ═══ ВЫЧИСЛЯЕМ weeklyTotals ИЗ byWeekByGeo ═══
    const weeklyTotals = {};
    
    result.tags.categories.forEach(cat => {
      if (!cat.tags) return;
      cat.tags.forEach(tag => {
        // Если есть byWeekByGeo — суммируем по всем локалям
        if (tag.byWeekByGeo) {
          Object.keys(tag.byWeekByGeo).forEach(locale => {
            const weeks = tag.byWeekByGeo[locale];
            if (Array.isArray(weeks)) {
              weeks.forEach((count, idx) => {
                const weekKey = 'Week ' + (idx + 1);
                weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + (count || 0);
              });
            }
          });
        }
      });
    });
    
    result.weeklyTotals = weeklyTotals;
    result.tags.weeklyTotals = weeklyTotals;
    
    Logger.log(`[readTagsStatisticSmart] Parsed ${result.tags.categories.length} categories, total: ${totalCount}`);
    Logger.log(`[readTagsStatisticSmart] weeklyTotals: ${JSON.stringify(weeklyTotals)}`);
    
  } catch (e) {
    Logger.log('[readTagsStatisticSmart] Error: ' + e.message);
    Logger.log(e.stack);
  }
  
  return result;
}

/**
 * Построить карту колонок
 */
function _buildTagsColumnMap(findHeaderIndex) {
  const colAllGeo = findHeaderIndex(['all geo']);
  const colPeriod = findHeaderIndex(['period']);
  const colDateStart = colPeriod !== -1 ? colPeriod : 11;
  const colDateEnd = findHeaderIndex(['date end', 'end']) !== -1 
    ? findHeaderIndex(['date end', 'end']) 
    : (colPeriod !== -1 ? colPeriod + 1 : 12);
  
  const findWeekCols = () => {
    const res = [];
    for (let i = 1; i <= 5; i++) {
      const idx = findHeaderIndex([`week ${i}`, `неделя ${i}`]);
      if (idx !== -1) res.push(idx);
    }
    return res.length > 0 ? res : [15, 16, 17, 18, 19];
  };

  return {
    CATEGORY: 0, 
    TAG: 1, 
    ALL_GEO: colAllGeo !== -1 ? colAllGeo : 2,
    DE: findHeaderIndex(['de']) !== -1 ? findHeaderIndex(['de']) : 3,
    EN: findHeaderIndex(['en']) !== -1 ? findHeaderIndex(['en']) : 4,
    ES: findHeaderIndex(['es']) !== -1 ? findHeaderIndex(['es']) : 5,
    FR: findHeaderIndex(['fr']) !== -1 ? findHeaderIndex(['fr']) : 6,
    PL: findHeaderIndex(['pl']) !== -1 ? findHeaderIndex(['pl']) : 7,
    PT: findHeaderIndex(['pt']) !== -1 ? findHeaderIndex(['pt']) : 8,
    UA: findHeaderIndex(['ua']) !== -1 ? findHeaderIndex(['ua']) : 9,
    UZ: findHeaderIndex(['uz']) !== -1 ? findHeaderIndex(['uz']) : 10,
    DATE_START: colDateStart, 
    DATE_END: colDateEnd, 
    WEEK_COLS: findWeekCols()
  };
}

/**
 * Найти блок "Total Month"
 */
function _findTotalMonthBlock(data, displayData, COL, targetMonth, targetYear, result) {
  // Поиск по дате
  for (let i = 0; i < data.length; i++) {
    if (!String(data[i][0]).toLowerCase().includes('total month')) continue;
    
    const dateVal = data[i][COL.DATE_START];
    let bMonth = null, bYear = null;
    
    if (dateVal instanceof Date) {
      bMonth = dateVal.getMonth() + 1;
      bYear = dateVal.getFullYear();
    } else {
      const dateStr = String(displayData[i][COL.DATE_START]);
      const match = dateStr.match(/(\d{1,2})[\.,](\d{1,2})/);
      if (match) bMonth = parseInt(match[2], 10);
      const yearMatch = dateStr.match(/20\d{2}/);
      if (yearMatch) bYear = parseInt(yearMatch[0], 10);
    }
    
    if (!bYear) bYear = targetYear;
    
    if (bMonth === targetMonth && bYear === targetYear) {
      result.period = {
        startDate: formatDateWithYear(displayData[i][COL.DATE_START], targetYear),
        endDate: formatDateWithYear(displayData[i][COL.DATE_END], targetYear)
      };
      Logger.log(`[_findTotalMonthBlock] Found at row ${i + 1}`);
      return i;
    }
  }
  
  // Fallback: первый "Total Month"
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().includes('total month')) {
      result.period = {
        startDate: formatDateWithYear(displayData[i][COL.DATE_START], targetYear),
        endDate: formatDateWithYear(displayData[i][COL.DATE_END], targetYear)
      };
      Logger.log(`[_findTotalMonthBlock] Using first at row ${i + 1}`);
      return i;
    }
  }
  
  return -1;
}

/**
 * Парсинг данных тегов
 */
function _parseTagsData(data, startRowIndex, COL, result) {
  const categoriesMap = {};
  let currentCategory = null;

  for (let i = startRowIndex + 1; i < data.length; i++) {
    const catVal = String(data[i][COL.CATEGORY]).trim();
    const tagVal = String(data[i][COL.TAG]).trim();
    
    if (catVal.toLowerCase().includes('total month')) break;
    if (catVal.toLowerCase().includes('week')) break;
    if (i > startRowIndex + 600) break;
    
    if (catVal) {
      currentCategory = catVal;
      if (!categoriesMap[currentCategory]) {
        categoriesMap[currentCategory] = { name: currentCategory, tags: [], total: 0 };
      }
    }
    
    if (tagVal && currentCategory) {
      const allGeo = parseNumber(data[i][COL.ALL_GEO]);
      
      const tagObj = {
        name: tagVal,
        allGeo: allGeo,
        count: allGeo,
        byGeo: {
          DE: parseNumber(data[i][COL.DE]),
          EN: parseNumber(data[i][COL.EN]),
          ES: parseNumber(data[i][COL.ES]),
          FR: parseNumber(data[i][COL.FR]),
          PL: parseNumber(data[i][COL.PL]),
          PT: parseNumber(data[i][COL.PT]),
          UA: parseNumber(data[i][COL.UA]),
          UZ: parseNumber(data[i][COL.UZ])
        },
        byWeek: COL.WEEK_COLS.map(col => parseNumber(data[i][col]))
      };
      
      categoriesMap[currentCategory].tags.push(tagObj);
      categoriesMap[currentCategory].total += allGeo;
      result.tags.totalCount += allGeo;
      
      COL.WEEK_COLS.forEach((col, idx) => {
        const v = parseNumber(data[i][col]);
        result.weeklyTotals[`Week ${idx + 1}`] = (result.weeklyTotals[`Week ${idx + 1}`] || 0) + v;
      });
    }
  }

  result.tags.categories = Object.values(categoriesMap);
  result.tags.weeklyTotals = result.weeklyTotals;
}

/**
 * Найти строку тега в недельном блоке
 * @param {Array} data - Данные листа
 * @param {number} weekBlockRow - Начальная строка недельного блока
 * @param {string} tagName - Название тега
 * @param {number} tagCol - Колонка тега
 * @param {number} categoryCol - Колонка категории
 * @param {string} currentCategory - Текущая категория
 * @returns {number} Индекс строки или -1
 */
function findTagInWeekBlock(data, weekBlockRow, tagName, tagCol, categoryCol, currentCategory) {
  // Ищем тег в пределах 100 строк после начала блока
  const maxRows = 100;
  
  for (let i = weekBlockRow + 1; i < Math.min(data.length, weekBlockRow + maxRows); i++) {
    const row = data[i];
    
    // Конец блока
    const cellA = String(row[0] || '').toLowerCase().trim();
    if (cellA.includes('week #') || cellA.includes('total month')) {
      break;
    }
    
    const rowTag = String(row[tagCol] || '').trim();
    const rowCat = String(row[categoryCol] || '').trim();
    
    // Проверяем совпадение тега
    if (rowTag === tagName) {
      // Дополнительно проверяем категорию если она есть
      if (!rowCat || rowCat === currentCategory || rowCat === '') {
        return i;
      }
    }
  }
  
  return -1;
}

/**
 * Чтение HelpDesk Stats
 */
function readHelpDeskStats(spreadsheetId, sheetName) {
  const result = createEmptyHelpDeskStats();
  
  try {
    const ssId = spreadsheetId || SUPPORT_CONFIG.SPREADSHEET_ID;
    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName(sheetName || SUPPORT_CONFIG.SHEETS.HELPDESK);
    
    if (!sheet) {
      Logger.log(`[readHelpDeskStats] Sheet not found`);
      return result;
    }
    
    const data = sheet.getRange(1, 1, 5, 2).getValues();
    result.totalTickets = parseNumber(data[1][1]);
    
    Logger.log(`[readHelpDeskStats] Tickets: ${result.totalTickets}`);
    
  } catch (e) {
    Logger.log('[readHelpDeskStats] Error: ' + e.message);
  }
  
  return result;
}