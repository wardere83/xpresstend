import { createHash } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

async function mockOwner(page: Page) {
  const requests: string[] = []
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    requests.push(`${route.request().method()} ${path}`)
    const responses: Record<string, unknown> = {
      '/api/admin/auth/me': {
        admin: { id: 'owner', name: 'Owner', email: 'owner@example.invalid', role: 'owner' },
      },
      '/api/admin/overview': {
        customers: { total: 12, active: 10, verified: 8 },
        staff: { total: 3, active: 2 },
        awaitingReview: 1,
        byStatus: [],
        volume: [],
      },
      '/api/admin/ledger/trial-balance': { balanced: true, imbalances: [], accounts: [] },
      '/api/admin/transfers': {
        transfers: [
          {
            id: 'transfer-fixture',
            reference: 'XPT-REVIEW',
            status: 'compliance_hold',
            first_name: 'Sender',
            last_name: 'Fixture',
            recipient_name: 'Recipient Fixture',
            recipient_country: 'KE',
            send_amount_minor: 10000,
            send_currency: 'USD',
            receive_amount_minor: 1300000,
            receive_currency: 'KES',
            fee_minor: 99,
          },
        ],
      },
      '/api/admin/transfers/transfer-fixture/screenings': {
        screenings: [],
        screening_ready: true,
        review_required: false,
        current_screening_ids: [],
      },
      '/api/admin/staff': { staff: [] },
      '/api/admin/compliance/overview': {
        testMode: true,
        providers: { identity: false, sanctions: false },
        batches: [],
        keys: [],
        screenings: [],
        identity: [],
      },
      '/api/admin/compliance/eligible': { transfers: [] },
      '/api/admin/compliance/readiness': {
        checkedAt: '2026-10-15T09:00:00Z',
        bankApi: { available: true, activeConnections: 0, mode: 'review-only', basePath: '/api/bank/v1' },
        identity: { provider: 'persona', configured: false },
        globalSanctions: { provider: 'complyadvantage', configured: false },
        ofac: {
          ready: true,
          checkedAt: '2026-10-15T09:00:00Z',
          reason: null,
          entityCount: 19911,
          nameCount: 41205,
        },
      },
    }
    return route.fulfill({ json: responses[path] ?? {} })
  })
  return requests
}

test('workflow actions open the next real record, readiness and invitation form without submitting funds', async ({
  page,
}) => {
  const requests = await mockOwner(page)
  await page.goto('/#/admin')
  await page.getByRole('button', { name: /Transfer queue/ }).click()
  await expect(page.getByRole('region', { name: 'Sanctions review' })).toContainText('XPT-REVIEW')
  expect(requests).toContain('GET /api/admin/transfers/transfer-fixture/screenings')
  await page.getByRole('button', { name: /Financial controls/ }).click()
  await expect(page.getByRole('heading', { name: 'Identity & liveness', exact: true })).toBeVisible()
  await expect(page.getByText('OFAC live · 19,911 entities')).toBeVisible()
  await page.getByRole('button', { name: 'Manage bank connections' }).click()
  await expect(page.getByRole('heading', { name: 'Bank API contract' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Open operational bank review portal/ })).toHaveAttribute(
    'href',
    '#/bank-review',
  )
  await page.getByRole('button', { name: /Access governance/ }).click()
  await expect(page.getByPlaceholder('name@xpresstend.com')).toBeVisible()
  expect(requests.filter((request) => request.startsWith('POST'))).toEqual([])
})

