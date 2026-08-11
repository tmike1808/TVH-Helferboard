import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Browser-Titel lautet exakt TVH Dashboard', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')

  assert.match(html, /<title>TVH Dashboard<\/title>/)
  assert.doesNotMatch(html, /TV Homburg V24/)
})
