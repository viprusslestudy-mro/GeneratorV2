/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TranslationsFormatter.js - Автоматическое форматирование листа переводов
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Отформатировать лист переводов: стили, группировка, навигация
 */
function formatTranslationsSheet() {
  const ss = getSettingsSpreadsheet();
  let sheet = ss.getSheetByName('🌐 TRANSLATIONS');
  if (!sheet) sheet = ss.getSheetByName('TRANSLATIONS');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ Лист TRANSLATIONS не найден');
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  // 1. Сброс существующих групп строк (чтобы не было ошибок при пересоздании)
  try {
    const existingGroups = sheet.getRowGroupDepth(2);
    // Google API не имеет метода "удалить все группы", поэтому пробуем снимать по одной
    for (let r = 2; r <= lastRow; r++) {
      let depth = sheet.getRowGroupDepth(r);
      while (depth > 0) {
        sheet.getRowGroup(r, depth).remove();
        depth--;
      }
    }
  } catch(e) {
    Logger.log('Очистка групп: ' + e.message);
  }

  // 2. Базовые настройки листа
  sheet.setTabColor('#f4b400');
  sheet.getRange('A:E').setFontFamily('Inter');
  sheet.setFrozenRows(1);
  
  // 3. Ширина колонок
  sheet.setColumnWidth(1, 350); // Ключ
  sheet.setColumnWidth(2, 400); // RU
  sheet.setColumnWidth(3, 400); // EN
  sheet.setColumnWidth(4, 30);  // Разделитель
  sheet.setColumnWidth(5, 250); // Навигация
  
  // 4. Форматирование шапки
  const headerRange = sheet.getRange(1, 1, 1, 5);
  headerRange
    .setValues([['Ключ (Key)', 'Русский (RU)', 'English (EN)', '', '📋 НАВИГАЦИЯ']])
    .setBackground('#374151')
    .setFontColor('white')
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);
  
  // 5. Сброс стилей для данных
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 3);
  dataRange
    .setBackground('white')
    .setFontColor('#333333')
    .setFontWeight('normal')
    .setFontSize(11)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle')
    .setWrap(true);
    
  // 6. Обработка строк: Стилизация, Сбор заголовков для групп и навигации
  const data = dataRange.getValues();
  const sections = []; // { name, row, link }
  let currentGroupStart = -1;
  const groupsToCreate = []; // { startRow, endRow }
  
  const sheetId = sheet.getSheetId();
  const spreadsheetUrl = ss.getUrl();
  
  for (let i = 0; i < data.length; i++) {
    const row = i + 2; 
    const key = String(data[i][0] || '').trim();
    const ru = String(data[i][1] || '').trim();
    const en = String(data[i][2] || '').trim();
    
    const range = sheet.getRange(row, 1, 1, 3);
    
    // ПРАВИЛО 1 & 2: Заголовки секций
    const isMainHeader = key && !ru && !en && (key.includes('---') || key.includes('===') || key === key.toUpperCase() || key.length < 50);
    const isAutoMissing = key.startsWith('___AUTO_MISSING');
    
    if (isMainHeader || isAutoMissing) {
      // Закрываем предыдущую группу (если есть)
      if (currentGroupStart !== -1 && currentGroupStart < row - 1) {
        groupsToCreate.push({ start: currentGroupStart, end: row - 1 });
      }
      
      let sectionName = key;
      
      // Стилизация заголовка
      if (isAutoMissing) {
        sectionName = '⚠️ НОВЫЕ: ' + key.replace('___AUTO_MISSING_', '').replace(/_/g, ' ');
        range.merge()
             .setValue(sectionName)
             .setBackground('#fef08a')
             .setFontColor('#854d0e');
      } else {
        range.merge()
             .setBackground('#e0e7ff')
             .setFontColor('#1e3a8a');
      }
      
      range.setFontWeight('bold')
           .setFontSize(12)
           .setHorizontalAlignment('center');
           
      // Создаем ссылку на этот диапазон
      const rangeA1 = 'A' + row;
      const link = spreadsheetUrl + '#gid=' + sheetId + '&range=' + rangeA1;
      
      sections.push({ name: sectionName, row: row, link: link });
      currentGroupStart = row + 1; // Начало группы = следующая строка
      continue;
    }
    
    // ПРАВИЛО 3: Подсветка непереведенных (EN пустой, а RU есть)
    if (key && ru && !en) {
      sheet.getRange(row, 3)
        .setBackground('#fee2e2')
        .setValue('<НУЖЕН ПЕРЕВОД>');
    }
    
    // ПРАВИЛО 4: Подсветка ключей
    sheet.getRange(row, 1).setFontWeight('bold').setFontColor('#4b5563');
  }
  
  // Закрываем последнюю группу
  if (currentGroupStart !== -1 && currentGroupStart <= lastRow) {
    groupsToCreate.push({ start: currentGroupStart, end: lastRow });
  }
  
  // 7. Добавление границ к таблице данных
  dataRange.setBorder(true, true, true, true, true, true, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);
  
  // 8. Создание групп строк
  // (Выполняем с конца в начало, чтобы индексы строк не сдвигались при ошибках)
  for (let i = groupsToCreate.length - 1; i >= 0; i--) {
    const grp = groupsToCreate[i];
    if (grp.start <= grp.end) {
      try {
        const rangeToGroup = sheet.getRange(grp.start + ":" + grp.end);
        rangeToGroup.shiftRowGroupDepth(1);
      } catch (e) {
        Logger.log('Ошибка создания группы: ' + e.message);
      }
    }
  }
  
  // 9. Очистка и создание панели Навигации в колонке E
  sheet.getRange(2, 5, Math.max(lastRow, 100), 1).clearContent().setBackground('#f9fafb').setBorder(false, false, false, false, false, false);
  
  if (sections.length > 0) {
    const navData = [];
    const richTextValues = [];
    
    sections.forEach(sec => {
      // Ограничиваем длину названия в меню для красоты
      let displayName = sec.name.replace(/[-=]/g, '').trim();
      if (displayName.length > 30) displayName = displayName.substring(0, 27) + '...';
      
      navData.push(['🔗 ' + displayName]);
      
      // Создаем гиперссылку
      const richText = SpreadsheetApp.newRichTextValue()
        .setText('🔗 ' + displayName)
        .setLinkUrl(sec.link)
        .build();
      richTextValues.push([richText]);
    });
    
    const navRange = sheet.getRange(2, 5, navData.length, 1);
    
    // Применяем стили для навигации
    navRange
      .setRichTextValues(richTextValues)
      .setFontColor('#2563eb')
      .setFontWeight('bold')
      .setFontSize(10)
      .setBackground('#f3f4f6')
      .setBorder(true, true, true, true, false, true, '#d1d5db', SpreadsheetApp.BorderStyle.SOLID);
      
    // Инструкция под навигацией
    sheet.getRange(sections.length + 3, 5)
      .setValue('💡 Кликните по ссылке,\nчтобы перейти к разделу.')
      .setFontColor('#6b7280')
      .setFontSize(9)
      .setFontStyle('italic')
      .setWrap(true);
  }
  
  SpreadsheetApp.getUi().alert('✅ Таблица отформатирована!\n\nСоздана навигация справа и свернуты группы.');
}