import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockMarket } from './fixtures/market'

const corporateRoutes = ['company', 'philanthropy', 'compliance', 'security']

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await mockMarket(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
})

async function frames(page: Page, count = 5) {
  await page.evaluate(async (count) => {
    for (let frame = 0; frame < count; frame++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }, count)
}

async function frozenGlobe(page: Page, globe: Locator) {
  await expect(globe).toHaveAttribute('data-animation-state', 'reduced-motion')
  const longitude = await globe.getAttribute('data-longitude')
  const land = await globe.locator('.xt-globe-land').getAttribute('d')
  await frames(page)
  expect(await globe.getAttribute('data-longitude')).toBe(longitude)
  expect(await globe.locator('.xt-globe-land').getAttribute('d') === land).toBe(true)
}

test('all corporate globes share the main globe geography without routes, controls or dragging', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/')
  const mainLand = await page.locator('.xt-globe-land').getAttribute('d')
  expect(mainLand!.length).toBeGreaterThan(1000)
  for (const route of corporateRoutes) {
    await page.goto(`/#/${route}`)
    const globe = page.locator('.compliance-orbit .xt-globe')
    await expect(globe).toHaveAttribute('data-globe-variant', 'ambient')
    await expect(globe).toBeVisible()
    await frozenGlobe(page, globe)
    expect(await globe.locator('.xt-globe-land').getAttribute('d') === mainLand).toBe(true)
    await expect(globe.locator(
      '.xt-globe-grid,.xt-globe-connections,.xt-globe-nodes,.xt-globe-particles,.xt-globe-intro,button,[tabindex],[role="group"]',
    )).toHaveCount(0)
    const surface = globe.locator('.xt-globe-surface')
    await expect(surface).toHaveCSS('pointer-events', 'none')
    const bounds = (await surface.boundingBox())!
    const y = bounds.y + bounds.height / 2
    await page.mouse.move(bounds.x + bounds.width * 0.25, y)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width * 0.75, y, { steps: 8 })
    await page.mouse.up()
    expect(await globe.locator('.xt-globe-land').getAttribute('d') === mainLand).toBe(true)
  }
})

test('corporate globes loop at the same geographic rotation tempo as the main globe', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const startTime = new Date('2026-10-18T12:00:00Z')
  await page.clock.install({ time: startTime })
  const rates: number[] = []
  for (const route of ['', ...corporateRoutes]) {
    await page.goto(`/#/${route}`)
    const globe = page.locator('figure.xt-globe')
    await expect(globe).toHaveAttribute('data-animation-state', 'playing')
    // Lazy route loading needs its timers to run before pausing the clock.
    // Freeze only after the globe has mounted and is ready to animate.
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 10000))
    // runFor advances every RAF rather than skipping frames, so we measure
    // geographic degrees per second independently of CI wall-clock load.
    const before = Number(await globe.getAttribute('data-longitude'))
    const time = await page.evaluate(() => performance.now())
    await page.clock.runFor(1600)
    const seconds = (await page.evaluate(() => performance.now()) - time) / 1000
    const after = Number(await globe.getAttribute('data-longitude'))
    const rate = ((after - before + 360) % 360) / seconds
    expect(Math.abs(rate - 3.6), `${route || 'home'} degrees per second`).toBeLessThan(0.2)
    rates.push(rate)
    await page.clock.resume()
  }
  for (const rate of rates.slice(1))
    expect(Math.abs(rate - rates[0])).toBeLessThan(0.15)
})

for (const lang of ['en', 'ar']) {
  test(`the ${lang} corporate globes fit desktop and mobile and follow system and saved motion preferences`, async ({
    page,
  }) => {
    test.setTimeout(90000)
    await page.addInitScript(
      (lang) => localStorage.setItem('xpresstend.lang', lang),
      lang,
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      for (const route of corporateRoutes) {
        await page.goto(`/#/${route}`)
        const globe = page.locator('.compliance-orbit .xt-globe')
        await expect(globe).toBeVisible()
        const bounds = (await globe.boundingBox())!
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        await expect(page.locator('.institutional-hero h1')).toBeVisible()
        await frozenGlobe(page, globe)
      }
    }
    await page.goto('/#/compliance')
    const globe = page.locator('.compliance-orbit .xt-globe')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(globe).toHaveAttribute('data-animation-state', 'playing')
    const moving = await globe.getAttribute('data-longitude')
    await expect.poll(() => globe.getAttribute('data-longitude')).not.toBe(moving)

    // Exercise the actual accessibility setting, including persistence and
    // restoration, rather than mutating the motion attribute from the test.
    await page.locator('.a11y-launcher').click()
    const panel = page.locator('.a11y-dialog')
    const motion = panel.getByLabel(lang === 'ar' ? 'الحركة' : 'Motion', { exact: true })
    await motion.selectOption('reduce')
    await page.keyboard.press('Escape')
    await frozenGlobe(page, globe)
    await page.reload()
    await frozenGlobe(page, globe)
    await page.locator('.a11y-launcher').click()
    await motion.selectOption('system')
    await page.keyboard.press('Escape')
    await expect(globe).toHaveAttribute('data-animation-state', 'playing')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await frozenGlobe(page, globe)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(globe).toHaveAttribute('data-animation-state', 'playing')
    const resumed = await globe.getAttribute('data-longitude')
    await expect.poll(() => globe.getAttribute('data-longitude')).not.toBe(resumed)
  })
}
