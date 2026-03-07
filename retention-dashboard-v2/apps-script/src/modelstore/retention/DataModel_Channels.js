/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATAMODEL_CHANNELS.js - Модели данных Channel метрик
 *  Tab: Ret. CHANNEL METRICS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Создать пустую структуру метрик канала
 */
function createEmptyChannelMetrics() {
  return {};
}

/**
 * Создать пустую структуру каналов коммуникации
 */
function createEmptyRetentionChannels() {
  return {
    months: [],
    byChannel: {}
  };
}

/**
 * Вспомогательная функция для создания заглушки отключенных каналов
 */
function createDisabledChannelCards(channels) {
  var res = {};
  Object.keys(channels.byChannel || {}).forEach(function(chKey) {
    res[chKey] = { fullyDisabled: true, cards: [] };
  });
  return res;
}

/**
 * Рассчитывает суммарные показатели по всем каналам для одного месяца
 */
function calculateTotalChannelMetrics(channelCards) {
  var totals = { sent: 0, conversions: 0, click: 0 };
  var hasData = { sent: false, conversions: false, click: false };
  
  Object.keys(channelCards).forEach(function(chKey) {
    if (chKey === 'total') return; // Исключаем pseudo-channel Total из агрегации
    var cards = channelCards[chKey].cards || [];
    cards.forEach(function(card) {
      if (card.disabled) return;
      
      var metricKey = card.id.split('_')[1];
      if (totals.hasOwnProperty(metricKey)) {
        var val = card.value;
        if (val !== null && val !== undefined) {
          totals[metricKey] += Number(val);
          hasData[metricKey] = true;
        }
      }
    });
  });
  
  Object.keys(totals).forEach(function(key) {
    if (!hasData[key]) totals[key] = null;
  });
  
  return totals;
}

/**
 * Создать карточки канальных метрик
 */
function createChannelCards(channels, monthIndex) {
  var result = {};

  var metricFormatMap = {
    'sent': 'integer', 'delivered': 'integer', 'deliveryRate': 'percent',
    'opened': 'integer', 'openRate': 'percent',
    'click': 'integer', 'clicked': 'integer', 'clickRate': 'percent',
    'conversions': 'integer', 'conversionRate': 'percent',
    'convertRate': 'percent',
    'calls': 'integer', 'successCalls': 'integer', 'successRate': 'percent',
    'interested': 'integer', 'interestedRate': 'percent',
    'contacts': 'integer', 'reply': 'integer', 'replyRate': 'percent',
    'reactivations': 'integer', 'reactivationRate': 'percent', 'reactivatedSum': 'currency',
    'totalContacts': 'integer', 'totalConversions': 'integer',
    'totalConversionRate': 'percent', 'totalClicks': 'integer'
  };

  Object.keys(channels.byChannel || {}).forEach(function(channelKey) {
    var channel = channels.byChannel[channelKey];
    var chMeta = CHANNEL_META[channelKey] || { name: channelKey, icon: '📊' };

    if (!channel || !channel.metrics) {
      result[channelKey] = {
        name: chMeta.name,
        icon: chMeta.icon,
        cards: [],
        fullyDisabled: true
      };
      return;
    }

    var cards = [];
    var allDisabled = true;
    var metricLabels = channel.metricLabels || {};
    // ✅ UI labels из конфига (Ret. CHANNEL METRICS)
    var metricUiLabels = (typeof CHANNEL_METRIC_LABELS !== 'undefined' && CHANNEL_METRIC_LABELS[channelKey])
      ? CHANNEL_METRIC_LABELS[channelKey]
      : {};

    Object.keys(channel.metrics).forEach(function(metricKey) {
      var series = channel.metrics[metricKey];
      if (!series) return;

      // ★ TEMP DEBUG: что реально в series?
      if (channelKey === 'push' && metricKey === 'sent') {
        Logger.log('[DEBUG createChannelCards] push.sent values=' + JSON.stringify(series.values));
        Logger.log('[DEBUG createChannelCards] push.sent diffs=' + JSON.stringify(series.diffs));
      }

      var baseKeyNoDigits = String(metricKey || '').replace(/\d+$/g, '');
      var format =
        metricFormatMap[metricKey] ||
        metricFormatMap[baseKeyNoDigits] ||
        'integer';

      // ★ Автоопределение формата для неизвестных метрик
      if (!metricFormatMap[metricKey] && !metricFormatMap[baseKeyNoDigits]) {
        var keyLow = String(metricKey || '').toLowerCase();
        var keyLowBase = String(baseKeyNoDigits || '').toLowerCase();

        var probe = keyLow + ' ' + keyLowBase;

        if (probe.indexOf('rate') !== -1 || probe.indexOf('%') !== -1) {
          format = 'percent';
        } else if (probe.indexOf('sum') !== -1 || probe.indexOf('сумм') !== -1) {
          format = 'currency';
        }
      }

      // Проверяем: метрика полностью отключена (ВСЕ значения null)?
      var hasAnyEnabled = false;
      if (series && series.values && series.values.length > 0) {
        for (var i = 0; i < series.values.length; i++) {
          if (series.values[i] !== null && series.values[i] !== undefined) {
            hasAnyEnabled = true;
            break;
          }
        }
      }

      // Все значения null → метрика полностью OFF
      if (!hasAnyEnabled) {
        // ✅ ИСПРАВЛЕНО: проверяем настройку show_empty_metrics
        var showEmpty = (typeof getShowEmptyMetrics === 'function') ? getShowEmptyMetrics() : false;
        
        if (!showEmpty) {
          Logger.log('[createChannelCards] SKIP metric (all null): ' + channelKey + '.' + metricKey);
          return; // Не показываем метрику
        } else {
          Logger.log('[createChannelCards] SHOW metric (all null, but show_empty_metrics=ON): ' + 
            channelKey + '.' + metricKey);
          // Продолжаем — покажем с disabled=true
        }
      }

      // ★ DEBUG: метрика прошла фильтр
      if (channelKey === 'push') {
        Logger.log('[createChannelCards] PASSED metric: ' + channelKey + '.' + metricKey +
          ' monthIndex=' + monthIndex +
          ' values=' + JSON.stringify(series.values));
      }

      var value = null;
      var diff = '';
      var disabled = true;

      if (series && series.values) {
        if (monthIndex < series.values.length) {
          var rawVal = series.values[monthIndex];
          if (rawVal === null || rawVal === undefined) {
            // null = отключено для этого месяца
            disabled = true;
            value = null;
          } else {
            // Реальное значение (может быть 0 — это нормально)
            value = rawVal;
            disabled = false;
            allDisabled = false;
          }
        }
        if (!disabled && series.diffs && monthIndex < series.diffs.length) {
          diff = series.diffs[monthIndex] || '';
        }
      }

      // ✅ 1) UI label из Ret. CHANNEL METRICS (cfg.name)
      // ✅ 2) затем raw label из исходного листа (metricLabels)
      // ✅ 3) затем fallback: внутренний ключ
      var title =
        metricUiLabels[metricKey] ||
        metricLabels[metricKey]   ||
        metricKey;

      cards.push({
        id: channelKey + '_' + metricKey,
        title: title,
        value: value,
        disabled: disabled,
        diff: disabled ? '' : diff,
        valueFormat: format,
        order: cards.length + 1
      });
    });

    result[channelKey] = {
      name: chMeta.name,
      icon: chMeta.icon,
      cards: cards,
      fullyDisabled: allDisabled || cards.length === 0
    };
  });

  return result;
}