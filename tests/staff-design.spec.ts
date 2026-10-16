import { expect, test } from '@playwright/test'

test('financial workspace preserves metrics, separate document and record scrolling, and narrow layouts', async ({
  page,
}) => {
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    const responses: Record<string, unknown> = {
      '/api/admin/auth/me': {
        admin: {
          id: 'design-owner',
          name: 'Design Owner',
          email: 'owner@example.invalid',
          role: 'owner',
        },
      },
      '/api/admin/overview': {
        customers: { total: 12, active: 10, verified: 8 },
        staff: { total: 3, active: 2 },
        awaitingReview: 4,
        byStatus: [],
        volume: [],
      },
      '/api/admin/ledger/trial-balance': {
        balanced: true,
        imbalances: [],
        accounts: [],
      },
      '/api/admin/transfers': { transfers: [] },
      '/api/admin/staff': {
        staff: Array.from({ length: 30 }, (_, index) => ({
          id: `design-staff-${index}`,
          name: `Staff fixture ${index + 1}`,
          email: `staff-${index + 1}@example.invalid`,
          role: 'viewer',
          status: index === 29 ? 'disabled' : 'active',
          created_at: '2026-10-15T09:00:00Z',
          last_login_at: null,
        })),
      },
    }
    return route.fulfill({ json: responses[path] ?? {} })
  })
  await page.goto('/#/admin')
  await expect(
    page.getByRole('heading', { name: 'Your operations. In view.' }),
  ).toBeVisible()
  await expect(page.locator('.operations-ledger')).toContainText('Balanced')
  await expect(
    page
      .locator('[data-operations-metric]')
      .filter({ hasText: 'Awaiting review' }),
  ).toContainText('4')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const headingFit = () =>
    page.locator('.operations-brand').evaluate((brand) => {
      const heading = brand.querySelector('h1')!
      const text = document.createRange()
      text.selectNodeContents(heading)
      const glyphs = text.getBoundingClientRect()
      const ticker = brand
        .querySelector('.operations-ticker')!
        .getBoundingClientRect()
      return Math.max(
        Math.abs(glyphs.left - ticker.left),
        Math.abs(glyphs.right - ticker.right),
      )
    })
  await expect.poll(headingFit).toBeLessThanOrEqual(2)
  const ticker = page.locator('.operations-ticker')
  const track = page.locator('.operations-ticker-track')
  await expect(ticker).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(ticker).toHaveCSS('border-top-width', '1px')
  await expect(track).toHaveCSS('animation-duration', '16s')
  await expect(track).toHaveCSS('animation-iteration-count', 'infinite')
  await expect(page.locator('#operations-title')).toHaveCSS(
    'font-weight',
    '400',
  )
  await expect(page.locator('#operations-title')).toHaveCSS(
    'animation-name',
    'none',
  )
  await page.getByRole('button', { name: 'Pause heading motion' }).click()
  await expect(track).toHaveCSS('animation-play-state', 'paused')
  await page.getByRole('button', { name: 'Resume heading motion' }).click()
  await expect(track).toHaveCSS('animation-play-state', 'running')
  await page.screenshot({
    path: 'test-results/staff-workspace-desktop.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: /Access governance/ }).click()
  await expect(
    page.getByRole('button', { name: /Access governance/ }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.getByPlaceholder('name@xpresstend.com')).toBeVisible()
  await expect(
    page.getByText('staff-30@example.invalid', { exact: true }),
  ).toHaveCount(0)
  await page.getByLabel('Include disabled accounts', { exact: true }).check()
  await expect(
    page.getByText('staff-30@example.invalid', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('Include disabled accounts', { exact: true }).uncheck()
  await expect(
    page.getByText('staff-30@example.invalid', { exact: true }),
  ).toHaveCount(0)
  await page
    .getByPlaceholder('name@xpresstend.com')
    .fill('invited@example.invalid')
  await expect(page.getByPlaceholder('name@xpresstend.com')).toHaveValue(
    'invited@example.invalid',
  )
  for (const width of [1440, 320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    await expect.poll(headingFit).toBeLessThanOrEqual(2)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeGreaterThan(844)
    const workspace = page.getByLabel('Operations workspace', { exact: true })
    expect(
      await workspace.evaluate((element) => element.scrollHeight),
    ).toBeGreaterThan(
      await workspace.evaluate((element) => element.clientHeight),
    )
    await workspace.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    expect(
      await workspace.evaluate((element) => element.scrollTop),
    ).toBeGreaterThan(0)
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    )
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    expect(
      await workspace.evaluate((element) => element.scrollTop),
    ).toBeGreaterThan(0)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: 'test-results/staff-workspace-mobile.png',
    fullPage: true,
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(track).toHaveCSS('animation-name', 'none')
  await expect(
    page.getByRole('button', { name: 'Pause heading motion' }),
  ).toBeHidden()
  expect(
    await ticker.evaluate((element) => element.scrollWidth),
  ).toBeLessThanOrEqual(await ticker.evaluate((element) => element.clientWidth))
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('html').evaluate((element) => {
    element.dataset.a11yMotion = 'reduce'
  })
  await expect(track).toHaveCSS('animation-name', 'none')
  await expect(
    page.getByRole('button', { name: 'Pause heading motion' }),
  ).toBeHidden()
})

test('entry halos respect reduced motion and the globe has no visible drag caption', async ({
  page,
}) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await page.goto('/#/admin')
  const email = page.getByPlaceholder('you@xpresstend.com')
  await expect(email).toBeVisible()
  expect(await email.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'none',
  )
  await email.fill('owner@example.invalid')
  await expect(email).toHaveAttribute('data-entry-active', 'true')
  expect(
    await email.evaluate((el) => getComputedStyle(el).animationDuration),
  ).toBe('2.2s')
  await page.getByPlaceholder('Password', { exact: true }).focus()
  await expect(email).not.toHaveAttribute('data-entry-active', 'true')
  expect(await email.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'none',
  )
  await email.fill('owner2@example.invalid')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await email.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'none',
  )
  await page.screenshot({
    path: 'test-results/staff-signin-design.png',
    fullPage: true,
  })
  await page.goto('/')
  await expect(page.locator('.xt-globe')).toBeVisible()
  await expect(page.locator('.xt-globe-hint')).toHaveCount(0)
})
