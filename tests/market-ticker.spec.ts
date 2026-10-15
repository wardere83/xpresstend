import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page, baseURL }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await page.route(
    'https://xpresstend.shrill-king-ef4e.workers.dev/market/**',
    async (route) => {
      const url = new URL(route.request().url())
      const response = await page.request.get(
        new URL(url.pathname + url.search, baseURL).href,
      )
      await route.fulfill({ response })
    },
  )
  // CI verifies our integration deterministically. Production smoke checks the real provider.
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
})

test('the Dollar Index tape stays at the hero bottom and pause controls reach its isolated frame', async ({
  page,
}) => {
  await page.goto('/#/')
  const ticker = page.locator('.market-ticker')
  await expect(ticker).toHaveAttribute('data-ready', 'true')
  const frame = page.frameLocator('.market-ticker-frame')
  const widget = frame.locator('tv-ticker-tape')
  const symbols = (await widget.getAttribute('symbols'))!.split(',')
  expect(symbols.length).toBeGreaterThanOrEqual(3)
  expect(new Set(symbols)).toEqual(new Set(['PEPPERSTONE:USDX']))
  await expect(ticker).toContainText('USDX reference · Pepperstone CFD')
  await expect(page.locator('.market-ticker-frame')).toHaveAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox',
  )
  await page.getByRole('button', { name: 'Pause ticker', exact: true }).click()
  await expect(widget).toHaveAttribute('disable-scroll', '')
  await page.getByRole('button', { name: 'Play ticker', exact: true }).click()
  await expect(widget).not.toHaveAttribute('disable-scroll')
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    const geometry = await ticker.evaluate((el) => ({
      bottom: el.getBoundingClientRect().bottom,
      heroBottom: el.closest('.corporate-hero')!.getBoundingClientRect().bottom,
      pageWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }))
    expect(Math.abs(geometry.bottom - geometry.heroBottom)).toBeLessThanOrEqual(
      1,
    )
    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewport)
  }
})

test('saved and device motion preferences stop the Dollar Index tape', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/')
  const widget = page
    .frameLocator('.market-ticker-frame')
    .locator('tv-ticker-tape')
  await expect(widget).toHaveAttribute('disable-scroll', '')
  await expect(
    page.getByRole('button', { name: 'Play ticker', exact: true }),
  ).toBeDisabled()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() =>
    localStorage.setItem(
      'xpresstend.accessibility',
      JSON.stringify({ motion: 'reduce' }),
    ),
  )
  await page.reload()
  await expect(widget).toHaveAttribute('disable-scroll', '')
  await expect(
    page.getByRole('button', { name: 'Play ticker', exact: true }),
  ).toBeDisabled()
})
