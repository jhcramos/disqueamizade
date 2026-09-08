import { marked } from 'marked'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const directory = resolve(root, 'public/blog-posts')
const indexPath = resolve(directory, 'index.json')
const posts = JSON.parse(readFileSync(indexPath, 'utf8'))
// Older publishers stored article bodies separately from the listing.
for (const post of posts) {
  if (post.content) continue
  const stem = post.slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const slug of new Set([post.slug, stem])) {
    for (const extension of ['json', 'html', 'md']) {
      const path = resolve(directory, `${slug}.${extension}`)
      if (!existsSync(path)) continue
      const source = readFileSync(path, 'utf8')
      let record
      if (extension === 'json') {
        try { record = JSON.parse(source) }
        catch {
          // Some legacy documents have unescaped quotation marks in HTML.
          const raw = source.match(/"content"\s*:\s*"([\s\S]*?)",\s*"(?:category|tags|author)"/)
          if (!raw) throw new Error(`Invalid legacy article: ${slug}`)
          record = { content: raw[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') }
        }
      }
      const content = extension === 'json' ? record.content
        : extension === 'md' ? marked.parse(source.replace(/^# [^\n]+\n/, '')) : source
      if (typeof content === 'string' && content.trim()) { post.content = content; break }
    }
    if (post.content) break
  }
  if (!post.content) throw new Error(`Missing article body: ${post.slug}`)
}
const available = (url) => typeof url === 'string' && url.startsWith('/blog-images/') && existsSync(resolve(root, 'public', url.slice(1)))
const categories = new Map()
for (const post of posts) {
  const image = [post.coverImage, post.image].find(available)
  if (image && !categories.has(post.category)) categories.set(post.category, image)
}
let repaired = 0
for (const name of readdirSync(directory)) {
  if (!/\.(json|html|md)$/.test(name)) continue
  const path = resolve(directory, name)
  const before = readFileSync(path, 'utf8')
  // Index records need their own topic, while individual documents inherit it.
  const repair = (text, category) => text.replace(/\/blog-images\/[a-zA-Z0-9_-]+\.(?:png|webp|jpg|jpeg|svg)/g, url => {
    if (available(url)) return url
    repaired++
    const webp = url.replace(/\.[^.]+$/, '.webp')
    return available(webp) ? webp : categories.get(category) || '/blog-images/placeholder.svg'
  })
  let after
  if (name === 'index.json') {
    after = JSON.stringify(posts.map(post => JSON.parse(repair(JSON.stringify(post), post.category))), null, 2) + '\n'
  } else {
    const post = posts.find(p => name.startsWith(p.slug + '.'))
    after = repair(before, post?.category)
  }
  if (before !== after) writeFileSync(path, after)
}
console.log(`[blog] ${repaired} missing image references repaired using existing artwork.`)
