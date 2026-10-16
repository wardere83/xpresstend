import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'

export const MARKET_ORIGIN =
  'https://xpresstend-market.shrill-king-ef4e.workers.dev'

const assets: Record<string, [string, string]> = {
  '/dollar-index': ['dollar-index.html', 'text/html'],
  '/dollar-index.html': ['dollar-index.html', 'text/html'],
  '/dollar-index.css': ['dollar-index.css', 'text/css'],
  '/dollar-index.js': ['dollar-index.js', 'application/javascript'],
}

/** Keep CI offline while exercising the real isolated frame and its messages. */
export async function mockMarket(page: Page) {
  await page.route(`${MARKET_ORIGIN}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname
    const asset = assets[path]
    if (!asset) return route.abort('failed')
    const [name, contentType] = asset
    await route.fulfill({
      contentType,
      body: await readFile(
        new URL(`../../public/market/${name}`, import.meta.url),
      ),
    })
  })
  // Real provider quotes and motion are checked by the production smoke test.
  await page.route(
    'https://widgets.tradingview-widget.com/w/**/tv-ticker-tape.js',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: `customElements.define('tv-ticker-tape', class extends HTMLElement {
          connectedCallback() { this.textContent = 'USDX test fixture · TradingView'; }
        });`,
      }),
  )
}
