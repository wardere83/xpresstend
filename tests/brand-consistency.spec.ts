import { expect, test, type Page } from '@playwright/test'

const entryPages = [
  '/',
  '/#/company',
  '/#/philanthropy',
  '/#/compliance',
  '/#/security',
  '/#/register',
  '/#/login',
  '/#/admin',
  '/#/institutional-reviewer',
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
})

async function lockup(page: Page, route: string) {
  await page.goto(route)
  const logo = page.locator('header .site-header-brand [role="img"]')
  await expect(logo).toBeVisible()
  await expect(logo).toHaveAttribute(
    'aria-label',
    'XpressTend Financial Services',
  )
  await page.evaluate(() => document.fonts.ready)
  return logo.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return { x: box.x, y: box.y, width: box.width, height: box.height }
  })
}

for (const width of [390, 1440]) {
  test(`public and account-entry headers share the full lockup at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    const home = await lockup(page, '/')
    expect(home.height).toBe(36)
    expect(home.x).toBe(width === 390 ? 20 : 130)
    for (const route of entryPages.slice(1)) {
      const current = await lockup(page, route)
      for (const key of ['x', 'y', 'width', 'height'] as const)
        expect(
          Math.abs(current[key] - home[key]),
          `${route}: ${key}`,
        ).toBeLessThanOrEqual(0.5)
      await expect(page.locator('header .site-header-brand')).toHaveCount(1)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
      if (
        route.includes('login') ||
        route.includes('admin') ||
        route.includes('reviewer')
      )
        await expect(page.locator('.signin-content [role="img"]')).toHaveCount(
          0,
        )
    }
  })
}

test('public headings follow the homepage reading hierarchy and the logo follows the RTL leading edge', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  const reading = await page
    .locator('.corporate-company .brand-display')
    .evaluate((element) => ({
      font: getComputedStyle(element).fontFamily,
      size: parseFloat(getComputedStyle(element).fontSize),
      weight: getComputedStyle(element).fontWeight,
    }))
  for (const route of ['company', 'philanthropy', 'compliance', 'security']) {
    await page.goto(`/#/${route}`)
    const heading = page.locator('.institutional-hero h1')
    await expect(heading).toHaveCSS('font-family', reading.font)
    await expect(heading).toHaveCSS('font-weight', reading.weight)
    expect(
      await heading.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      ),
    ).toBe(reading.size)
    expect(
      await page
        .locator('.institutional-section p')
        .first()
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBe(16)
  }
  await page.evaluate(() => localStorage.setItem('xpresstend.lang', 'ar'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  const baseline = await lockup(page, '/#/company')
  const customer = await lockup(page, '/#/login')
  expect(baseline.x).toBeGreaterThan(1000)
  expect(Math.abs(customer.x - baseline.x)).toBeLessThanOrEqual(0.5)
  expect(Math.abs(customer.y - baseline.y)).toBeLessThanOrEqual(0.5)
})
