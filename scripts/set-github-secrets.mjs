#!/usr/bin/env node
/**
 * Uploads the signing secrets to GitHub Actions.
 *
 * Pasting these by hand kept putting a file path into the field instead of the
 * file's contents: four of six held between 44 and 57 characters where
 * thousands were expected. It cost several builds to notice, because a secret
 * is write-only and nothing can read one back to check.
 *
 * This reads each file directly, so there is no clipboard step to go wrong, and
 * refuses to upload a value too short to be what it claims.
 *
 * Usage:
 *   printf 'ghp_yourtoken' > ~/.xpresstend-gh-token && chmod 600 ~/.xpresstend-gh-token
 *   node scripts/set-github-secrets.mjs
 *
 * The token needs permission to write repository secrets:
 *   fine-grained -> Repository permissions -> Secrets -> Read and write
 *   classic      -> the "repo" scope
 * It is read from the file and never written anywhere.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const OWNER = 'wardere83'
const REPO = 'xpresstend'
const DIR = join(homedir(), 'xpresstend-signing')
const TOKEN_FILE = join(homedir(), '.xpresstend-gh-token')

/** name -> [file, minimum plausible length, what it is] */
const SECRETS = {
  APPLE_CERTIFICATE_P12:      ['p12.base64.txt',                3000,  'base64 of the .p12'],
  APPLE_CERTIFICATE_PASSWORD: ['p12-password.txt',              16,    'the .p12 password'],
  APPLE_PROVISIONING_PROFILE: ['profile.base64.txt',            10000, 'base64 of the profile'],
  APPSTORE_PRIVATE_KEY:       ['p8.base64.txt',                 200,   'base64 of the .p8'],
  ANDROID_KEYSTORE:           ['android-keystore.base64.txt',   4000,  'base64 of the keystore'],
  ANDROID_KEYSTORE_PASSWORD:  ['android-keystore-password.txt', 16,    'the keystore password'],
}

async function main() {
  const missing = Object.entries(SECRETS).filter(([, [f]]) => !existsSync(join(DIR, f)))
  if (missing.length) {
    console.error(`Missing files in ${DIR}:`)
    for (const [name, [f]] of missing) console.error(`  ${f}  (for ${name})`)
    process.exit(1)
  }

  console.log(`Reading signing material from ${DIR}`)
  const values = {}
  for (const [name, [file, min, what]] of Object.entries(SECRETS)) {
    const value = readFileSync(join(DIR, file), 'utf8').trim()
    if (value.length < min) {
      console.error(`${name}: ${file} holds only ${value.length} characters, expected at least ${min} (${what}).`)
      console.error('Refusing to upload; this is the mistake that has already cost several builds.')
      process.exit(1)
    }
    values[name] = value
    console.log(`  ${name.padEnd(28)} ${String(value.length).padStart(6)} chars  ok`)
  }

  /*
   * The key id is the filename: AuthKey_ABC1234XYZ.p8. Deriving it removes a
   * field that has to be typed correctly, and it cannot drift from the key it
   * names because it comes from the same file.
   */
  const authKey = readdirSync(DIR).find((f) => /^AuthKey_[A-Z0-9]{10}\.p8$/.test(f))
  if (authKey) {
    values.APPSTORE_KEY_ID = authKey.slice(8, 18)
    console.log(`  ${'APPSTORE_KEY_ID'.padEnd(28)} ${String(values.APPSTORE_KEY_ID.length).padStart(6)} chars  ok  (from ${authKey})`)
  }

  /*
   * The issuer id is a UUID from App Store Connect and lives nowhere on disk
   * unless it was saved here. Validated on shape, not just length: this is the
   * field that was silently replaced with a 44-character value and reported OK
   * because the check tested a minimum.
   */
  const issuerFile = join(DIR, 'issuer-id.txt')
  if (existsSync(issuerFile)) {
    const issuer = readFileSync(issuerFile, 'utf8').trim()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(issuer)) {
      console.error(`APPSTORE_ISSUER_ID: issuer-id.txt is not a UUID (${issuer.length} characters).`)
      console.error('Expected 36 characters shaped 8-4-4-4-12, from App Store Connect -> Users and Access -> Integrations.')
      process.exit(1)
    }
    values.APPSTORE_ISSUER_ID = issuer
    console.log(`  ${'APPSTORE_ISSUER_ID'.padEnd(28)} ${String(issuer.length).padStart(6)} chars  ok`)
  }

  let token = (process.env.GITHUB_TOKEN ?? (existsSync(TOKEN_FILE) ? readFileSync(TOKEN_FILE, 'utf8') : '')).trim()
  if (!token) {
    // Falls back to the GitHub CLI, so `gh auth login` is enough and there is
    // no token for anyone to copy, paste or mislay.
    for (const bin of [join(homedir(), 'bin', 'gh'), 'gh']) {
      try {
        token = execFileSync(bin, ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
        if (token) { console.log('Using the credential from `gh auth login`.'); break }
      } catch { /* not installed or not logged in; try the next */ }
    }
  }
  if (!token) {
    console.error(`No credential. Run \`gh auth login\`, or put a token in ${TOKEN_FILE}.`)
    console.error('Create one at https://github.com/settings/tokens with permission to write repository secrets.')
    process.exit(1)
  }

  const api = async (path, init = {}) => {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers ?? {}),
      },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status} ${body.slice(0, 200)}`)
    }
    return res.status === 204 ? null : res.json()
  }

  console.log('Fetching the repository public key')
  const { key, key_id } = await api('/actions/secrets/public-key')

  // GitHub seals secrets with libsodium crypto_box_seal, which Node's webcrypto
  // does not provide, so the reference implementation does the sealing.
  const sodium = (await import('libsodium-wrappers')).default
  await sodium.ready

  for (const [name, value] of Object.entries(values)) {
    const sealed = sodium.crypto_box_seal(
      sodium.from_string(value),
      sodium.from_base64(key, sodium.base64_variants.ORIGINAL),
    )
    await api(`/actions/secrets/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL),
        key_id,
      }),
    })
    console.log(`  set ${name}`)
  }

  console.log('All six uploaded from the files, so none can be a stray path.')
  console.log('Verify with: Actions -> Verify secrets -> Run workflow')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
