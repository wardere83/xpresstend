#!/usr/bin/env node
/**
 * Copies the built site into the repository root.
 *
 * GitHub Pages for this repo is set to "Deploy from a branch", so its own
 * builder publishes the repository root and overwrites whatever the Actions
 * workflow uploads. Rather than leave the site broken, the root is made a valid
 * copy of the build so both publishers serve the same thing.
 *
 * This is a workaround, not the destination. Setting Pages -> Source to
 * "GitHub Actions" makes it unnecessary, and then this script and the committed
 * artifacts below can be deleted in one commit.
 */
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(repo, 'dist')

if (!existsSync(dist)) {
  console.error('publish-root: dist/ is missing. Run the build first.')
  process.exit(1)
}

// Asset filenames carry a content hash, so stale ones would pile up forever.
await rm(path.join(repo, 'assets'), { recursive: true, force: true })

const entries = await readdir(dist)
for (const name of entries) {
  const from = path.join(dist, name)
  const to = path.join(repo, name)
  await cp(from, to, { recursive: true })
}

// Without this the branch builder runs the output through Jekyll, which drops
// files and directories whose names begin with an underscore.
await mkdir(repo, { recursive: true })
await writeFile(path.join(repo, '.nojekyll'), '')

const { size } = await stat(path.join(repo, 'index.html'))
console.log(`publish-root: copied ${entries.length} entries to the repo root (index.html ${size} bytes)`)
