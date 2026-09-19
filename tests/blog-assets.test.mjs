import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
test('every local blog image reference resolves to published artwork', () => {
  for (const file of readdirSync(resolve(root, 'public/blog-posts'))) {
    if (!/\.(json|html|md)$/.test(file)) continue
    const contents = readFileSync(resolve(root, 'public/blog-posts', file), 'utf8')
    for (const [url] of contents.matchAll(/\/blog-images\/[a-zA-Z0-9_-]+\.(?:png|webp|jpg|jpeg|svg)/g)) {
      assert.ok(existsSync(resolve(root, 'public', url.slice(1))), `${file}: ${url}`)
    }
  }
})

test('all listed articles have a readable body', () => {
  const posts = JSON.parse(readFileSync(resolve(root, 'public/blog-posts/index.json'), 'utf8'))
  for (const post of posts) assert.ok(post.content?.length > 100, post.slug)
})
