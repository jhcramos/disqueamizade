import { readdir, readFile, writeFile, rename, unlink, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Run again after adding blog PNGs. Originals survive until every replacement
// decodes. References to previously missing artwork are retained and reported.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const images = join(root, 'public/blog-images')
const pngs = (await readdir(images)).filter(name => name.endsWith('.png'))
// This historical asset has invalid compressed data; never publish a forgiving
// decode (which produces black/noisy pixels). Reuse the generic Brazil map.
const corrupted = 'chat-online-fortaleza-ceara-nordeste.png'
const corruptedHash = '4cf6d0ff49720fd0f1c05a92195e7c1074a09d6fe0c0437842269609bf8685dc'
const fallback = 'salas-de-chat-por-cidade-brasil.webp'
let originalBytes = 0
let removedCorruptOriginal = false
for (const name of pngs) {
  const source = join(images, name)
  const destination = join(images, name.replace(/\.png$/, '.webp'))
  originalBytes += (await stat(source)).size
  if (name === corrupted
    && createHash('sha256').update(await readFile(source)).digest('hex') === corruptedHash) {
    removedCorruptOriginal = true
    continue
  }
  const temporary = `${destination}.tmp`
  try {
    await sharp(source).rotate().resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 }).toFile(temporary)
    await rename(temporary, destination)
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw new Error(`Could not convert ${name}; originals retained`, { cause: error })
  }
}

const webps = (await readdir(images)).filter(name => name.endsWith('.webp'))
const available = new Set(webps)
let optimizedBytes = 0
for (const name of webps) {
  const path = join(images, name)
  const metadata = await sharp(path).metadata()
  if (metadata.format !== 'webp' || !metadata.width || metadata.width > 1200) {
    throw new Error(`Invalid WebP dimensions or format: ${name}`)
  }
  await sharp(path).raw().toBuffer() // Decode all pixels, not just the header.
  optimizedBytes += (await stat(path)).size
}

const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: root, encoding: 'utf8' })
  .split('\0').filter(file => /\.(json|html|md|mjs|js|jsx|ts|tsx|py)$/.test(file)
    && !file.startsWith('docs/') && file !== 'package-lock.json'))]
const edits = []
let references = 0
const missing = new Set()
for (const file of files) {
  const path = join(root, file)
  let before
  try {
    before = await readFile(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') continue // A tracked file may be locally deleted.
    throw error
  }
  const after = before.replace(/(\/blog-images\/)([a-zA-Z0-9_-]+)\.(png|webp)\b/g,
    (reference, prefix, stem) => {
      const name = `${stem}.webp`
      references++
      if (!available.has(name)) {
        if (`${stem}.png` === corrupted) {
          if (!available.has(fallback)) throw new Error(`Missing fallback image ${fallback}`)
          return `${prefix}${fallback}`
        }
        missing.add(name)
        return reference // Preserve pre-existing missing artwork for content curation.
      }
      return `${prefix}${name}`
    })
  if (after !== before) edits.push([path, after])
}
for (const [path, contents] of edits) await writeFile(path, contents)
for (const name of pngs) await unlink(join(images, name))

console.log(JSON.stringify({ converted: pngs.length - Number(removedCorruptOriginal),
  removedCorruptOriginal, verified: webps.length,
  references, updatedFiles: edits.length, preexistingMissingImages: missing.size,
  originalBytes, optimizedBytes }, null, 2))
