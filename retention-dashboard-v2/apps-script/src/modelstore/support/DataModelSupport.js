/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATAMODELSUPPORT.gs - Модели данных для Support отчетов
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Создать пустую структуру KPI LiveChat
 */
function createEmptyLiveChatKPI() {
  return {
    totalChats: 0,
    chatSatisfaction: 0,
    firstResponseTime: 0, // new
    avgResponseTime: 0,   // new
    avgChatDuration: 0,
    missedChats: 0,      // new
    ratedGood: 0,
    ratedBad: 0,
    
    // Trends (percentage change)
    totalChatsTrend: 0,
    chatSatisfactionTrend: 0,
    firstResponseTimeTrend: 0,
    avgResponseTimeTrend: 0,
    missedChatsTrend: 0,
    
    // Weekly Data from KPI Sheet
    weeklyKPI: [], // Array of { label: 'Week #1', totalChats: 123, ... }
    
    // Breakdown by locale
    byLocale: {} // e.g. { 'DE': { totalChats: 0, ... }, 'EN': { ... } }
  };
}

/**
 * Создать пустую структуру статистики тегов
 */
function createEmptyTagsStatistic() {
  return {
    totalCount: 0,
    categories: [],
    byGeo: {},
    byWeek: {}
  };
}

/**
 * Создать пустую структуру HelpDesk
 */
function createEmptyHelpDeskStats() {
  return {
    totalTickets: 0,
    byWeek: {},
    byCategory: {}
  };
}

/**
 * Создать пустую структуру всех данных Support
 */
function createEmptySupportData() {
  return {
    liveChat: createEmptyLiveChatKPI(),
    tags: createEmptyTagsStatistic(),
    helpDesk: createEmptyHelpDeskStats(),
    period: {
      label: 'Текущий месяц',
      startDate: null,
      endDate: null
    }
  };
}

/**
 * Создать структуру Support отчета для JSON
 * Support НЕ использует activeMonths - работает с текущим периодом
 * @param {Object} supportData - Данные из collectSupportData()
 */
function createSupportReportJSON(supportData) {
  const now = new Date();
  
  // Берем период из данных, если он определен, иначе заглушка
  const periodLabel = supportData.period && supportData.period.label 
                      ? supportData.period.label 
                      : getCurrentMonthLabel();

  return {
    project: "RETENZA",
    source: "support",
    reportTitle: "Support Dashboard",
    
    // Динамический список локалей
    locales: getSupportLocalesFromLiveChat(supportData.liveChat),
    
    description: "Аналитика службы поддержки",
    generatedAt: now.toISOString(),
    
    // ВАЖНО: Передаем весь объект периода (label, year, dates)
    period: supportData.period, 
    
    // Список доступных периодов для сайдбара (с флагами)
    availablePeriods: (supportData.availablePeriods || []).map(function(p) {
      return {
        label: p.label,
        key: p.key,
        hasKPI: p.hasKPI,
        hasTags: p.hasTags
      };
    }),
    
    // Дублируем label для удобства в HTML (backward compatibility)
    periodLabel: periodLabel,

    kpiCards: createSupportKPICards(supportData),
    charts: {
      geoDistribution: createGeoDistributionData(supportData),
      topCategories: createTopCategoriesData(supportData),
      satisfactionBreakdown: createSatisfactionData(supportData),
      chatsTrend: createChatsTrendData(supportData)
    },
    // Expose raw data structures at root level for HTMLBuilder compatibility
    liveChat: supportData.liveChat,
    tags: supportData.tags,
    helpDesk: supportData.helpDesk,
    
    tagsTable: supportData.tags,
    rawData: supportData
  };
}

/**
 * Создать KPI карточки для Support
 * Now injects trendData from weeklyKPI for sparklines
 */