test('public navigation is compact and the demo works as a full-screen mobile app without API writes', async ({
  page,
}) => {
  const writes: string[] = []
  await page.route('**/api/**', (route) => {
    if (route.request().method() !== 'GET') writes.push(route.request().url())
    return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('header').getByRole('link', { name: 'Get started', exact: true })).toHaveCount(0)
  await expect(page.locator('footer a[href="#/login"]')).toHaveCount(0)
  await expect(
    page.locator('.corporate-hero-actions').getByRole('link', { name: 'Get started', exact: true }),
  ).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  expect(
    await page.locator('.brand-header-inner').evaluate((el) => el.getBoundingClientRect().height),
  ).toBeLessThanOrEqual(76)
  await page.getByLabel('Menu', { exact: true }).click()
  await expect(
    page.locator('.brand-mobile-menu').getByRole('link', { name: 'Company', exact: true }),
  ).toBeVisible()
  await page.getByLabel('Menu', { exact: true }).click()
  await page.locator('.corporate-hero-actions').getByRole('link', { name: 'Explore app demo' }).click()
  await expect(page).toHaveURL(/#\/demo$/)
  await page.getByRole('button', { name: /Send money Explore a sample transfer/ }).click()
  await page.getByLabel('Sample amount (USD)').fill('125.50')
  await page.getByRole('button', { name: 'Review demo transfer' }).click()
  await expect(page.locator('.demo-summary')).toContainText('$126.49')
  await page.getByRole('button', { name: 'Complete demo', exact: true }).click()
  await page.getByRole('button', { name: 'View demo activity' }).click()
  await expect(page.locator('.demo-content')).toContainText('No money sent')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(844)
  expect(writes).toEqual([])
  await page.screenshot({ path: 'test-results/interactive-demo-mobile.png', fullPage: true })
})

// Deliberately synthetic, unprivileged test credential used only against intercepted routes.
const bankKey = `xpt_bank_${'a'.repeat(64)}`
async function mockBank(page: Page, corrupt = false) {
  const manifest = {
    version: 1,
    batchId: 'wire-fixture',
    bankId: 'fixture-bank',
    currency: 'USD',
    totalMinor: 10000,
    createdAt: '2026-10-15T09:00:00Z',
    items: [
      {
        id: 'item-fixture',
        reference: 'XPT-FIXTURE',
        first_name: 'Sender',
        last_name: 'Fixture',
        recipient_name: 'Recipient Fixture',
        send_amount_minor: 10000,
        send_currency: 'USD',
        fee_minor: 99,
      },
    ],
  }
  const canonical = JSON.stringify(manifest)
  const batch = {
    id: manifest.batchId,
    bank_id: manifest.bankId,
    currency: 'USD',
    total_minor: 10000,
    item_count: 1,
    status: 'submitted',
    manifest_hash: createHash('sha256').update(canonical).digest('hex'),
  }
  const decisions: unknown[] = []
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/bank/v1/')) return route.fulfill({ status: 401, json: {} })
    if (route.request().headers().authorization !== `Bearer ${bankKey}`)
      return route.fulfill({ status: 401, json: {} })
    if (path.endsWith('/decision')) {
      decisions.push(route.request().postDataJSON())
      return route.fulfill({ json: { ok: true, expiresAt: '2026-10-15T09:05:00Z' } })
    }
    if (path.endsWith('/batches')) return route.fulfill({ json: { batches: [batch], nextCursor: null } })
    return route.fulfill({
      json: {
        batch,
        manifest,
        manifestCanonical: corrupt ? canonical + ' ' : canonical,
        ledger: [],
        screenings: [],
        testMode: true,
      },
    })
  })
  await page.goto('/#/bank-review')
  await page.getByLabel('Bank API key', { exact: true }).fill(bankKey)
  await page.getByRole('button', { name: 'Connect to review API' }).click()
  await page.getByRole('button', { name: /wire-fixture/ }).click()
  return decisions
}

test('bank portal verifies the canonical manifest and records the bank-scoped decision', async ({ page }) => {
  const decisions = await mockBank(page)
  await expect(page.getByText('Hash & totals verified')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Record bank approval', exact: true })).toBeDisabled()
  await page.getByLabel('Bank review reference').fill('FIXTURE-REVIEW-1')
  await page
    .getByLabel('Review reason')
    .fill('Fixture bank reviewed all sample contributions and recorded its decision.')
  await page.getByRole('button', { name: 'Record bank approval', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Bank approval recorded')
  expect(decisions).toHaveLength(1)
  expect(decisions[0]).toMatchObject({ decision: 'approved', reference: 'FIXTURE-REVIEW-1' })
  expect(
    await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })),
  ).not.toContain(bankKey)
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click()
  await expect(page.getByLabel('Bank API key', { exact: true })).toHaveValue('')
})

test('bank portal blocks decisions for an altered canonical manifest', async ({ page }) => {
  const decisions = await mockBank(page, true)
  await expect(page.getByRole('alert')).toContainText('Manifest verification failed')
  await expect(page.getByRole('button', { name: 'Record bank approval', exact: true })).toHaveCount(0)
  expect(decisions).toEqual([])
})
