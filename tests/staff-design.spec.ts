import { expect, test } from '@playwright/test'

test('financial workspace navigation preserves real metrics and fits narrow screens', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const responses: Record<string, unknown> = {
      '/api/admin/auth/me': { admin: { id: 'design-owner', name: 'Design Owner', email: 'owner@example.invalid', role: 'owner' } },
      '/api/admin/overview': { customers: { total: 12, active: 10, verified: 8 }, staff: { total: 3, active: 2 }, awaitingReview: 4, byStatus: [], volume: [] },
      '/api/admin/ledger/trial-balance': { balanced: true, imbalances: [], accounts: [] },
      '/api/admin/transfers': { transfers: [] },
      '/api/admin/staff': { staff: [] },
    }
    return route.fulfill({ json: responses[path] ?? {} })
  })
  await page.goto('/#/admin')
  await expect(page.getByRole('heading', { name: 'Clarity at every step.' })).toBeVisible()
  await expect(page.locator('.operations-ledger')).toContainText('Balanced')
  await expect(page.locator('[data-operations-metric]').filter({ hasText: 'Awaiting review' })).toContainText('4')
  await page.screenshot({ path: 'test-results/staff-workspace-desktop.png', fullPage: true })
  await page.getByRole('button', { name: /Access governance/ }).click()
  await expect(page.getByRole('button', { name: /Access governance/ })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: 'Invite staff or reviewer' }).click()
  await expect(page.getByPlaceholder('name@xpresstend.com')).toBeVisible()
  await page.getByPlaceholder('name@xpresstend.com').fill('invited@example.invalid')
  await expect(page.getByPlaceholder('name@xpresstend.com')).toHaveValue('invited@example.invalid')
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-results/staff-workspace-mobile.png', fullPage: true })
})

test('entry halos respect reduced motion and the globe has no visible drag caption', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ status: 401, json: { error: 'unauthorized' } }))
  await page.goto('/#/admin')
  const email = page.getByPlaceholder('you@xpresstend.com')
  await expect(email).toBeVisible()
  expect(await email.evaluate(el => getComputedStyle(el).animationDuration)).toBe('5s')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await email.evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  await page.screenshot({ path: 'test-results/staff-signin-design.png', fullPage: true })
  await page.goto('/')
  await expect(page.locator('.xt-globe')).toBeVisible()
  await expect(page.locator('.xt-globe-hint')).toHaveCount(0)
})
