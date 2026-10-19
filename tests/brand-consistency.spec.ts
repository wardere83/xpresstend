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
  '/#/forgot-password',
  '/#/invite/navigation-fixture',
  '/#/staff/reset/navigation-fixture',
  '/#/demo',
  '/#/bank-review',
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
})

for (const width of [320, 1440]) {
  for (const route of entryPages) {
    test(`${route} keeps the complete public menu at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 })
      const destinations = [
        ['Home', '#/'],
        ['Company', '#/company'],
        ['Philanthropy', '#/philanthropy'],
        ['Compliance', '#/compliance'],
        ['Security', '#/security'],
      ]
      await page.goto(route)
      const header = page.locator('.public-header')
      await expect(header).toBeVisible()
      await expect(header.getByRole('link', { name: 'Explore app demo', exact: true })).toHaveCount(0)
      expect((await header.boundingBox())!.height).toBeLessThanOrEqual(73)
      if (width === 320)
        await header.locator('.public-mobile-menu summary').click()
      for (const [name, href] of destinations) {
        const link = header.getByRole('link', { name, exact: true })
        await expect(link).toBeVisible()
        await expect(link).toHaveAttribute('href', href)
      }
      if (route === '/#/company') {
        await header.getByRole('link', { name: 'Home', exact: true }).click()
        await expect(page).toHaveURL(/#\/$/)
        await expect(page.locator('.public-desktop-nav a[href="#/"]')).toHaveAttribute('aria-current', 'page')
        if (width === 320) await header.locator('.public-mobile-menu summary').click()
      }
      if (width === 320)
        await header.locator('.public-mobile-menu summary').click()
      await expect(header.locator('.language-trigger')).toHaveCSS(
        'background-color',
        'rgba(0, 0, 0, 0)',
      )
      await header.locator('.public-signin-menu summary').click()
      for (const [name, href] of [
        ['Customer sign in', '#/login'],
        ['Staff sign in', '#/admin'],
        ['Institutional reviewer sign in', '#/institutional-reviewer'],
      ]) {
        const link = header.getByRole('link', { name, exact: true })
        await expect(link).toBeVisible()
        await expect(link).toHaveAttribute('href', href)
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    })
  }
}

for (const [language, back] of [
  ['es', 'Volver al sitio web'],
  ['pt-BR', 'Voltar ao site'],
  ['ar', 'العودة إلى الموقع'],
]) {
  test(`${language} sign-in pages provide a visible arrow back to the website`, async ({
    page,
  }) => {
    await page.addInitScript(
      (language) => localStorage.setItem('xpresstend.lang', language),
      language,
    )
    await page.setViewportSize({ width: 320, height: 844 })
    for (const route of ['/#/login', '/#/admin', '/#/institutional-reviewer']) {
      await page.goto(route)
      const link = page.locator('.signin-back')
      await expect(link).toHaveText(back)
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', '#/')
      await expect(link.locator('svg')).toBeVisible()
      const box = (await link.boundingBox())!
      const header = (await page.locator('.public-header').boundingBox())!
      expect(box.y).toBeGreaterThanOrEqual(header.y + header.height)
      await link.click()
      await expect(page).toHaveURL(/#\/$/)
    }
  })
}

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
    expect(home.height).toBe(38)
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
    const heading = page.getByRole('heading', { level: 1 })
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
