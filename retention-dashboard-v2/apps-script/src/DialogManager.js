/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DialogManager.gs - Управление диалоговыми окнами UI
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Показать диалог добавления источника
 */
function showAddSourceDialog() {
  const html = HtmlService.createHtmlOutputFromFile('AddSourceDialog')
    .setWidth(500)
    .setHeight(450)
    .setTitle('➕ Добавить источник данных');

  SpreadsheetApp.getUi().showModalDialog(html, '➕ Добавить источник данных');
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SUPABASE UI - Окна загрузки экспорта
 * ═══════════════════════════════════════════════════════════════════════════
 */

function exportRetentionToSupabaseUI() {
  openSupabaseLoader('exportRetentionToSupabase', 'Сбор Retention...');
}

function exportSupportToSupabaseUI() {
  openSupabaseLoader('exportSupportToSupabase', 'Сбор Support...');
}

function exportAllToSupabaseUI() {
  openSupabaseLoader('exportAllToSupabase', 'Полная выгрузка в БД...');
}

/**
 * Вспомогательная функция для открытия лоадера
 * @param {string} funcName - Имя функции бекенда для вызова
 * @param {string} title - Заголовок лоадера
 */
function openSupabaseLoader(funcName, title) {
  // Чтобы передать параметры в HTML файл, используем шаблон
  const template = HtmlService.createTemplateFromFile('SupabaseLoaderDialog');
  
  // Добавляем скрипт, который прокинет переменные внутрь html
  const htmlOutput = template.evaluate();
  const htmlContent = htmlOutput.getContent();
  
  // Хак для передачи параметров без использования url.getLocation (который иногда глючит)
  const finalHtml = htmlContent
    .replace("const params = location.parameter;", `const params = { func: '${funcName}', title: '${title}' };`)
    .replace("google.script.url.getLocation(function(location) {", "")
    .replace(/}\);\s*<\/script>/, "</script>");

  const html = HtmlService.createHtmlOutput(finalHtml)
    .setWidth(450)
    .setHeight(360);

  SpreadsheetApp.getUi().showModalDialog(html, '☁️ Экспорт в БД');
}