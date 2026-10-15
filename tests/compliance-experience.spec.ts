import { expect, test } from '@playwright/test'
import { mockAccount } from './fixtures/account'
test('the staff control center exposes activation gaps without claiming live operation', async ({
  page,
}) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/admin/auth/me')
      return route.fulfill({
        json: {
          admin: {
            id: 'owner',
            email: 'owner@example.invalid',
            name: 'Owner',
            role: 'owner',
          },
        },
      })
    if (path === '/api/admin/compliance/overview')
      return route.fulfill({
        json: {
          testMode: true,
          providers: { identity: false, sanctions: false },
          batches: [],
          keys: [],
          screenings: [],
          identity: [],
        },
      })
    if (path === '/api/admin/compliance/eligible')
      return route.fulfill({ json: { transfers: [] } })
    if (path === '/api/admin/ledger/trial-balance')
      return route.fulfill({
        json: { balanced: true, imbalances: [], accounts: [] },
      })
    if (path === '/api/admin/transfers')
      return route.fulfill({ json: { transfers: [] } })
    return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
  })
  await page.goto('/#/admin')
  await page.getByRole('button', { name: 'Compliance & banks' }).click()
  await expect(
    page.getByRole('heading', { name: 'Every transfer. Accounted for.' }),
  ).toBeVisible()
  await expect(page.getByText('Setup required', { exact: true })).toHaveCount(3)
  await expect(
    page.getByText('Test payments • No live wire execution'),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/compliance-desktop.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
})
test('missing provider configuration disables customer identity initiation', async ({
  page,
}) => {
  await mockAccount(page)
  await page.route('**/api/identity', (route) =>
    route.fulfill({ json: { configured: false, session: null } }),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/verify-identity')
  await expect(
    page.getByRole('heading', { name: 'A secure start.' }),
  ).toBeVisible()
  await expect(
    page.getByText(/Identity verification is being activated/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Start ID and selfie verification' }),
  ).toHaveCount(0)
  await page.screenshot({
    path: 'test-results/identity-mobile.png',
    fullPage: true,
  })
})
test('send stays disabled when preflight fails', async ({ page }) => {
  await mockAccount(page)
  await page.route('**/api/transfers/preflight', (route) =>
    route.fulfill({
      status: 503,
      json: { error: 'sanctions_provider_not_configured' },
    }),
  )
  await page.goto('/#/send')
  await page.getByRole('button', { name: /Choose a recipient/ }).click()
  await page.getByRole('button', { name: /Test Recipient/ }).click()
  await page.getByLabel('You Send', { exact: true }).fill('100')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Create test transfer', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByText(
      /Identity verification and current sanctions clearance are required/,
    ),
  ).toBeVisible()
})
