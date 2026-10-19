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
          status: index === 29 ? 'disabled' : index === 0 ? 'invited' : 'active',
          created_at: '2026-10-15T09:00:00Z',
          last_login_at: null,
        })),
      },
    }
    return route.fulfill({ json: responses[path] ?? {} })
  })
  await page.goto('/#/admin')
  const tickerCopy = 'XpressTend Operations | Owner View | Access Approval Hub'
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(tickerCopy)
  await expect(page.getByText('Your operations. In view.', { exact: true })).toHaveCount(0)
  await expect(page.locator('.operations-ledger')).toContainText('Balanced')
  const verifiedMetric = page.locator('[data-operations-metric]').filter({ has: page.getByText('Verified customers', { exact: true }) })
  const registeredMetric = page.locator('[data-operations-metric]').filter({ has: page.getByText('Registered accounts', { exact: true }) })
  await expect(verifiedMetric.locator('p').nth(1)).toHaveText('8')
  await expect(verifiedMetric).toContainText('Identity-verified accounts')
  await expect(registeredMetric.locator('p').nth(1)).toHaveText('12')
  await expect(registeredMetric).toContainText('10 active accounts')
  await expect(
    page
      .locator('[data-operations-metric]')
      .filter({ hasText: 'Awaiting review' }),
  ).toContainText('4')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const ticker = page.locator('.operations-ticker')
  const track = page.locator('.operations-ticker-track')
  await expect(track.locator('span').first()).toHaveText(tickerCopy)
  await expect(ticker.getByRole('button')).toHaveCount(0)
  await expect(ticker).toHaveCSS('background-color', 'rgb(11, 37, 47)')
  await expect(ticker).toHaveCSS('border-top-width', '1px')
  await expect(track).toHaveCSS('animation-duration', '16s')
  await expect(track).toHaveCSS('animation-iteration-count', 'infinite')
  await expect(page.locator('.staff-role')).toHaveText('owner')
  await expect(page.locator('.staff-role')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('.staff-role')).toHaveCSS('border-top-color', 'rgb(255, 255, 255)')
  const signOut = page.getByRole('button', { name: 'Sign out', exact: true })
  await expect(signOut).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(signOut).toHaveCSS('border-top-color', 'rgb(255, 255, 255)')
  await expect(page.locator('.staff-session-email')).toHaveCSS('font-weight', await signOut.evaluate(el => getComputedStyle(el).fontWeight))
  const workflowType = await page.locator('.operations-flow strong').first().evaluate(el => {
    const style = getComputedStyle(el)
    return { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight }
  })
  await expect(track.locator('span').first()).toHaveCSS('font-family', workflowType.family)
  await expect(track.locator('span').first()).toHaveCSS('font-size', workflowType.size)
  await expect(track.locator('span').first()).toHaveCSS('font-weight', workflowType.weight)
  const initialPosition = await track.evaluate(el => getComputedStyle(el).transform)
  await expect.poll(() => track.evaluate(el => getComputedStyle(el).transform)).not.toBe(initialPosition)
  await page.screenshot({
    path: 'test-results/staff-workspace-desktop.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: /Access governance/ }).click()
  await expect(
    page.getByRole('button', { name: /Access governance/ }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('button', { name: /Access governance/ })).toHaveCSS('background-color', 'rgb(11, 37, 47)')
  expect(await page.getByRole('button', { name: /Access governance/ }).evaluate(el => getComputedStyle(el).backgroundImage)).toContain('linear-gradient')
  await expect(page.getByPlaceholder('name@xpresstend.com')).toBeVisible()
  await expect(
    page.getByText('staff-30@example.invalid', { exact: true }),
  ).toHaveCount(0)
  const disabledFilter = page.getByLabel('Show disabled accounts only', { exact: true })
  const staffRows = page.locator('.operations-panel tbody tr')
  for (let toggle = 0; toggle < 2; toggle++) {
    await disabledFilter.check()
    await expect(staffRows).toHaveCount(1)
    await expect(page.getByText('staff-30@example.invalid', { exact: true })).toBeVisible()
    await expect(page.getByText('staff-1@example.invalid', { exact: true })).toHaveCount(0)
    await expect(page.getByText('staff-2@example.invalid', { exact: true })).toHaveCount(0)
    await disabledFilter.uncheck()
    await expect(staffRows).toHaveCount(29)
    await expect(page.getByText('staff-1@example.invalid', { exact: true })).toBeVisible()
    await expect(page.getByText('staff-2@example.invalid', { exact: true })).toBeVisible()
    await expect(page.getByText('staff-30@example.invalid', { exact: true })).toHaveCount(0)
  }
  await page
    .getByPlaceholder('name@xpresstend.com')
    .fill('invited@example.invalid')
  await expect(page.getByPlaceholder('name@xpresstend.com')).toHaveValue(
    'invited@example.invalid',
  )
  for (const width of [1440, 320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    expect((await ticker.boundingBox())!.width).toBeLessThanOrEqual(300)
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

test('zero verified customers, four registered accounts and two active staff remain distinct from the disabled-only account view', async ({
  page,
}) => {
  const staff = [
    { id: 'active-owner', email: 'active-owner@example.invalid', status: 'active', role: 'owner' },
    { id: 'active-colleague', email: 'active-colleague@example.invalid', status: 'active', role: 'compliance' },
    { id: 'disabled-owner', email: 'disabled-owner@example.invalid', status: 'disabled', role: 'owner' },
    { id: 'disabled-colleague', email: 'disabled-colleague@example.invalid', status: 'disabled', role: 'agent' },
  ].map((account, index) => ({
    ...account,
    name: `Staff fixture ${index + 1}`,
    created_at: '2026-10-18T09:00:00Z',
    last_login_at: null,
  }))
  const mutations: string[] = []
  await page.route('**/api/**', (route) => {
    const request = route.request()
    if (request.method() !== 'GET') mutations.push(`${request.method()} ${new URL(request.url()).pathname}`)
    const responses: Record<string, unknown> = {
      '/api/admin/auth/me': { admin: staff[0] },
      '/api/admin/overview': {
        customers: { total: 4, active: 4, verified: 0 },
        staff: { total: 4, active: 2 },
        awaitingReview: 0,
        byStatus: [],
        volume: [],
      },
      '/api/admin/ledger/trial-balance': { balanced: true, imbalances: [], accounts: [] },
      '/api/admin/transfers': { transfers: [] },
      '/api/admin/staff': { staff },
    }
    return route.fulfill({ json: responses[new URL(request.url()).pathname] ?? {} })
  })
  await page.goto('/#/admin')
  const verifiedMetric = page.locator('[data-operations-metric]').filter({ has: page.getByText('Verified customers', { exact: true }) })
  const registeredMetric = page.locator('[data-operations-metric]').filter({ has: page.getByText('Registered accounts', { exact: true }) })
  const staffMetric = page.locator('[data-operations-metric]').filter({ has: page.getByText('Active staff', { exact: true }) })
  await expect(verifiedMetric.locator('p').nth(1)).toHaveText('0')
  await expect(registeredMetric.locator('p').nth(1)).toHaveText('4')
  await expect(registeredMetric).toContainText('4 active accounts')
  await expect(staffMetric.locator('p').nth(1)).toHaveText('2')
  await expect(staffMetric).toContainText('Accounts with active access')
  await expect(staffMetric).not.toContainText('of 4 accounts')
  await page.getByRole('button', { name: 'Staff', exact: true }).click()
  const disabledFilter = page.getByLabel('Show disabled accounts only', { exact: true })
  const tableRows = page.locator('.operations-panel tbody tr')
  for (let toggle = 0; toggle < 3; toggle++) {
    await expect(disabledFilter).not.toBeChecked()
    await expect(tableRows).toHaveCount(2)
    for (const account of staff) {
      await expect(page.getByRole('cell', { name: account.email, exact: true })).toHaveCount(account.status === 'active' ? 1 : 0)
    }
    await disabledFilter.check()
    await expect(tableRows).toHaveCount(2)
    await expect(page.getByText('Viewing disabled accounts only.', { exact: true })).toBeVisible()
    for (const account of staff) {
      await expect(page.getByRole('cell', { name: account.email, exact: true })).toHaveCount(account.status === 'disabled' ? 1 : 0)
    }
    await expect(verifiedMetric.locator('p').nth(1)).toHaveText('0')
    await expect(registeredMetric.locator('p').nth(1)).toHaveText('4')
    await expect(staffMetric.locator('p').nth(1)).toHaveText('2')
    await disabledFilter.uncheck()
    for (const account of staff) {
      await expect(page.getByRole('cell', { name: account.email, exact: true })).toHaveCount(account.status === 'active' ? 1 : 0)
    }
  }
  await expect(page.getByText('Viewing active and invited accounts.', { exact: true })).toBeVisible()
  await expect(tableRows).toHaveCount(2)
  expect(mutations).toEqual([])
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
