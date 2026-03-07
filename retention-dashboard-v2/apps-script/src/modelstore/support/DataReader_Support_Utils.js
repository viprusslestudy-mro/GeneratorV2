/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DataReader_Support_Utils.js — Утилиты парсинга и диагностика
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
//  ПАРСИНГ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Форматировать дату с годом
 */
function formatDateWithYear(dateStr, year) {
  if (!dateStr) return '';
  let formatted = String(dateStr).replace(',', '.');
  if (formatted.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) return formatted;
  return formatted + '.' + year;
}

/**
 * Парсинг числа
 */
function parseNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/,/g, '.').replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Парсинг времени в секунды ("0:10" -> 10, "1:05" -> 65)
 */
function parseTimeStringToSeconds(val) {
  if (!val) return 0;
  if (typeof val === 'number') return Math.round(val * 86400);
  
  const str = String(val).trim();
  const parts = str.split(':');
  
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return parseNumber(val);
}

/**
 * Парсинг времени в минуты
 */
function parseTimeStringToMinutes(val) {
  return parseTimeStringToSeconds(val) / 60;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ДИАГНОСТИКА
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Диагностика структуры Support данных (для логов)
 */
function diagnoseSupportDataStructure() {
  Logger.log('='.repeat(80));
  Logger.log('ДИАГНОСТИКА SUPPORT DATA STRUCTURE V3');
  Logger.log('='.repeat(80));
  
  // 1. Периоды - ВАЖНО: используем НАШУ функцию, не старую!
  Logger.log('\n📅 АКТИВНЫЕ ПЕРИОДЫ:');
  const periods = getActivePeriodsForSupport(); // ← Эта функция из DataReader_Support_Config.js
  
  if (periods.length === 0) {
    Logger.log('  ❌ Периоды не найдены! Проверьте лист "🎧 SUPPORT"');
  } else {
    periods.forEach((p, idx) => {
      Logger.log(`\n  📆 #${idx + 1}: ${p.label} (key=${p.key})`);
      Logger.log(`     KPI: "${p.roleSheets.livechat || '(авто)'}"`);
      Logger.log(`     Tags: "${p.roleSheets.tags || '(авто)'}"`);
    });
  }
  
  // 2. Листы
  Logger.log('\n\n📋 ЛИСТЫ В SUPPORT SPREADSHEET:');
  const ssId = SUPPORT_CONFIG.SPREADSHEET_ID;
  
  try {
    const ss = SpreadsheetApp.openById(ssId);
    const sheets = ss.getSheets();
    
    Logger.log(`  ID: ${ssId}`);
    Logger.log(`  Листов: ${sheets.length}\n`);
    
    sheets.forEach(sheet => {
      const name = sheet.getName();
      let marker = '  ';
      if (name.toLowerCase().includes('kpi')) marker = '📊';
      else if (name.toLowerCase().includes('tags')) marker = '🏷️';
      else if (name.toLowerCase().includes('helpdesk')) marker = '🎫';
      
      Logger.log(`  ${marker} "${name}" (${sheet.getLastRow()} строк)`);
    });
    
    // 3. Тест чтения
    if (periods.length > 0) {
      const testPeriod = periods[0];
      Logger.log(`\n\n🔍 ТЕСТ: "${testPeriod.label}"`);
      
      const kpiSheet = getKpiSheetName(ssId, testPeriod);
      const tagsSheet = getTagsSheetName(ssId, testPeriod);
      
      Logger.log(`  KPI: "${kpiSheet || 'НЕ НАЙДЕН'}"`);
      Logger.log(`  Tags: "${tagsSheet || 'НЕ НАЙДЕН'}"`);
      
      if (kpiSheet) {
        const sheet = ss.getSheetByName(kpiSheet);
        if (sheet) {
          const data = sheet.getDataRange().getValues();
          for (let i = 0; i < Math.min(data.length, 100); i++) {
            if (String(data[i][0]).toLowerCase().includes('total month')) {
              Logger.log(`  ✓ "Total Month" в строке ${i + 1}`);
              break;
            }
          }
        }
      }
    }
    
  } catch (e) {
    Logger.log(`  ❌ Ошибка: ${e.message}`);
  }
  
  Logger.log('\n' + '='.repeat(80));
}

/**
 * Тест полного сбора данных
 */
function testCollectSupportData() {
  Logger.log('='.repeat(80));
  Logger.log('ТЕСТ COLLECT SUPPORT DATA');
  Logger.log('='.repeat(80));
  
  const data = collectSupportData();
  
  Logger.log(`\nПериод: ${data.period.label}`);
  Logger.log(`Доступно периодов: ${data.availablePeriods.length}`);
  Logger.log(`\nLiveChat KPI:`);
  Logger.log(`  Total Chats: ${data.liveChat.totalChats}`);
  Logger.log(`  Satisfaction: ${data.liveChat.chatSatisfaction}%`);
  Logger.log(`  First Response: ${data.liveChat.firstResponseTime}s`);
  Logger.log(`  Weekly blocks: ${data.liveChat.weeklyKPI.length}`);
  Logger.log(`\nTags:`);
  Logger.log(`  Categories: ${data.tags.categories.length}`);
  Logger.log(`  Total count: ${data.tags.totalCount}`);
  
  Logger.log('\n' + '='.repeat(80));
  
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  UI ФУНКЦИИ ДЛЯ МЕНЮ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Диагностика структуры данных (с UI)
 */
function diagnoseSupportDataStructureUI() {
  const ui = SpreadsheetApp.getUi();
  
  let output = [];
  output.push('═'.repeat(50));
  output.push('🎧 ДИАГНОСТИКА SUPPORT DATA');
  output.push('═'.repeat(50));
  
  // 1. Периоды
  output.push('\n📅 АКТИВНЫЕ ПЕРИОДЫ:');
  // Используем функцию из DataReader_Support_Config.js
  const periods = getActivePeriodsForSupport();
  Logger.log(`[UI] getActivePeriodsForSupport returned ${periods.length} periods`);
  if (periods.length === 0) {
    output.push('  ❌ Периоды не найдены!');
    output.push('  Проверьте лист "🎧SUPPORT" в мастер-таблице');
    output.push('  Колонки: A=Месяц, B=Год, C=Дата, D=KPI, E=Tags, F=KPI Sheet, G=Tags Sheet');
  } else {
    periods.forEach((p, idx) => {
      output.push(`\n  📆 #${idx + 1}: ${p.label}`);
      output.push(`     Key: ${p.key}`);
      output.push(`     KPI Sheet: "${p.roleSheets.livechat || '(авто-поиск)'}"`);
      output.push(`     Tags Sheet: "${p.roleSheets.tags || '(авто-поиск)'}"`);
      output.push(`     Enabled: KPI=${p.enabled.kpi}, Tags=${p.enabled.tags}`);
    });
  }
  
  // 2. Листы в Support таблице
  output.push('\n\n📋 ЛИСТЫ В SUPPORT SPREADSHEET:');
  
  try {
    const ssId = SUPPORT_CONFIG.SPREADSHEET_ID;
    const ss = SpreadsheetApp.openById(ssId);
    const sheets = ss.getSheets();
    
    output.push(`  ID: ${ssId}`);
    output.push(`  Найдено листов: ${sheets.length}\n`);
    
    sheets.forEach(sheet => {
      const name = sheet.getName();
      let marker = '  ';
      if (name.toLowerCase().includes('kpi')) marker = '📊';
      else if (name.toLowerCase().includes('tags')) marker = '🏷️';
      else if (name.toLowerCase().includes('helpdesk')) marker = '🎫';
      
      output.push(`  ${marker} "${name}" (${sheet.getLastRow()} строк)`);
    });
    
    // 3. Тест поиска листов для первого периода
    if (periods.length > 0) {
      const testPeriod = periods[0];
      output.push(`\n\n🔍 ТЕСТ ПОИСКА ЛИСТОВ для "${testPeriod.label}":`);
      
      const kpiSheet = getKpiSheetName(ssId, testPeriod);
      const tagsSheet = getTagsSheetName(ssId, testPeriod);
      
      output.push(`  KPI Sheet: "${kpiSheet || '❌ НЕ НАЙДЕН'}"`);
      output.push(`  Tags Sheet: "${tagsSheet || '❌ НЕ НАЙДЕН'}"`);
      
      // Проверка "Total Month" в KPI листе
      if (kpiSheet) {
        const sheet = ss.getSheetByName(kpiSheet);
        if (sheet) {
          const data = sheet.getDataRange().getValues();
          let found = false;
          for (let i = 0; i < Math.min(data.length, 100); i++) {
            if (String(data[i][0]).toLowerCase().includes('total month')) {
              found = true;
              output.push(`  ✓ "Total Month" найден в строке ${i + 1}`);
              
              // Проверим данные
              const totalChats = data[i + 1] ? data[i + 1][2] : '?';
              output.push(`  ✓ Total Chats (примерно): ${totalChats}`);
              break;
            }
          }
          if (!found) {
            output.push(`  ⚠️ "Total Month" НЕ найден в первых 100 строках`);
          }
        }
      }
    }
    
  } catch (e) {
    output.push(`  ❌ Ошибка: ${e.message}`);
  }
  
  output.push('\n' + '═'.repeat(50));
  
  // Показываем в диалоге
  const htmlOutput = HtmlService.createHtmlOutput(
    '<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 500px; overflow: auto;">' + 
    output.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
    '</pre>'
  )
  .setWidth(600)
  .setHeight(500);
  
  ui.showModalDialog(htmlOutput, '🎧 Support Диагностика');
  
  // Также в логи
  Logger.log(output.join('\n'));
}

/**
 * Тест сбора данных (с UI)
 */
function testCollectSupportDataUI() {
  const ui = SpreadsheetApp.getUi();
  
  let output = [];
  output.push('═'.repeat(50));
  output.push('📊 ТЕСТ СБОРА SUPPORT DATA');
  output.push('═'.repeat(50));
  
  try {
    const startTime = new Date();
    const data = collectSupportData();
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    output.push(`\n⏱️ Время выполнения: ${duration.toFixed(2)} сек`);
    
    output.push(`\n📅 ПЕРИОД:`);
    output.push(`  Label: ${data.period.label}`);
    output.push(`  Key: ${data.period.key}`);
    output.push(`  Даты: ${data.period.startDate || '?'} - ${data.period.endDate || '?'}`);
    output.push(`  Доступно периодов: ${data.availablePeriods.length}`);
    
    output.push(`\n💬 LIVECHAT KPI:`);
    output.push(`  Total Chats: ${data.liveChat.totalChats}`);
    output.push(`  Satisfaction: ${data.liveChat.chatSatisfaction}%`);
    output.push(`  First Response: ${data.liveChat.firstResponseTime} сек`);
    output.push(`  Avg Response: ${data.liveChat.avgResponseTime} сек`);
    output.push(`  Chat Duration: ${data.liveChat.avgChatDuration.toFixed(1)} мин`);
    output.push(`  Missed Chats: ${data.liveChat.missedChats}`);
    output.push(`  Rated Good/Bad: ${data.liveChat.ratedGood}/${data.liveChat.ratedBad}`);
    output.push(`  Weekly blocks: ${data.liveChat.weeklyKPI.length}`);
    
    output.push(`\n🏷️ TAGS:`);
    output.push(`  Categories: ${data.tags.categories.length}`);
    output.push(`  Total count: ${data.tags.totalCount}`);
    
    if (data.tags.categories.length > 0) {
      output.push(`  Top 5 категорий:`);
      const sorted = [...data.tags.categories].sort((a, b) => b.total - a.total).slice(0, 5);
      sorted.forEach((cat, idx) => {
        output.push(`    ${idx + 1}. ${cat.name}: ${cat.total}`);
      });
    }
    
    output.push(`\n🎫 HELPDESK:`);
    output.push(`  Total Tickets: ${data.helpDesk.totalTickets}`);
    
    output.push(`\n📊 BY LOCALE:`);
    Object.keys(data.liveChat.byLocale).forEach(loc => {
      const locData = data.liveChat.byLocale[loc];
      if (locData.totalChats > 0) {
        output.push(`  ${loc}: ${locData.totalChats} chats, ${locData.satisfaction}% sat`);
      }
    });
    
    // Статус
    if (data.liveChat.totalChats > 0) {
      output.push(`\n✅ ДАННЫЕ УСПЕШНО ПОЛУЧЕНЫ!`);
    } else {
      output.push(`\n⚠️ ВНИМАНИЕ: Total Chats = 0`);
      output.push(`  Возможные причины:`);
      output.push(`  1. Листы KPI/Tags не найдены`);
      output.push(`  2. "Total Month" блок отсутствует`);
      output.push(`  3. Данные в других колонках`);
    }
    
  } catch (e) {
    output.push(`\n❌ ОШИБКА: ${e.message}`);
    output.push(e.stack);
  }
  
  output.push('\n' + '═'.repeat(50));
  
  // Показываем в диалоге
  const htmlOutput = HtmlService.createHtmlOutput(
    '<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 500px; overflow: auto;">' + 
    output.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
    '</pre>'
  )
  .setWidth(600)
  .setHeight(500);
  
  ui.showModalDialog(htmlOutput, '📊 Тест сбора данных Support');
  
  Logger.log(output.join('\n'));
}

/**
 * Показать найденные периоды (с UI)
 */
function showSupportPeriodsUI() {
  const ui = SpreadsheetApp.getUi();
  
  let output = [];
  output.push('═'.repeat(50));
  output.push('📋 ПЕРИОДЫ SUPPORT');
  output.push('═'.repeat(50));
  
  // Используем функцию из DataReader_Support_Config.js
  const periods = getActivePeriodsForSupport();
  Logger.log(`[UI] getActivePeriodsForSupport returned ${periods.length} periods`);
  
  if (periods.length === 0) {
    output.push('\n❌ Активные периоды не найдены!');
    output.push('\n📝 Как настроить:');
    output.push('1. Откройте мастер-таблицу настроек');
    output.push('2. Найдите лист "🎧 SUPPORT"');
    output.push('3. Заполните строки:');
    output.push('   A: Месяц (Январь, Февраль...)');
    output.push('   B: Год (2026)');
    output.push('   C: Дата или ключ');
    output.push('   D: TRUE (включить KPI)');
    output.push('   E: TRUE (включить Tags)');
    output.push('   F: Имя листа KPI (опционально)');
    output.push('   G: Имя листа Tags (опционально)');
  } else {
    output.push(`\n✅ Найдено периодов: ${periods.length}\n`);
    
    periods.forEach((p, idx) => {
      output.push(`${'─'.repeat(40)}`);
      output.push(`📆 Период #${idx + 1}: ${p.label}`);
      output.push(`   Key: ${p.key}`);
      output.push(`   Month: ${p.monthNum}, Year: ${p.year}`);
      output.push(`   KPI enabled: ${p.enabled.kpi ? '✅' : '❌'}`);
      output.push(`   Tags enabled: ${p.enabled.tags ? '✅' : '❌'}`);
      
      if (p.roleSheets.livechat) {
        output.push(`   KPI Sheet: "${p.roleSheets.livechat}"`);
      } else {
        output.push(`   KPI Sheet: (будет найден автоматически)`);
      }
      
      if (p.roleSheets.tags) {
        output.push(`   Tags Sheet: "${p.roleSheets.tags}"`);
      } else {
        output.push(`   Tags Sheet: (будет найден автоматически)`);
      }
    });
  }
  
  output.push('\n' + '═'.repeat(50));
  
  // Показываем в диалоге
  const htmlOutput = HtmlService.createHtmlOutput(
    '<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 500px; overflow: auto;">' + 
    output.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
    '</pre>'
  )
  .setWidth(550)
  .setHeight(450);
  
  ui.showModalDialog(htmlOutput, '📋 Периоды Support');
  
  Logger.log(output.join('\n'));
}/**
 * Диагностика мастер-таблицы настроек
 */
function diagnoseMasterSettingsUI() {
  const ui = SpreadsheetApp.getUi();
  
  let output = [];
  output.push('═'.repeat(50));
  output.push('🔧 ДИАГНОСТИКА МАСТЕР-ТАБЛИЦЫ');
  output.push('═'.repeat(50));
  
  // 1. Проверяем как получаем ID
  output.push('\n📍 ПОИСК МАСТЕР-ТАБЛИЦЫ:\n');
  
  // Вариант 1: PropertiesService
  let propsId = null;
  try {
    const props = PropertiesService.getScriptProperties();
    propsId = props.getProperty('SETTINGS_SPREADSHEET_ID');
    output.push(`  PropertiesService: ${propsId ? '✅ ' + propsId : '❌ не задан'}`);
  } catch (e) {
    output.push(`  PropertiesService: ❌ ошибка - ${e.message}`);
  }
  
  // Вариант 2: CONFIG
  let configId = null;
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG.SETTINGS_SPREADSHEET_ID) {
      configId = CONFIG.SETTINGS_SPREADSHEET_ID;
      output.push(`  CONFIG: ✅ ${configId}`);
    } else {
      output.push(`  CONFIG: ❌ не определён`);
    }
  } catch (e) {
    output.push(`  CONFIG: ❌ ошибка - ${e.message}`);
  }
  
  // Вариант 3: Текущая таблица
  let activeId = null;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      activeId = ss.getId();
      output.push(`  ActiveSpreadsheet: ✅ ${activeId}`);
      output.push(`    Имя: "${ss.getName()}"`);
    }
  } catch (e) {
    output.push(`  ActiveSpreadsheet: ❌ ошибка - ${e.message}`);
  }
  
  // Итоговый ID
  const finalId = propsId || configId || activeId;
  output.push(`\n  📌 ИСПОЛЬЗУЕТСЯ: ${finalId || '❌ НЕ НАЙДЕН'}`);
  
  // 2. Проверяем листы в мастер-таблице
  if (finalId) {
    output.push('\n\n📋 ЛИСТЫ В МАСТЕР-ТАБЛИЦЕ:\n');
    
    try {
      const ss = SpreadsheetApp.openById(finalId);
      const sheets = ss.getSheets();
      
      output.push(`  Имя таблицы: "${ss.getName()}"`);
      output.push(`  Листов: ${sheets.length}\n`);
      
      let foundSupport = false;
      
      sheets.forEach(sheet => {
        const name = sheet.getName();
        let marker = '  ';
        
        if (name.includes('🎧') || name.toLowerCase().includes('support')) {
          marker = '🎧';
          foundSupport = true;
        } else if (name.includes('📊') || name.toLowerCase().includes('retention')) {
          marker = '📊';
        } else if (name.includes('⚙️') || name.toLowerCase().includes('settings')) {
          marker = '⚙️';
        } else if (name.includes('🌐') || name.toLowerCase().includes('translation')) {
          marker = '🌐';
        }
        
        output.push(`  ${marker} "${name}" (${sheet.getLastRow()} строк)`);
      });
      
      if (!foundSupport) {
        output.push('\n  ⚠️ ВНИМАНИЕ: Лист "🎧 SUPPORT" НЕ НАЙДЕН!');
        output.push('\n  📝 Нужно создать лист с именем "🎧 SUPPORT"');
        output.push('  и заполнить колонки A-G (см. документацию)');
      }
      
      // 3. Если нашли лист Support - проверяем его содержимое
      let supportSheet = ss.getSheetByName('🎧 SUPPORT');
      if (!supportSheet) supportSheet = ss.getSheetByName('🎧SUPPORT');
      if (!supportSheet) supportSheet = ss.getSheetByName('SUPPORT');
      if (!supportSheet) {
        supportSheet = sheets.find(s => s.getName().toLowerCase().includes('support'));
      }
      if (supportSheet) {
        output.push('\n\n📄 СОДЕРЖИМОЕ ЛИСТА "🎧 SUPPORT":\n');
        
        const lastRow = supportSheet.getLastRow();
        const lastCol = supportSheet.getLastColumn();
        
        output.push(`  Строк: ${lastRow}, Колонок: ${lastCol}`);
        
        if (lastRow >= 2) {
          const headers = supportSheet.getRange(2, 1, 1, Math.min(lastCol, 7)).getValues()[0];
          output.push(`\n  Заголовки (строка 2):`);
          headers.forEach((h, idx) => {
            output.push(`    ${String.fromCharCode(65 + idx)}: "${h}"`);
          });
          
          if (lastRow >= 3) {
            output.push(`\n  Данные (строки 3+):`);
            const data = supportSheet.getRange(3, 1, Math.min(lastRow - 2, 5), Math.min(lastCol, 7)).getValues();
            
            data.forEach((row, idx) => {
              const monthName = row[0] || '';
              const year = row[1] || '';
              const key = row[2] || '';
              const kpiEnabled = row[3];
              const tagsEnabled = row[4];
              const kpiSheet = row[5] || '';
              const tagsSheet = row[6] || '';
              
              if (monthName) {
                output.push(`\n    Строка ${idx + 3}: ${monthName} ${year}`);
                output.push(`      Key: ${key}`);
                output.push(`      KPI: ${kpiEnabled} | Tags: ${tagsEnabled}`);
                if (kpiSheet) output.push(`      KPI Sheet: "${kpiSheet}"`);
                if (tagsSheet) output.push(`      Tags Sheet: "${tagsSheet}"`);
              }
            });
          }
        }
      }
      
    } catch (e) {
      output.push(`  ❌ Ошибка открытия: ${e.message}`);
    }
  }
  
  output.push('\n' + '═'.repeat(50));
  
  // Показываем в диалоге
  const htmlOutput = HtmlService.createHtmlOutput(
    '<pre style="font-family: monospace; font-size: 11px; white-space: pre-wrap; max-height: 500px; overflow: auto;">' + 
    output.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
    '</pre>'
  )
  .setWidth(650)
  .setHeight(550);
  
  ui.showModalDialog(htmlOutput, '🔧 Диагностика мастер-таблицы');
  
  Logger.log(output.join('\n'));
}

/**
 * Получить список локалей из данных Support
 * @param {Object} supportData - данные из collectSupportData()
 * @returns {Array} - массив локалей ['RU', 'EN', 'PT', ...]
 */
function getSupportLocales(supportData) {
  const locales = [];
  
  if (supportData && supportData.liveChat && supportData.liveChat.byLocale) {
    Object.keys(supportData.liveChat.byLocale).forEach(locale => {
      if (supportData.liveChat.byLocale[locale].totalChats > 0) {
        locales.push(locale);
      }
    });
  }
  
  // Сортируем: сначала по убыванию Total Chats
  locales.sort((a, b) => {
    const aChats = supportData.liveChat.byLocale[a].totalChats || 0;
    const bChats = supportData.liveChat.byLocale[b].totalChats || 0;
    return bChats - aChats;
  });
  
  return locales;
}
