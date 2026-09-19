import {HouseChannel} from "../network/HouseChannel";
import { useEffect, useRef, useState } from 'react';
import type { Person, RoomId } from '../model';
import { changeScreening, emptyScreening, parseScreening, type Command, type Screening } from './model';

/** The house's local transport. A deterministic coordinator serializes requests;
 * a separate DJ owns playback. Never present this as authenticated online delivery. */
export function useScreening(room: RoomId, mode: 'local' | 'online', self: Person, people: Person[]) {
  const roster = useRef([self, ...people]); roster.current = [self, ...people];
  const [state, setState] = useState<Screening>(emptyScreening), [ready, setReady] = useState(false), [error, setError] = useState('');
  const command = useRef<(cmd: Command) => void>(() => {});
  const current = useRef(state);
  useEffect(() => {
    setReady(false); setError(''); current.current = emptyScreening(); setState(current.current);
    if (mode !== 'local') return;
    const bus = new HouseChannel(`disque-screening-v1:${room}`);
    let active = true, settled = false, leader = '', nonce = 0;
    const seen = new Set<string>(), limits = new Map<string, number>();
    const members = () => roster.current.filter(p => (p.room ?? 'garage') === room);
    const coordinator = () => members().map(p => p.id).sort()[0];
    const publish = () => bus.postMessage({ type: 'state', from: self.id, state: current.current });
    const apply = (s: Screening) => { current.current = s; if (active) setState(s); };
    const handle = (from: string, cmd: Command, id: string) => {
      const person = members().find(p => p.id === from);
      if (!person || seen.has(id) || Date.now() - (limits.get(from) ?? 0) < 250) return;
      seen.add(id); if (seen.size > 200) seen.delete(seen.values().next().value!);
      limits.set(from, Date.now());
      const next = changeScreening(current.current, cmd, person);
      if (next !== current.current) { apply(next); publish(); }
      else if (from === self.id) setError('Não foi possível alterar a fila. Confira o controle, os vídeos repetidos e o limite de 3 pedidos por pessoa.');
      else bus.postMessage({ type: 'rejected', from: self.id, to: from });
    };
    bus.onmessage = ({ data: m }) => {
      if (!m || typeof m !== 'object' || !members().some(p => p.id === m.from)) return;
      if (m.type === 'hello' && (coordinator() === self.id || current.current.revision > 0)) publish();
      if (m.type === 'state') {
        const next = parseScreening(m.state);
        // During election, accept the newest snapshot from a still-present peer.
        if (next && (m.from === coordinator() || !settled || leader !== coordinator()) && next.revision >= current.current.revision) apply(next);
      }
      if (m.type === 'command' && coordinator() === self.id && settled && typeof m.id === 'string' && m.id.length < 120) handle(m.from, m.command, m.id);
      if (m.type === 'rejected' && m.from === coordinator() && m.to === self.id) setError('Pedido não aceito: confira vídeos repetidos, limite da fila e quem está no controle.');
    };
    command.current = cmd => {
      if (!settled) return;
      setError(''); const id = `${self.id}:${++nonce}`;
      if (coordinator() === self.id) handle(self.id, cmd, id);
      else bus.postMessage({ type: 'command', from: self.id, command: cmd, id });
    };
    bus.postMessage({ type: 'hello', from: self.id });
    const timer = window.setInterval(() => {
      const nextLeader = coordinator();
      if (nextLeader !== leader) { leader = nextLeader; settled = false; setReady(false); bus.postMessage({ type: 'hello', from: self.id }); return; }
      settled = true; setReady(true);
      if (leader === self.id) {
        if (current.current.dj && !members().some(p => p.id === current.current.dj)) apply({ ...current.current, dj: null, revision: current.current.revision + 1 });
        publish();
      } else if (!current.current.revision) bus.postMessage({ type: 'hello', from: self.id });
    }, 800);
    return () => { active = false; clearInterval(timer); bus.close(); command.current = () => {}; };
  }, [room, mode, self.id]);
  return { state, ready, error, send: (cmd: Command) => command.current(cmd), available: mode === 'local' };
}
