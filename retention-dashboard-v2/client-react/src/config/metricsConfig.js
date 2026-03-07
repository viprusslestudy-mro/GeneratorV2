/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  metricsConfig.js - Единый конфигуратор метрик для Finance
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const FINANCE_TABLE_CONFIGS = {
  deposits: [
    { key: 'total_deposits_count', label: 'Тотал к-ство депозитов', format: 'integer' },
    { key: 'total_deposits_amount', label: 'Тотал сумма депозитов', format: 'currency' },
    { key: 'avg_deposits_per_day', label: 'Ср. к-ство депозитов / день', format: 'decimal' },
    { key: 'avg_deposits_amount_per_day', label: 'Ср. сумма депозитов / день', format: 'currency' },
    { key: 'ftd_amount', label: 'Сумма ФТД', format: 'currency' },
    { key: 'redep_1m_amount', label: 'Сумма редеп 1м', format: 'currency' },
    { key: 'redep_1m_ratio', label: 'Редеп 1м / ФТД', format: 'percent' },
    { key: 'redep_1m_plus_amount', label: 'Сумма редеп 1м+', format: 'currency' },
    { key: 'redep_1m_plus_ratio', label: 'Редеп 1м+ / к Тотал сумма деп', format: 'percent' }
  ],
  casino: [
    { key: 'casino_stake_amount', label: 'Тотал сумма ставок КАЗИНО', format: 'currency' },
    { key: 'casino_stake_count', label: 'Тотал к-ство ставок КАЗИНО', format: 'integer' },
    { key: 'casino_bet_profit', label: 'Тотал Bet Profit КАЗИНО', format: 'currency' },
    { key: 'casino_avg_stake_per_day', label: 'Ср. сумма ставок КАЗИНО / день', format: 'currency' },
    { key: 'casino_avg_count_per_day', label: 'Ср. к-ство ставок КАЗИНО / день', format: 'decimal' },
    { key: 'casino_avg_bettors_per_day', label: 'Ср. к-ство ставочников КАЗИНО / день', format: 'decimal' }
  ],
  sport: [
    { key: 'sport_stake_amount', label: 'Тотал сумма ставок СПОРТ', format: 'currency' },
    { key: 'sport_stake_count', label: 'Тотал к-ство ставок СПОРТ', format: 'integer' },
    { key: 'sport_bet_profit', label: 'Тотал Bet Profit СПОРТ', format: 'currency' },
    { key: 'sport_avg_stake_per_day', label: 'Ср. сумма ставок СПОРТ / день', format: 'currency' },
    { key: 'sport_avg_count_per_day', label: 'Ср. к-ство ставок СПОРТ / день', format: 'decimal' },
    { key: 'sport_avg_bettors_per_day', label: 'Ср. к-ство ставочников СПОРТ / день', format: 'decimal' }
  ],
  profit: [
    { key: 'total_profit', label: 'Тотал профит', format: 'currency' },
    { key: 'avg_profit_per_day', label: 'Ср. профит / день', format: 'currency' },
    { key: 'bonuses_issued', label: 'Выданные бонусы', format: 'currency' },
    { key: 'bonus_to_deposits_ratio', label: '% бонусов к депозитам', format: 'percent' }
  ]
};