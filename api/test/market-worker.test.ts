import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import marketWorker from '../src/market-worker.ts'

function fixture() {
  const requests: Request[] = []
  const env = {
    ASSETS: {
      async fetch(request: Request) {
        requests.push(request)
        const pathname = new URL(request.url).pathname
        return new Response(request.method === 'HEAD' ? null : pathname, {
          headers: {
            'content-type': pathname.endsWith('.html')
              ? 'text/html'
              : pathname.endsWith('.js')
                ? 'text/javascript'
                : 'text/css',
            etag: '"market-fixture"',
            'set-cookie': 'must-not-create-session=1',
          },
        })
      },
    },
  }
  // The production environment requires only Fetcher's fetch method.
  return {
    env: env as unknown as Parameters<typeof marketWorker.fetch>[1],
    requests,
  }
}

for (const path of ['/dollar-index', '/dollar-index.html']) {
  test(`${path} serves the same isolated document with its provider CSP`, async () => {
    const { env, requests } = fixture()
    const response = await marketWorker.fetch(
      new Request(
        `https://xpresstend-market.shrill-king-ef4e.workers.dev${path}?locale=ar`,
        {
          headers: {
            cookie: 'xt_session=private',
            authorization: 'Bearer private',
          },
        },
      ),
      env,
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('location'), null)
    assert.equal(response.headers.get('content-type'), 'text/html')
    assert.equal(response.headers.get('set-cookie'), null)
    const policy = response.headers.get('content-security-policy')!
    assert.match(
      policy,
      /script-src 'self' https:\/\/widgets\.tradingview-widget\.com;/,
    )
    assert.match(
      policy,
      /frame-ancestors https:\/\/xpresstend\.com https:\/\/www\.xpresstend\.com/,
    )
    assert.equal(response.headers.get('x-frame-options'), null)
    assert.equal(await response.text(), '/dollar-index.html')
    assert.equal(requests.length, 1)
    assert.equal(new URL(requests[0].url).pathname, '/dollar-index.html')
    assert.equal(new URL(requests[0].url).search, '?locale=ar')
    assert.equal(requests[0].headers.get('cookie'), null)
    assert.equal(requests[0].headers.get('authorization'), null)
  })

  test(`${path} supports HEAD without returning a body or losing the document policy`, async () => {
    const { env, requests } = fixture()
    const response = await marketWorker.fetch(
      new Request(`https://market.invalid${path}`, { method: 'HEAD' }),
      env,
    )
    assert.equal(response.status, 200)
    assert.equal(await response.text(), '')
    assert.equal(requests[0].method, 'HEAD')
    assert.match(
      response.headers.get('content-security-policy')!,
      /widgets\.tradingview-widget\.com/,
    )
  })
}

test('only the named script and stylesheet are served as strict, cookieless assets', async () => {
  for (const [path, type] of [
    ['/dollar-index.js', 'text/javascript'],
    ['/dollar-index.css', 'text/css'],
  ]) {
    const { env, requests } = fixture()
    const response = await marketWorker.fetch(
      new Request(`https://market.invalid${path}`, {
        headers: {
          'if-none-match': '"previous"',
          cookie: 'session=private',
          authorization: 'Bearer private',
        },
      }),
      env,
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), type)
    assert.equal(response.headers.get('set-cookie'), null)
    assert.equal(response.headers.get('etag'), '"market-fixture"')
    assert.equal(await response.text(), path)
    assert.match(
      response.headers.get('content-security-policy')!,
      /script-src 'self';/,
    )
    assert.doesNotMatch(
      response.headers.get('content-security-policy')!,
      /tradingview/,
    )
    assert.equal(response.headers.get('x-frame-options'), 'DENY')
    assert.equal(requests[0].headers.get('if-none-match'), '"previous"')
    assert.equal(requests[0].headers.get('cookie'), null)
    assert.equal(requests[0].headers.get('authorization'), null)
  }
})

test('application, API and unknown paths return 404 without calling any asset or upstream', async () => {
  const { env, requests } = fixture()
  for (const path of [
    '/',
    '/index.html',
    '/api',
    '/api/auth/me',
    '/api/bank/v1',
    '/login',
    '/market/dollar-index.html',
    '/dollar-index/',
    '/other.js',
  ]) {
    for (const method of ['GET', 'POST']) {
      const response = await marketWorker.fetch(
        new Request(`https://market.invalid${path}`, { method }),
        env,
      )
      assert.equal(response.status, 404, `${method} ${path}`)
      assert.doesNotMatch(
        response.headers.get('content-security-policy')!,
        /tradingview/,
      )
      assert.equal(response.headers.get('access-control-allow-origin'), null)
    }
  }
  assert.equal(requests.length, 0)
})

test('document and static asset writes and preflights are rejected before asset lookup', async () => {
  const { env, requests } = fixture()
  for (const path of [
    '/dollar-index',
    '/dollar-index.html',
    '/dollar-index.js',
    '/dollar-index.css',
  ]) {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const response = await marketWorker.fetch(
        new Request(`https://market.invalid${path}`, { method }),
        env,
      )
      assert.equal(response.status, 405)
      assert.equal(response.headers.get('allow'), 'GET, HEAD')
      assert.doesNotMatch(
        response.headers.get('content-security-policy')!,
        /tradingview/,
      )
    }
  }
  assert.equal(requests.length, 0)
})

test('the dedicated deployment has assets only and cannot bypass its Worker through HTML routing', async () => {
  const config = await readFile(
    new URL('../wrangler.market.toml', import.meta.url),
    'utf8',
  )
  assert.match(config, /name = "xpresstend-market"/)
  assert.match(config, /directory = "\.\.\/dist\/market"/)
  assert.match(config, /binding = "ASSETS"/)
  assert.match(config, /run_worker_first = true/)
  assert.match(config, /html_handling = "none"/)
  assert.match(config, /not_found_handling = "none"/)
  assert.deepEqual(
    [...config.matchAll(/^\[([^\]]+)\]/gm)].map((match) => match[1]),
    ['assets'],
  )
})
