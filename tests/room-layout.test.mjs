import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const roomPage = await readFile(new URL('../src/rooms/RoomPage.tsx', import.meta.url), 'utf8')

test('keeps the self-view inside the video stage above the icebreaker panel', () => {
  const videoStage = roomPage.match(
    /<section aria-label="Área de vídeo"[\s\S]*?<\/section>\s*<IcebreakerPanel/,
  )

  assert.ok(videoStage, 'expected a dedicated video stage before the icebreaker panel')
  assert.match(videoStage[0], /<RoomVideoGrid/)
  assert.match(videoStage[0], /<SelfView/)
})
