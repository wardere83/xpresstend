import { expect, test, type Locator, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
})

async function frames(page: Page, count = 3) {
  await page.evaluate(async (count) => {
    for (let frame = 0; frame < count; frame++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
  }, count)
}

// Seek a later cycle so negative CSS delays never put the local time before zero.
async function seek(target: Locator, progress: number) {
  await target.evaluate(async (element, progress) => {
    const animations = element.getAnimations()
    if (!animations.length)
      throw new Error('Expected an animated orbital element')
    for (const animation of animations) {
      animation.pause()
      const timing = animation.effect!.getTiming()
      animation.currentTime =
        Number(timing.delay) + Number(timing.duration) * (progress + 1)
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }, progress)
}

async function corePosition(core: Locator) {
  return core.evaluate((element) => {
    const matrix = (element as SVGGraphicsElement).getScreenCTM()!
    return [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f]
  })
}

test('three outer rings loop around a stationary core while inner lines flow and shimmer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/compliance')
  const orbit = page.locator('.compliance-orbit')
  await expect(orbit).toBeVisible()
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const core = orbit.locator('.compliance-orbit-core')
  const initialCore = await corePosition(core)
  expect(await core.evaluate((element) => element.getAnimations().length)).toBe(
    0,
  )
  await expect(core).toHaveCSS('transform', 'none')
  const rings = orbit.locator('.compliance-orbit-ring')
  await expect(rings).toHaveCount(3)
  for (const ring of await rings.all()) {
    const timing = await ring.evaluate((element) => {
      const timing = element.getAnimations()[0].effect!.getTiming()
      return {
        duration: Number(timing.duration),
        infinite: timing.iterations === Infinity,
        easing: timing.easing,
      }
    })
    expect(timing.duration).toBeGreaterThanOrEqual(20000)
    expect(timing.duration).toBeLessThanOrEqual(45000)
    expect(timing.infinite).toBe(true)
    expect(timing.easing).toBe('linear')
    await seek(ring, 0.1)
    const start = await ring.evaluate(
      (element) => getComputedStyle(element).transform,
    )
    await seek(ring, 0.6)
    expect(
      await ring.evaluate((element) => getComputedStyle(element).transform),
    ).not.toBe(start)
    await seek(ring, 1.1)
    expect(
      await ring.evaluate((element) => getComputedStyle(element).transform),
    ).toBe(start)
  }
  const flow = orbit.locator('.compliance-core-flow').first()
  await seek(flow, 0.1)
  const initialFlow = await flow.evaluate((element) => ({
    offset: getComputedStyle(element).strokeDashoffset,
    opacity: getComputedStyle(element).opacity,
  }))
  await seek(flow, 0.5)
  const currentFlow = await flow.evaluate((element) => ({
    offset: getComputedStyle(element).strokeDashoffset,
    opacity: getComputedStyle(element).opacity,
  }))
  expect(currentFlow.offset).not.toBe(initialFlow.offset)
  expect(currentFlow.opacity).not.toBe(initialFlow.opacity)
  expect(await corePosition(core)).toEqual(initialCore)
})

test('the keyboard playback control pauses and resumes both orbital and inner motion', async ({
  page,
}) => {
  await page.goto('/#/compliance')
  const orbit = page.locator('.compliance-orbit')
  const toggle = orbit.getByRole('button', {
    name: 'Pause animation',
    exact: true,
  })
  await toggle.focus()
  await toggle.press('Space')
  await expect(
    orbit.getByRole('button', { name: 'Play animation', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  const states = () =>
    orbit.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.playState),
    )
  await expect
    .poll(async () => (await states()).every((state) => state === 'paused'))
    .toBe(true)
  expect((await states()).length).toBeGreaterThan(3)
  const snapshot = () =>
    orbit
      .locator('.compliance-orbit-ring, .compliance-core-flow')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element)
          return [style.transform, style.strokeDashoffset, style.opacity]
        }),
      )
  const paused = await snapshot()
  await frames(page)
  expect(await snapshot()).toEqual(paused)
  await orbit
    .getByRole('button', { name: 'Play animation', exact: true })
    .press('Space')
  await expect(
    orbit.getByRole('button', { name: 'Pause animation', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  await expect
    .poll(async () => (await states()).every((state) => state === 'running'))
    .toBe(true)
})

for (const lang of ['en', 'ar']) {
  test(`the ${lang} compliance visual fits phones and respects system and saved reduced motion`, async ({
    page,
  }) => {
    await page.addInitScript(
      (lang) => localStorage.setItem('xpresstend.lang', lang),
      lang,
    )
    await page.goto('/#/compliance')
    const orbit = page.locator('.compliance-orbit')
    await expect(orbit).toBeVisible()
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      const bounds = await orbit.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
      await expect(page.locator('.institutional-hero h1')).toBeVisible()
      await expect(orbit.getByRole('button')).toBeVisible()
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const moving = orbit.locator(
      '.compliance-orbit-ring, .compliance-core-flow',
    )
    for (const element of await moving.all())
      await expect(element).toHaveCSS('animation-name', 'none')
    const initialCore = await corePosition(
      orbit.locator('.compliance-orbit-core'),
    )
    await frames(page)
    expect(await corePosition(orbit.locator('.compliance-orbit-core'))).toEqual(
      initialCore,
    )
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.evaluate(() =>
      localStorage.setItem(
        'xpresstend.accessibility',
        JSON.stringify({ motion: 'reduce' }),
      ),
    )
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute(
      'data-a11y-motion',
      'reduce',
    )
    await expect(orbit).toBeVisible()
    expect(
      await orbit.evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running').length,
      ),
    ).toBe(0)
  })
}
