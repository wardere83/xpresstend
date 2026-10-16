import { expect, test } from '@playwright/test'
import { MARKET_ORIGIN, mockMarket } from './fixtures/market'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await mockMarket(page)
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
  expect(
    new URL((await page.locator('.market-ticker-frame').getAttribute('src'))!)
      .origin,
  ).toBe(MARKET_ORIGIN)
  expect(new URL(page.url()).origin).not.toBe(MARKET_ORIGIN)
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

for (const [language, documentLanguage, providerLanguage] of [
  ['en', 'en', 'en'],
  ['es', 'es', 'es'],
  ['pt-BR', 'pt', 'br'],
  ['ar', 'ar', 'ar_AE'],
]) {
  test(`the Dollar Index frame uses a supported provider locale for ${language}`, async ({
    page,
  }) => {
    await page.addInitScript(
      (language) => localStorage.setItem('xpresstend.lang', language),
      language,
    )
    const provider = page.waitForRequest(
      `https://widgets.tradingview-widget.com/w/${providerLanguage}/tv-ticker-tape.js`,
    )
    await page.goto('/#/')
    await provider
    await expect(page.locator('.market-ticker')).toHaveAttribute(
      'data-ready',
      'true',
    )
    await expect(
      page.frameLocator('.market-ticker-frame').locator('html'),
    ).toHaveAttribute('lang', documentLanguage)
  })
}

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

for (const [origin, embedded] of [
  ['https://xpresstend.shrill-king-ef4e.workers.dev', true],
  ['https://unlisted-preview.example.invalid', false],
] as const) {
  test(`the ticker ${embedded ? 'embeds on the configured Worker preview' : 'offers a usable quote link on an unlisted origin'}`, async ({
    page,
    baseURL,
  }) => {
    await page.route(`${origin}/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.startsWith('/api/')) return route.fallback()
      const response = await page.request.get(
        new URL(url.pathname + url.search, baseURL).href,
      )
      await route.fulfill({ response })
    })
    await page.goto(`${origin}/#/`)
    if (embedded) {
      // The fixture applies the real frame-ancestors policy to this document.
      await expect(page.locator('.market-ticker')).toHaveAttribute(
        'data-ready',
        'true',
      )
      await expect(page.locator('.market-ticker-frame')).toHaveCount(1)
    } else {
      await expect(page.locator('.market-ticker-frame')).toHaveCount(0)
      await expect(page.locator('.market-ticker-fallback')).toHaveAttribute(
        'href',
        'https://www.tradingview.com/symbols/PEPPERSTONE-USDX/',
      )
      await expect(page.locator('.market-ticker-fallback')).toBeVisible()
      await expect(page.locator('.market-ticker-pause')).toBeDisabled()
    }
  })
}
