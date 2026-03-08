/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  metricsConfig.js - Единый конфигуратор метрик для Finance
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const FINANCE_TABLE_CONFIGS = {
  deposits: [
    { key: 'total_deposits_count', label: 'Тотал кол-во депозитов', format: 'integer' },
    { key: 'total_deposits_amount', label: 'Тотал сумма депозитов', format: 'currency' },
    { key: 'avg_deposits_per_day', label: 'Ср. кол-во депозитов / день', format: 'decimal' },
    { key: 'avg_deposits_amount_per_day', label: 'Ср. сумма депозитов / день', format: 'currency' },
    { key: 'ftd_amount', label: 'Сумма ФТД', format: 'currency' },
    { key: 'redep_1m_amount', label: 'Сумма редеп 1м', format: 'currency' },
    { key: 'redep_1m_ratio', label: 'Редеп 1м / ФТД (%)', format: 'percent' },
    { key: 'redep_1m_plus_amount', label: 'Сумма редеп 1м+', format: 'currency' },
    { key: 'redep_1m_plus_ratio', label: 'Редеп 1м+ / Тотал сумма деп (%)', format: 'percent' }
  ],
  casino: [
    { key: 'casino_stake_amount', label: 'Тотал сумма ставок', format: 'currency' },
    { key: 'casino_stake_count', label: 'Тотал кол-во ставок', format: 'integer' },
    { key: 'casino_bet_profit', label: 'Тотал Bet Profit', format: 'currency' },
    { key: 'casino_avg_stake_per_day', label: 'Ср. сумма ставок / день', format: 'currency' },
    { key: 'casino_avg_count_per_day', label: 'Ср. кол-во ставок / день', format: 'decimal' },
    { key: 'casino_avg_bettors_per_day', label: 'Ср. кол-во ставочников / день', format: 'decimal' }
  ],
  sport: [
    { key: 'sport_stake_amount', label: 'Тотал сумма ставок', format: 'currency' },
    { key: 'sport_stake_count', label: 'Тотал кол-во ставок', format: 'integer' },
    { key: 'sport_bet_profit', label: 'Тотал Bet Profit', format: 'currency' },
    { key: 'sport_avg_stake_per_day', label: 'Ср. сумма ставок / день', format: 'currency' },
    { key: 'sport_avg_count_per_day', label: 'Ср. кол-во ставок / день', format: 'decimal' },
    { key: 'sport_avg_bettors_per_day', label: 'Ср. кол-во ставочников / день', format: 'decimal' }
  ],
  profit: [
    { key: 'total_profit', label: 'Тотал профит', format: 'currency' },
    { key: 'avg_profit_per_day', label: 'Ср. профит / день', format: 'currency' },
    { key: 'bonuses_issued', label: 'Выданные бонусы', format: 'currency' },
    { key: 'bonus_to_deposits_ratio', label: 'Бонусы к депозитам (%)', format: 'percent' }
  ],
  structure: [
    { key: 'total_stake_amount', label: 'Тотал сумма ставок (все)', format: 'currency' },
    { key: 'sport_stake_percent', label: '% сумма СПОРТ', format: 'percent' },
    { key: 'casino_stake_percent', label: '% сумма КАЗИНО', format: 'percent' }
  ]
};