function createSupportKPICards(data) {
  const weekly = data.liveChat.weeklyKPI || [];
  
  // Helper to extract trend array (e.g. [10, 12, 15, 9])
  const getTrend = (field) => weekly.map(w => w[field] || 0);

  const cards = [
    { 
        id: 'first_response', 
        title: 'First Response', 
        value: data.liveChat.firstResponseTime || 0, 
        trend: data.liveChat.firstResponseTimeTrend || 0,
        icon: 'bolt', 
        valueFormat: 'decimal', 
        suffix: 's',
        trendData: getTrend('firstResponseTime') 
    },
    { 
        id: 'avg_response', 
        title: 'Avg Response', 
        value: data.liveChat.avgResponseTime || 0, 
        trend: data.liveChat.avgResponseTimeTrend || 0,
        icon: 'clock', 
        valueFormat: 'decimal', 
        suffix: 's',
        trendData: getTrend('avgResponseTime')
    },
    { 
        id: 'total_chats', 
        title: 'Total Chats', 
        value: data.liveChat.totalChats || 0, 
        trend: data.liveChat.totalChatsTrend || 0,
        icon: 'comments', 
        valueFormat: 'integer',
        trendData: getTrend('totalChats')
    },
    { 
        id: 'chat_satisfaction', 
        title: 'Satisfaction', 
        value: data.liveChat.chatSatisfaction || 0, 
        trend: data.liveChat.chatSatisfactionTrend || 0,
        icon: 'smile', 
        valueFormat: 'percent',
        trendData: [], // Satisfaction has special donut
        ratedGood: data.liveChat.ratedGood,
        ratedBad: data.liveChat.ratedBad,
        goodCount: data.liveChat.ratedGood || 0,
        badCount: data.liveChat.ratedBad || 0
    },
    { 
        id: 'avg_duration', 
        title: 'Chat Duration', 
        value: data.liveChat.avgChatDuration || 0, 
        trend: data.liveChat.avgChatDurationTrend || 0,
        icon: 'hourglass-half', 
        valueFormat: 'decimal', 
        suffix: 'm',
        trendData: getTrend('avgChatDuration')
    },
    { 
        id: 'missed_chats', 
        title: 'Missed Chats', 
        value: data.liveChat.missedChats || 0, 
        trend: data.liveChat.missedChatsTrend || 0,
        icon: 'exclamation-circle', 
        valueFormat: 'integer',
        trendData: getTrend('missedChats')
    }
  ];

    // Limit to top 5 cards for the main view as per design requirements
    // 1. Total Chats
    // 2. First Response
    // 3. Avg Response
    // 4. Chat Duration
    // 5. Satisfaction
    return cards;
}

/**
 * Создать данные распределения по GEO
 */
function createGeoDistributionData(data) {
  const byGeo = data.tags.byGeo || {};
  const labels = Object.keys(byGeo).filter(k => k !== 'ALL GEO');
  const values = labels.map(k => byGeo[k] || 0);
  
  return { labels: labels, values: values, total: byGeo['ALL GEO'] || 0 };
}

/**
 * Создать данные топ категорий
 */
function createTopCategoriesData(data) {
  const categories = data.tags.categories || [];
  const sorted = [...categories].sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 10);
  
  return { labels: sorted.map(c => c.name), values: sorted.map(c => c.total || 0) };
}

/**
 * Создать данные Satisfaction
 */
function createSatisfactionData(data) {
  const good = data.liveChat.ratedGood || 0;
  const bad = data.liveChat.ratedBad || 0;
  
  return { labels: ['Good', 'Bad'], values: [good, bad] };
}

/**
 * Создать данные тренда чатов
 * Prefer weeklyKPI from LiveChat (KPI Sheet) if available, otherwise fallback to HelpDesk/Tags
 */
function createChatsTrendData(data) {
  const chartData = [];
  
  // 1. Try LiveChat Weekly KPI (Primary source from KPI Sheet)
  if (data.liveChat && data.liveChat.weeklyKPI && data.liveChat.weeklyKPI.length > 0) {
     data.liveChat.weeklyKPI.forEach(week => {
         chartData.push({
             label: week.label, // "Week #1"
             value: week.totalChats,
             dates: week.dates,
             trend: week.trend || 0
         });
     });
     return chartData;
  }

  // 2. Fallback: HelpDesk byWeek (from Tags sheet - often empty)
  const byWeek = data.helpDesk.byWeek || {};
  
  Object.keys(byWeek).sort().forEach(key => {
    chartData.push({
      label: key,
      value: byWeek[key]
    });
  });
  
  return chartData;
}

/**
 * Получить список локалей из liveChat данных
 */
function getSupportLocalesFromLiveChat(liveChat) {
  var locales = [];
  
  if (liveChat && liveChat.byLocale) {
    Object.keys(liveChat.byLocale).forEach(function(loc) {
      if (liveChat.byLocale[loc].totalChats > 0) {
        locales.push(loc);
      }
    });
    
    // Сортируем по убыванию чатов
    locales.sort(function(a, b) {
      return (liveChat.byLocale[b].totalChats || 0) - (liveChat.byLocale[a].totalChats || 0);
    });
  }
  
  return locales;
}