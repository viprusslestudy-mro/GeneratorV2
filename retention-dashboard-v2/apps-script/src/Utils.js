/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UTILS.gs - Вспомогательные утилиты
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Модуль содержит общие утилиты:
 *  - Парсинг времени
 *  - Конвертация данных
 *  - Валидация
 *  - Логирование
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                           ПАРСИНГ ВРЕМЕНИ                                 ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Парсинг строки времени в секунды
 * @param {string|Date|number} timeStr - Строка времени (MM:SS или HH:MM:SS) или Date объект или число (секунды)
 * @returns {number} Количество секунд
 */
function parseTimeToSeconds(timeStr) {
  if (typeof timeStr === 'number') return timeStr;
  if (!timeStr) return 0;

  // Если это Date объект (Google Sheets конвертирует время в Date)
  // ВАЖНО: мы используем getDisplayValues(), так что этот код не должен вызываться
  // Но оставим на всякий случай
  if (timeStr instanceof Date) {
    // Google Sheets интерпретирует время как время дня (HH:MM:SS)
    // Но в наших данных это должно быть MM:SS
    // Проблема: "0:15" становится 00:15:00 (15 минут), а нам нужно 15 секунд
    // Решение: используем getDisplayValues() чтобы получить строку, а не Date

    // Если все-таки получили Date, интерпретируем как HH:MM:SS
    const hours = timeStr.getHours();
    const minutes = timeStr.getMinutes();
    const seconds = timeStr.getSeconds();
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Если это строка, очищаем от пробелов
  const str = String(timeStr).trim();
  if (!str) return 0;

  // ВАЖНО: Проверяем, не является ли значение датой (DD.MM или DD.MM.YYYY)
  // Если похоже на дату, возвращаем 0, чтобы вызывающий код мог проверить следующую строку
  const isDatePattern = /^\d{1,2}\.\d{1,2}(\.\d{4})?$/.test(str);
  if (isDatePattern) {
    return 0; // Возвращаем 0, чтобы указать, что это не время, а дата
  }

  // Парсим формат MM:SS или HH:MM:SS
  const parts = str.split(':').map(p => {
    const num = parseInt(p.trim(), 10);
    return isNaN(num) ? 0 : num;
  });

  if (parts.length === 2) {
    // Интерпретируем как MM:SS (минуты:секунды)
    // НО: если первое число >= 24, это точно минуты (не может быть часов >= 24)
    // Если первое число < 24 и второе >= 60, это тоже минуты (секунды не могут быть >= 60)
    // Если первое число < 24 и второе < 60, это может быть как MM:SS так и HH:MM
    // В нашем случае ВСЕГДА интерпретируем как MM:SS для метрик времени
    // Например: "0:15" = 0 минут 15 секунд = 15 секунд
    // "1:25" = 1 минута 25 секунд = 85 секунд (НЕ 1 час 25 минут!)
    // "2:00" = 2 минуты 0 секунд = 120 секунд
    // "12:00" = 12 минут 0 секунд = 720 секунд
    // "25:30" = 25 минут 30 секунд = 1530 секунд
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS (только если явно указаны часы)
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  // Если не удалось распарсить как время (нет двоеточия), это не время
  // Возвращаем 0, чтобы вызывающий код мог проверить следующую строку
  return 0;
}

/**
 * Форматирование даты для отображения
 * @param {string|Date} dateStr - Дата в формате ISO или Date объект
 * @returns {string} Отформатированная дата (DD.MM.YYYY)
 */
function formatDateDisplay(dateStr) {
  if (!dateStr) return '';

  let date;
  if (typeof dateStr === 'string') {
    // Пытаемся распарсить ISO строку
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else {
      // Если это просто дата без времени
      date = new Date(dateStr + 'T00:00:00');
    }
  } else if (dateStr instanceof Date) {
    date = dateStr;
  } else {
    return String(dateStr);
  }

  // Проверяем валидность даты
  if (isNaN(date.getTime())) {
    return String(dateStr);
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Конвертация секунд в строку времени
 * @param {number} seconds - Количество секунд
 * @param {boolean} includeHours - Включать часы
 * @returns {string} Строка времени
 */
function secondsToTimeString(seconds, includeHours = false) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';

  seconds = Math.abs(Math.round(seconds));

  if (includeHours || seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`; // Формат mm:ss без ведущего нуля в минутах
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                          РАБОТА С ДАТАМИ                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Получить номер недели в месяце
 * @param {Date} date - Дата
 * @returns {number} Номер недели (1-5)
 */
function getWeekOfMonth(date) {
  // Находим четверг текущей недели (стандарт ISO для определения принадлежности недели к месяцу)
  // 1. Копируем дату
  const target = new Date(date.valueOf());
  // 2. Смещаемся на ближайший четверг (воскресенье = 0, понедельник = 1, четверг = 4)
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);

  // 3. Находим первый четверг этого месяца
  const firstThursday = new Date(target.getFullYear(), target.getMonth(), 1);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(1 - firstDayNr + 3);
  if (firstThursday.getMonth() < target.getMonth()) {
    firstThursday.setDate(firstThursday.getDate() + 7);
  }

  // 4. Считаем номер недели как разницу в неделях между четвергами
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
}

/**
 * Получить название месяца на русском
 * @param {number} monthIndex - Индекс месяца (0-11)
 * @returns {string} Название месяца
 */
function getMonthNameRu(monthIndex) {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[monthIndex] || 'Неизвестно';
}

/**
 * Получить диапазон дат для недели
 * @param {number} year - Год
 * @param {number} month - Месяц (1-12)
 * @param {number} weekNum - Номер недели
 * @returns {Object} { start: string, end: string }
 */
function getWeekDateRange(year, month, weekNum) {
  // 1. Находим первый четверг месяца
  let date = new Date(year, month - 1, 1);
  let dayNr = (date.getDay() + 6) % 7;
  date.setDate(1 - dayNr + 3); // Это может быть четверг предыдущего месяца

  // Если этот четверг в предыдущем месяце, берем следующий
  if (date.getMonth() < month - 1) {
    date.setDate(date.getDate() + 7);
  }

  // 2. Смещаемся на нужную неделю (weekNum - 1 недель вперед)
  date.setDate(date.getDate() + (weekNum - 1) * 7);

  // 3. Теперь у нас есть четверг нужной недели. Находим понедельник и воскресенье.
  const monday = new Date(date.valueOf());
  monday.setDate(monday.getDate() - 3);

  const sunday = new Date(date.valueOf());
  sunday.setDate(sunday.getDate() + 3);

  return {
    start: `${monday.getDate().toString().padStart(2, '0')}.${(monday.getMonth() + 1).toString().padStart(2, '0')}`,
    end: `${sunday.getDate().toString().padStart(2, '0')}.${(sunday.getMonth() + 1).toString().padStart(2, '0')}`
  };
}

/**
 * Получить диапазон дат для ТЕКУЩЕЙ календарной недели
 * @returns {Object} { start: string, end: string }
 */
function getCurrentWeekRange() {
  const today = new Date();
  const weekNum = getWeekOfMonth(today);
  return getWeekDateRange(today.getFullYear(), today.getMonth() + 1, weekNum);
}

/**
 * Получить количество недель в месяце (согласно правилу четверга)
 * @param {number} year - Год
 * @param {number} month - Месяц (1-12)
 * @returns {number} Количество недель (4 или 5)
 */
function getWeeksInMonth(year, month) {
  let count = 0;
  let date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    if (date.getDay() === 4) { // Четверг
      count++;
    }
    date.setDate(date.getDate() + 1);
  }
  return count;
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                          РАБОТА С ЧИСЛАМИ                                 ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Безопасный парсинг числа
 * @param {*} value - Значение для парсинга
 * @param {number} defaultValue - Значение по умолчанию
 * @returns {number}
 */

/**
 * Универсальный парсер чисел
 * Поддерживает: проценты (15% -> 0.15), пробелы, запятые/точки, NBSP
 */
/**
 * Сверх-надежный парсер чисел
 * Убирает валюты, пробелы, NBSP, проценты
 */
function parseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') return defaultValue;
  if (typeof value === 'number' && !isNaN(value)) return value;
  
  try {
    let str = String(value);
    
    // Обработка процентов
    let isPercent = str.includes('%');
    
    // Убираем всё КРОМЕ цифр, точки, запятой и минуса
    // Это удалит валюты ($, €, руб), пробелы, NBSP и т.д.
    str = str.replace(/[^\d.,\-]/g, '').replace(',', '.');
    
    if (!str || str === '.') return defaultValue;
    
    let result = parseFloat(str);
    if (isNaN(result)) return defaultValue;
    
    if (isPercent) result = result / 100;
    
    return result;
  } catch (e) {
    return defaultValue;
  }
}


/**
 * Расчет процентного изменения
 * @param {number} current - Текущее значение
 * @param {number} previous - Предыдущее значение
 * @returns {number} Процентное изменение
 */
function calculatePercentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Округление до заданного количества знаков
 * @param {number} value - Значение
 * @param {number} decimals - Количество знаков после запятой
 * @returns {number}
 */
function roundTo(value, decimals = 1) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                          РАБОТА СО СТРОКАМИ                               ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Экранирование HTML спецсимволов
 * @param {string} str - Строка
 * @returns {string} Экранированная строка
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Обрезать строку до максимальной длины
 * @param {string} str - Строка
 * @param {number} maxLength - Максимальная длина
 * @param {string} suffix - Суффикс при обрезке
 * @returns {string}
 */
function truncate(str, maxLength = 100, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                              ЛОГИРОВАНИЕ                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Логирование с уровнями
 */
const Log = {
  info: function(message, data) {
    Logger.log('[INFO] ' + message + (data ? ' | ' + JSON.stringify(data) : ''));
  },

  warn: function(message, data) {
    Logger.log('[WARN] ' + message + (data ? ' | ' + JSON.stringify(data) : ''));
  },

  error: function(message, error) {
    Logger.log('[ERROR] ' + message + (error ? ' | ' + error.message : ''));
    if (error && error.stack) {
      Logger.log('[STACK] ' + error.stack);
    }
  },

  debug: function(message, data) {
    if (CONFIG.DEBUG) {
      Logger.log('[DEBUG] ' + message + (data ? ' | ' + JSON.stringify(data) : ''));
    }
  }
};


// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                          РАБОТА С ОБЪЕКТАМИ                               ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * Глубокое слияние объектов
 * @param {Object} target - Целевой объект
 * @param {Object} source - Исходный объект
 * @returns {Object} Объединенный объект
 */
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * Проверка является ли значение объектом
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Получить значение по пути в объекте
 * @param {Object} obj - Объект
 * @param {string} path - Путь (например: 'projects.spinbetter.monthly.vch')
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*}
 */
function getByPath(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}
