import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
})
for (const [path, title] of [
  ['login', 'Welcome back'],
  ['admin', 'Staff sign in'],
  ['institutional-reviewer', 'Institutional reviewer sign in'],
]) {
  test(`${path} uses the shared white sign-in layout and a real aligned star pattern`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/#/${path}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if (path !== 'login')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(
      page.getByRole('button', { name: 'Accessibility', exact: true }),
    ).toHaveCount(1)
    const frame = page.locator('.signin-page')
    await expect(frame).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(
      frame.locator('[data-star-pattern=orion] [data-star]'),
    ).toHaveCount(7)
    await expect(frame.locator('.signin-meteor')).toHaveCount(2)
    const email = page.getByLabel('Email', { exact: true })
    await expect(email).toBeVisible()
    expect(
      await email.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16)
    await email.fill('preview@example.invalid')
    await expect(email).toHaveValue('preview@example.invalid')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(frame.locator('.signin-meteor').first()).toHaveCSS(
      'display',
      'none',
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390)
  })
}

test('accessibility controls work, persist across routes and reloads, and reset', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Accessibility', exact: true })
    .first()
    .click()
  const panel = page.getByRole('dialog', { name: 'Accessibility', exact: true })
  await expect(panel).toBeVisible()
  await panel.getByLabel('Text size', { exact: true }).selectOption('large')
  await panel.getByLabel('Increase contrast', { exact: true }).check()
  await panel.getByLabel('Underline links', { exact: true }).check()
  await panel.getByLabel('Roomier text spacing', { exact: true }).check()
  await panel.getByLabel('Use a clear reading font', { exact: true }).check()
  await panel.getByLabel('Motion', { exact: true }).selectOption('reduce')
  await expect(page.locator('html')).toHaveAttribute(
    'data-a11y-motion',
    'reduce',
  )
  await expect(page.locator('.xt-globe')).toHaveAttribute('data-paused', 'true')
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  const primary = page.locator('.corporate-hero .brand-primary')
  await expect(primary).toHaveCSS('color', 'rgb(11, 37, 47)')
  await expect(primary).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await page.goto('/#/company')
  await expect(page.locator('.institutional-hero h1')).toBeVisible()
  expect(
    await page
      .locator('.institutional-section p')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-a11y-text', 'large')
  await expect(page.locator('html')).toHaveAttribute(
    'data-a11y-contrast',
    'true',
  )
  await page
    .getByRole('button', { name: 'Accessibility', exact: true })
    .first()
    .click()
  await panel
    .getByRole('button', { name: 'Reset preferences', exact: true })
    .click()
  await expect(page.locator('html')).toHaveAttribute(
    'data-a11y-text',
    'default',
  )
  await expect(page.locator('html')).toHaveAttribute(
    'data-a11y-motion',
    'system',
  )
  await expect(page.locator('html')).toHaveAttribute('data-a11y-links', 'false')
  await panel
    .getByRole('button', { name: 'Close accessibility settings', exact: true })
    .click()
})

test('accessibility is keyboard operable, restores focus and has translated controls', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('xpresstend.lang', 'ar'))
  await page.goto('/#/demo')
  const launcher = page.locator('.a11y-launcher')
  await launcher.focus()
  await page.keyboard.press('Enter')
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('heading')).toHaveText('إمكانية الوصول')
  await expect(panel.getByLabel('حجم النص', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  await expect(launcher).toBeFocused()
})

test('saved reduced-motion preference stops the globe and shooting stars on cold navigation', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'xpresstend.accessibility',
      JSON.stringify({ motion: 'reduce' }),
    ),
  )
  await page.goto('/')
  await expect(page.locator('.xt-globe')).toHaveAttribute('data-paused', 'true')
  await page.goto('/#/login')
  await expect(page.locator('.signin-meteor').first()).toHaveCSS(
    'display',
    'none',
  )
})

test('the compact accessibility panel keeps settings visible and reveals keyboard guidance on demand', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/demo')
  await page.getByRole('button', { name: 'Accessibility', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Accessibility', exact: true })
  const bounds = await panel.boundingBox()
  expect(bounds?.width).toBeLessThanOrEqual(360)
  expect(bounds?.height).toBeLessThanOrEqual(600)
  expect(await panel.evaluate((el) => el.scrollWidth)).toBeLessThanOrEqual(
    await panel.evaluate((el) => el.clientWidth),
  )
  for (const toggle of await panel.getByRole('checkbox').all()) {
    await expect(toggle).toBeVisible()
  }
  const tips = panel.locator('summary')
  await expect(panel.locator('.a11y-help')).not.toBeVisible()
  await tips.focus()
  await page.keyboard.press('Enter')
  await expect(panel.locator('.a11y-help')).toBeVisible()
  const contrast = panel.getByLabel('Increase contrast', { exact: true })
  await contrast.check()
  await expect(contrast.locator('..')).toHaveAttribute('data-active', 'true')
  await page.keyboard.press('Escape')
  await expect(page.locator('.a11y-launcher')).toBeFocused()
})

test('largest text remains usable at narrow phone widths', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'xpresstend.accessibility',
      JSON.stringify({ text: 'largest' }),
    ),
  )
  await page.setViewportSize({ width: 320, height: 844 })
  for (const path of [
    '',
    'login',
    'company',
    'admin',
    'institutional-reviewer',
  ]) {
    await page.goto(`/#/${path}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      path,
    ).toBeLessThanOrEqual(320)
  }
})
