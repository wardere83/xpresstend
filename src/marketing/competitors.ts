/**
 * Published remittance costs for the corridors XpressTend serves.
 *
 * EVERY figure here is sourced and dated. Nothing is estimated, rounded in our
 * favour, or invented. Naming a real competitor beside a number we made up
 * would be false advertising under the FTC Act and trade libel against them,
 * so the rule for this file is simple: if it cannot be cited, it does not ship.
 *
 * `totalCostPct` follows the World Bank convention. The transfer fee plus the
 * exchange-rate margin, expressed as a percentage of a 200 USD send. Because
 * comparing headline fees alone hides the margin, which is where most of the
 * real cost sits.
 *
 * These are point-in-time figures. Remittance pricing moves, so `asOf` is shown
 * next to every row in the UI and this table must be re-checked before it is
 * relied on in any advertising.
 */

export interface CompetitorRate {
  provider: string
  /** Fee plus FX margin as a percent of a 200 USD send, per the World Bank basis. */
  totalCostPct: number
  /** Exactly what the number represents, so it is never read as a live quote. */
  basis: string
  sourceLabel: string
  source: string
  asOf: string
  /** True when the figure excludes FX margin, so it flatters the competitor. */
  understated?: boolean
}

const WB_KE = 'https://remittanceprices.worldbank.org/corridor/United-States/Kenya'
const WB_SO = 'https://remittanceprices.worldbank.org/corridor/United-States/Somalia'
const WB_MAIN = 'https://remittanceprices.worldbank.org/'

/** Keyed by receive-country ISO code. */
export const COMPETITOR_RATES: Record<string, CompetitorRate[]> = {
  SO: [
    {
      provider: 'Dahabshiil',
      totalCostPct: 6.0,
      basis: 'Fee of $30.00, total cost 6.00% of the transfer',
      sourceLabel: 'World Bank, US to Somalia',
      source: WB_SO,
      asOf: '2026',
    },
  ],
  KE: [
    {
      provider: 'Walmart2World',
      totalCostPct: 1.4,
      basis: 'Total cost including FX margin',
      sourceLabel: 'World Bank, US to Kenya',
      source: WB_KE,
      asOf: 'Nov 2024',
    },
    {
      provider: 'MoneyGram',
      totalCostPct: 2.3,
      basis: 'Total cost including FX margin',
      sourceLabel: 'World Bank, US to Kenya',
      source: WB_KE,
      asOf: 'Nov 2024',
    },
    {
      provider: 'Western Union',
      totalCostPct: 4.02,
      basis: 'Total cost including FX margin',
      sourceLabel: 'World Bank, US to Kenya',
      source: WB_KE,
      asOf: 'Nov 2024',
    },
    {
      provider: 'Sendwave',
      totalCostPct: 4.24,
      basis: 'Total cost including FX margin',
      sourceLabel: 'World Bank, US to Kenya',
      source: WB_KE,
      asOf: 'Nov 2024',
    },
  ],
  ET: [
    {
      provider: 'Remitly',
      totalCostPct: 1.0,
      basis: 'Published $1.99 bank-deposit fee only. Excludes FX margin, so the true cost is higher',
      sourceLabel: 'Remitly published fees',
      source: 'https://www.remitly.com/us/en/money-transfer/send-money-to-ethiopia',
      asOf: 'Aug 2026',
      understated: true,
    },
  ],
  MX: [
    {
      provider: 'US market average',
      totalCostPct: 5.04,
      basis: 'Average cost of sending from the United States, all providers',
      sourceLabel: 'World Bank Remittance Prices Worldwide',
      source: WB_MAIN,
      asOf: 'Q1 2025',
    },
  ],
  BR: [
    {
      provider: 'US market average',
      totalCostPct: 5.04,
      basis: 'Average cost of sending from the United States, all providers',
      sourceLabel: 'World Bank Remittance Prices Worldwide',
      source: WB_MAIN,
      asOf: 'Q1 2025',
    },
  ],
}

/** Corridors we have not yet sourced provider-level pricing for. */
export function hasComparison(receiveCountry: string): boolean {
  return (COMPETITOR_RATES[receiveCountry]?.length ?? 0) > 0
}
