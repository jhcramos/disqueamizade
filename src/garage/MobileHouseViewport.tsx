import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Focus, Maximize2 } from 'lucide-react';
import type { Point } from './model';

export const HouseTrayContext = createContext<HTMLElement | null>(null);
export function HouseTray({ children }: { children: ReactNode }) {
  const target = useContext(HouseTrayContext);
  return target ? createPortal(children, target) : <>{children}</>;
}
export function useMobileHouse() {
  const query = '(max-width: 700px), (pointer: coarse) and (max-width: 1000px)';
  const [mobile, setMobile] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return mobile;
}
export function MobileHouseViewport({ active, position, room, children }: { active: boolean; position: Point; room: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 600 });
  const [overview, setOverview] = useState(false);
  const [settled, setSettled] = useState(false);
  const [pan, setPan] = useState<Point | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number; origin: Point; dragging: boolean }>();
  useEffect(() => { setPan(null); setOverview(false); }, [room]);
  useEffect(() => { setSettled(false); const timer = setTimeout(() => setSettled(true), 200); return () => clearTimeout(timer); }, [overview, active, size.w, size.h]);
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const observer = new ResizeObserver(() => { setSize({ w: el.clientWidth, h: el.clientHeight }); setPan(null); });
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);
  const width = overview ? Math.min(size.w, size.h * 1.5) : Math.max(size.w * 2.15, size.h * 1.575);
  const height = width / 1.5;
  const clamp = (value: number, viewport: number, world: number) => world <= viewport ? (viewport - world) / 2 : Math.max(viewport - world, Math.min(0, value));
  const offset = {
    x: clamp(pan?.x ?? size.w / 2 - position.x * width, size.w, width),
    y: clamp(pan?.y ?? size.h * .56 - (position.y - .10) * height, size.h, height),
  };
  return <div className={active ? `house-viewport ${overview ? 'is-overview' : 'is-close'} ${pan ? 'is-panning' : ''} ${settled ? 'is-settled' : ''}` : 'house-viewport-desktop'} ref={ref}
    onPointerDown={e => {
      if (!active || overview || (e.target as HTMLElement).closest('button, input, summary')) return;
      gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, origin: offset, dragging: false };
    }}
    onPointerMove={e => {
      const g = gesture.current;
      if (!g || g.id !== e.pointerId) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (Math.hypot(dx, dy) > 8) { g.dragging = true; e.currentTarget.setPointerCapture(e.pointerId); setPan({ x: clamp(g.origin.x + dx, size.w, width), y: clamp(g.origin.y + dy, size.h, height) }); }
    }}
    onPointerUp={e => {
      const g = gesture.current;
      if (!g || g.id !== e.pointerId) return;
      if (!g.dragging) setPan(null);
      gesture.current = undefined;
    }}
    onPointerCancel={() => { gesture.current = undefined; }}>
    <div className="house-world-camera" style={active ? { width, height, transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` } : undefined}>{children}</div>
    {active && <>
      <div className="house-camera-controls">
        <button onClick={() => { setSettled(false); setOverview(!overview); setPan(null); }} aria-pressed={overview}><Maximize2 size={16} />{overview ? 'Voltar para perto' : 'Ver ambiente inteiro'}</button>
        {pan && <button onClick={() => setPan(null)}><Focus size={16} /> Voltar ao meu avatar</button>}
      </div>
      <p className="house-camera-hint">{overview ? 'Toque no piso para ir até lá' : pan ? 'Explorando · toque no piso para andar' : 'Toque para andar · arraste para olhar'}</p>
    </>}
  </div>;
}
