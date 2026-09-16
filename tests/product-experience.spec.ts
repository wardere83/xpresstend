import { expect, test } from '@playwright/test'

// Deterministic, offline API fixtures: these checks never touch customer data.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"unauthorized"}',
    }),
  )
})

test('homepage keeps the film quiet until played, and omits preview furniture', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Connection stays.',
  )
  await expect(
    page.getByText(
      /Replay film|Sound on|Full screen|Concept preview|Private creative preview/,
    ),
  ).toHaveCount(0)
  const video = page.locator('video')
  expect(await video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true)
  await expect(video).toHaveAttribute('preload', 'none')
  await page
    .getByRole('button', { name: 'Play the XpressTend film', exact: true })
    .click()
  await expect
    .poll(() => video.evaluate((v) => (v as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0)
  expect(await video.evaluate((v) => (v as HTMLVideoElement).videoWidth)).toBe(
    1920,
  )
  expect(
    await video.evaluate((v) => (v as HTMLVideoElement).duration),
  ).toBeCloseTo(26, 0)
  expect(await video.evaluate((v) => (v as HTMLVideoElement).controls)).toBe(
    true,
  )
  expect(errors).toEqual([])
})

test('app feature tabs support keyboard selection and load actual app images', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Send', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    page.getByRole('tab', { name: 'People', exact: true }),
  ).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('Start with someone.')
  await page.keyboard.press('End')
  await expect(page.getByRole('tabpanel')).toContainText('Follow every step.')
  const image = page.locator('.brand-device img')
  await image.scrollIntoViewIfNeeded()
  await expect
    .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0)
})

test('download disclosure has valid targets, closes on Escape, and restores focus', async ({
  page,
}) => {
  await page.goto('/')
  const download = page.getByRole('button', {
    name: 'Download the app',
    exact: true,
  })
  await download.click()
  const popover = page.locator('.brand-download-popover')
  await expect(popover.getByRole('link', { name: /Android/ })).toHaveAttribute(
    'href',
    /releases\/latest\/download\/xpresstend.apk/,
  )
  await expect(popover.getByRole('link', { name: /iPhone/ })).toHaveAttribute(
    'href',
    /^mailto:support@xpresstend.com/,
  )
  await page.keyboard.press('Escape')
  await expect(popover).toHaveCount(0)
  await expect(download).toBeFocused()
})

test('explore enters the actual app, navigates, and exits to the website', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\//.test(request.url()))
      writes.push(request.url())
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Explore the app', exact: true })
    .first()
    .click()
  await expect(page).toHaveURL(/#\/app$/)
  await expect(page.getByText('Explore mode · Sample data')).toBeVisible()
  await page
    .locator('.product-phone')
    .getByRole('link', { name: 'Recipients', exact: true })
    .click()
  await expect(page).toHaveURL(/#\/recipients$/)
  await page.getByRole('button', { name: 'Leave explore mode' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Money moves.',
  )
  expect(writes).toEqual([])
})

test('guest transfer walkthrough completes locally without asking for a real password', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\//.test(request.url()))
      writes.push(request.url())
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Explore the app', exact: true })
    .first()
    .click()
  await page.locator('.product-send-card > button').click()
  await expect(page).toHaveURL(/#\/send$/)
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page).toHaveURL(/#\/review$/)
  await page.getByRole('button', { name: /^Send \$/ }).click()
  await expect(page).toHaveURL(/#\/success$/)
  await expect(page.locator('input[type=password]')).toHaveCount(0)
  await expect(page.getByText('Explore mode · Sample data')).toBeVisible()
  expect(writes).toEqual([])
})

test('a signed-in empty account never sees the tour recipients or history on Home', async ({
  page,
}) => {
  await page.route('**/api/**', (route) => {
    const endpoint = new URL(route.request().url()).pathname
    const body = endpoint.endsWith('/auth/me')
      ? {
          user: {
            id: 'customer-test',
            firstName: 'Taylor',
            lastName: 'Test',
            email: 'test@example.com',
            kycStatus: 'pending',
            kycTier: 0,
            status: 'active',
          },
        }
      : endpoint.endsWith('/recipients')
        ? { recipients: [] }
        : endpoint.endsWith('/transfers')
          ? { transfers: [] }
          : {}
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  await page.goto('/#/app')
  await expect(page.locator('.product-home-greeting')).toContainText('Taylor')
  await expect(page.getByText('Explore mode · Sample data')).toHaveCount(0)
  await expect(
    page.getByText('Add new recipient', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.product-home-section ul li')).toHaveCount(0)
})

for (const width of [320, 390, 768, 1440]) {
  test(`homepage and app fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'Download the app', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    await page
      .getByRole('button', { name: 'Explore the app', exact: true })
      .first()
      .click()
    await expect(page).toHaveURL(/#\/app$/)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  })
}

for (const language of ['so', 'es', 'pt-BR', 'ar']) {
  test(`editorial page and app work in ${language}`, async ({ page }) => {
    await page.addInitScript(
      (language) => localStorage.setItem('xpresstend.lang', language),
      language,
    )
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      language === 'ar' ? 'rtl' : 'ltr',
    )
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText(
      'Money moves.',
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390)
    await page.locator('.brand-actions .brand-primary').click()
    await expect(page).toHaveURL(/#\/app$/)
    await expect(page.locator('.product-explore-bar')).toBeVisible()
  })
}

test('reduced motion keeps the video paused and removes decorative animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  expect(
    await page.locator('video').evaluate((v) => (v as HTMLVideoElement).paused),
  ).toBe(true)
  expect(
    await page
      .locator('.brand-hero')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
})

test('Watch the film starts playback from the hero', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Watch the film', exact: true })
    .click()
  await expect
    .poll(() =>
      page
        .locator('video')
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0)
})

test('real accounts still require a password before any transfer submission', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\//.test(request.url()))
      writes.push(request.url())
  })
  await page.route('**/api/**', (route) => {
    const endpoint = new URL(route.request().url()).pathname
    const body = endpoint.endsWith('/auth/me')
      ? {
          user: {
            id: 'customer-test',
            firstName: 'Taylor',
            lastName: 'Test',
            email: 'test@example.com',
            kycStatus: 'approved',
            kycTier: 1,
            status: 'active',
          },
        }
      : endpoint.endsWith('/recipients')
        ? {
            recipients: [
              {
                id: 'recipient-test',
                full_name: 'Test Recipient',
                country: 'SO',
                payout_method: 'mobile_wallet',
                phone: '+252610000000',
                bank_name: null,
                relationship: 'Family',
                created_at: '2026-01-01',
              },
            ],
          }
        : endpoint.endsWith('/transfers')
          ? { transfers: [] }
          : {}
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  await page.goto('/#/send')
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page).toHaveURL(/#\/review$/)
  await page.getByRole('button', { name: /^Send \$/ }).click()
  await expect(page.locator('input[type=password]')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Authorise transfer', exact: true }),
  ).toBeDisabled()
  expect(writes).toEqual([])
})
