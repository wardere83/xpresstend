/** Run from a trusted operator machine. No credentials belong in git or CI logs. */
import { writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
const cookie = process.env.XPT_OWNER_SESSION
if (!cookie)
  throw new Error(
    'Set XPT_OWNER_SESSION to the authenticated owner session cookie. No bootstrap bypass is supported.',
  )
const origin = 'https://xpresstend.com'
async function request(path, body) {
  const r = await fetch(`${origin}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
      Origin: origin,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!r.ok)
    throw new Error(
      `Staff provisioning request failed (${r.status}). No credentials were logged.`,
    )
  return r.json()
}
const { admin } = await request('/admin/auth/me')
if (admin.role !== 'owner') throw new Error('Owner authorization required.')
const { staff } = await request('/admin/staff')
const targets = [
  { email: 'abdikarim@xpresstend.com', name: 'Abdikarim', role: 'compliance' },
  {
    email: 'hassan@bulleconsulting.com',
    name: 'Hassan Wardere',
    role: 'owner',
  },
]
const output = join(homedir(), `xpresstend-staff-activation-${Date.now()}.json`)
const results = []
// Reserve the private file before creating any accounts. Never overwrite credentials.
await writeFile(output, '[]\n', { mode: 0o600, flag: 'wx' })
for (const target of targets) {
  const existing = staff.find(
    (person) => person.email.toLowerCase() === target.email,
  )
  if (existing) {
    results.push({
      email: target.email,
      status: existing.status,
      role: existing.role,
      action: 'existing_account_unchanged',
    })
  } else {
    const result = await request('/admin/staff/invite', {
      ...target,
      deliverEmail: false,
    })
    results.push({
      email: target.email,
      role: target.role,
      status: 'invited',
      link: result.link,
      expiresAt: result.expiresAt,
    })
  }
  await writeFile(output, JSON.stringify(results, null, 2) + '\n', {
    mode: 0o600,
  })
}
console.log(
  `Staff provisioning results saved privately to ${output}. Activation links expire in 48 hours. No email was sent.`,
)
