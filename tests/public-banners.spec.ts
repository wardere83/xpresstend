import { expect, test } from '@playwright/test'
import { mockMarket } from './fixtures/market'

for (const language of ['en', 'es', 'pt-BR', 'ar']) {
  test(`the ${language} landing ticker fits the first view and public banners share one geometry`, async ({
    page,
  }) => {
    test.setTimeout(90000)
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
    )
    await mockMarket(page)
    await page.addInitScript(
      (language) => localStorage.setItem('xpresstend.lang', language),
      language,
    )
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    for (const [width, height] of [
      [1440, 900],
      [768, 1024],
      [390, 844],
      [320, 720],
    ]) {
      await page.setViewportSize({ width, height })
      await page.goto(`/?banner=${language}-${width}-home#/`)
      await expect(page.locator('.market-ticker')).toHaveAttribute(
        'data-ready',
        'true',
      )
      await page.evaluate(() => document.fonts.ready)
      const landing = await page
        .locator('.corporate-hero')
        .evaluate((element) => {
          const box = element.getBoundingClientRect(),
            copy = element
              .querySelector('.corporate-hero-copy')!
              .getBoundingClientRect(),
            ticker = element
              .querySelector('.market-ticker')!
              .getBoundingClientRect()
          return {
            height: box.height,
            top: box.top,
            bottom: box.bottom,
            copyTop: copy.top,
            copyBottom: copy.bottom,
            tickerTop: ticker.top,
            tickerBottom: ticker.bottom,
            viewport: innerHeight,
            pageWidth: document.documentElement.scrollWidth,
          }
        })
      expect(landing.bottom).toBeLessThanOrEqual(height + 1)
      expect(landing.copyTop).toBeGreaterThanOrEqual(landing.top)
      expect(landing.copyBottom).toBeLessThanOrEqual(landing.tickerTop)
      expect(
        Math.abs(landing.bottom - landing.tickerBottom),
      ).toBeLessThanOrEqual(1)
      expect(landing.pageWidth).toBeLessThanOrEqual(width)
      if (width === 1440) expect(landing.height).toBe(474)
      await expect(page.locator('.corporate-globe svg')).toBeVisible()
      let companyHeight: number | undefined
      for (const route of [
        'company',
        'philanthropy',
        'compliance',
        'security',
      ]) {
        await page.goto(`/?banner=${language}-${width}-${route}#/${route}`)
        await expect(page.locator('.institutional-hero h1')).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        const hero = page.locator('.institutional-hero')
        const geometry = await hero.evaluate((element) => {
          const box = element.getBoundingClientRect(),
            copy = element
              .querySelector('.institutional-hero-copy')!
              .getBoundingClientRect(),
            orbit = element
              .querySelector('.compliance-orbit')!
              .getBoundingClientRect()
          return {
            height: box.height,
            top: box.top,
            bottom: box.bottom,
            copyTop: copy.top,
            copyBottom: copy.bottom,
            orbitTop: orbit.top,
            orbitBottom: orbit.bottom,
            pageWidth: document.documentElement.scrollWidth,
          }
        })
        companyHeight ??= geometry.height
        expect(geometry.height).toBe(width <= 700 ? 480 : 324)
        expect(geometry.height, `${route} banner height`).toBe(companyHeight)
        expect(geometry.pageWidth).toBeLessThanOrEqual(width)
        expect(geometry.copyTop).toBeGreaterThanOrEqual(geometry.top + 4)
        expect(geometry.copyBottom).toBeLessThanOrEqual(geometry.bottom - 4)
        expect(geometry.orbitTop).toBeGreaterThanOrEqual(geometry.top + 4)
        expect(geometry.orbitBottom).toBeLessThanOrEqual(geometry.bottom - 4)
        if (width <= 700)
          expect(geometry.copyBottom).toBeLessThanOrEqual(geometry.orbitTop - 4)
        const rings = hero.locator('.compliance-orbit-ring')
        await expect(rings).toHaveCount(3)
        for (const ring of await rings.all())
          await expect(ring).toHaveCSS('animation-iteration-count', 'infinite')
        await expect(hero.locator('.compliance-orbit-core')).toHaveCSS(
          'transform',
          'none',
        )
      }
    }
  })
}
