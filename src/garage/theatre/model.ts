export type Clip = { id: string; video: string; title: string; by: string; name: string };
export type Screening = { revision: number; dj: string | null; queue: Clip[]; current: Clip | null; offset: number; started: number | null };
export const emptyScreening = (): Screening => ({ revision: 0, dj: null, queue: [], current: null, offset: 0, started: null });
export function youtubeId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    let id: string | null = null;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else id = /^\/(?:shorts|embed|live)\/([^/]+)$/.exec(url.pathname)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export function playbackTime(state: Screening, now = Date.now()) {
  return Math.max(0, Math.min(86400, state.offset + (state.started === null ? 0 : (now - state.started) / 1000)));
}
export type Command = { kind: 'claim' | 'release' | 'add' | 'remove' | 'next' | 'pause' | 'resume'; id?: string; video?: string; title?: string; expected?: string };
export function changeScreening(state: Screening, raw: Command, person: { id: string; name: string }, now = Date.now()): Screening {
  if (!raw || typeof raw !== 'object') return state;
  const mine = state.dj === person.id;
  let next = { ...state };
  switch (raw.kind) {
    case 'claim': if (state.dj) return state; next.dj = person.id; break;
    case 'release': if (!mine) return state; next.dj = null; break;
    case 'add': {
      if (!raw.video || !/^[\w-]{11}$/.test(raw.video) || typeof raw.title !== 'string' || !raw.title.trim() || raw.title.length > 100 || typeof raw.id !== 'string' || raw.id.length > 80) return state;
      if (state.queue.length >= 12 || state.queue.filter(c => c.by === person.id).length >= 3 || state.queue.some(c => c.video === raw.video) || state.current?.video === raw.video) return state;
      next.queue = [...state.queue, { id: raw.id, video: raw.video, title: raw.title.trim(), by: person.id, name: person.name.slice(0, 24) }]; break;
    }
    case 'remove': {
      const clip = state.queue.find(c => c.id === raw.id);
      if (!clip || (!mine && clip.by !== person.id)) return state;
      next.queue = state.queue.filter(c => c.id !== raw.id); break;
    }
    case 'next':
      if (!mine || (raw.expected !== undefined && raw.expected !== state.current?.id)) return state;
      next.current = state.queue[0] ?? null; next.queue = state.queue.slice(1); next.offset = 0; next.started = next.current ? now : null; break;
    case 'pause': if (!mine || !state.current || state.started === null) return state; next.offset = playbackTime(state, now); next.started = null; break;
    case 'resume': if (!mine || !state.current || state.started !== null) return state; next.started = now; break;
    default: return state;
  }
  return { ...next, revision: state.revision + 1 };
}
export function parseScreening(raw: unknown): Screening | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Screening;
  const clip = (c: Clip) => c && typeof c.id === 'string' && c.id.length <= 80 && typeof c.video === 'string' && /^[\w-]{11}$/.test(c.video) && typeof c.title === 'string' && c.title.length <= 100 && typeof c.by === 'string' && c.by.length <= 80 && typeof c.name === 'string' && c.name.length <= 24;
  if (!Number.isSafeInteger(s.revision) || s.revision < 0 || !(s.dj === null || (typeof s.dj === 'string' && s.dj.length <= 80)) || !Array.isArray(s.queue) || s.queue.length > 12 || !s.queue.every(clip) || !(s.current === null || clip(s.current)) || !Number.isFinite(s.offset) || s.offset < 0 || s.offset > 86400 || !(s.started === null || (Number.isFinite(s.started) && s.started > 0 && s.started <= Date.now() + 10000))) return null;
  return { revision: s.revision, dj: s.dj, queue: s.queue, current: s.current, offset: s.offset, started: s.started };
}
