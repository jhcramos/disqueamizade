import { useId, useRef } from 'react';
import { Armchair, ChevronDown, LockKeyhole, X } from 'lucide-react';

type Props = {
  name: string;
  free: number;
  open: boolean;
  disabled?: boolean;
  poker?: boolean;
  register: (node: HTMLDivElement | null) => void;
  onOpen: (open: boolean) => void;
  onSit: () => void;
};

/** One quiet marker per piece of furniture; details are deliberately requested. */
export function SeatIndicator({ name, free, open, disabled, poker, register, onOpen, onSit }: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const availability = free === 0 ? 'Sem lugares livres' : `${free} ${free === 1 ? 'lugar livre' : 'lugares livres'}`;
  const close = () => { onOpen(false); trigger.current?.focus(); };
  return <div ref={register} className={`garage3d-seat-anchor${open ? ' is-open' : ''}`}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onOpen(false); }}
    onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); close(); } }}>
    <button ref={trigger} className="garage3d-seat-indicator" aria-label={`${name} · ${availability}`}
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => onOpen(!open)}>
      <span className={`seat-indicator-symbol${free === 0 ? ' is-occupied' : ''}`} aria-hidden="true">
        {free > 0 ? <ChevronDown size={18} strokeWidth={2.5}/> : <LockKeyhole size={12}/>}
      </span>
    </button>
    {!open && <span className="seat-indicator-hint" aria-hidden="true">{name}<small>{availability}</small></span>}
    {open && <div id={id} className="garage3d-seat-detail" role="group" aria-label={name}>
      <strong>{name}</strong><small>{availability}</small>
      <button className="seat-detail-close" aria-label="Fechar assento" onClick={close}><X size={15}/></button>
      <button className="seat-detail-action" disabled={disabled || free === 0} onClick={onSit}>
        <Armchair size={16}/>{poker ? 'Jogar pôquer' : 'Sentar aqui'}
      </button>
    </div>}
  </div>;
}
