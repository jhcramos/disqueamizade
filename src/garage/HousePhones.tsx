import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, PhoneOff, Volume2, VolumeX, X } from 'lucide-react';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { fetchRoomToken, isLiveKitConfigured } from '@/rooms/livekit';
import { CameraSetupProvider } from '@/rooms/CameraSetup';
import { RouletteCall } from '@/rooms/RouletteCall';
import { reportUser } from '@/services/moderation';
import { HOUSE_PHONES, type PhoneState } from './phoneModel';
import { ROOMS, type RoomId } from './model';
import './housePhones.css';

type Props = { room: RoomId; name: string; adult: boolean; busy: boolean; target: HTMLElement|null; open: boolean; onClose: () => void; onBusy: (busy: boolean) => void };
const configured = () => isLiveKitConfigured() && !!import.meta.env.VITE_SUPABASE_URL;
const errorText = (error: unknown) => {
  const message = String((error as {message?:string})?.message || error);
  if (message.includes('phone_in_another_tab')) return 'Os telefones estão ativos em outra aba da sua conta. Feche-a e aguarde alguns segundos.';
  if (message.includes('call_unavailable')) return 'Esta ligação já foi atendida ou terminou.';
  if (message.includes('please_wait')) return 'Espere alguns segundos antes de ligar novamente.';
  return 'Não foi possível conectar o telefone. Tente novamente em instantes.';
};

export function HousePhones(props: Props) {
  const latest = useRef(props); latest.current = props;
  const [tab] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<PhoneState>({});
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string|null>(null);
  const [muted, setMuted] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(enabled); enabledRef.current = enabled;
  const [token, setToken] = useState<{id:string; value:string}|null>(null);
  const audio = useRef<AudioContext|null>(null);
  const mounted = useRef(true);
  const working = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const mine = state.mine;
  const active = !!mine;
  const rings = (state.rings || []).filter(r => Date.parse(r.expires)>Date.now());
  const visible = props.open || !!selected || active;
  const chosen = selected || mine?.source || HOUSE_PHONES[props.room][0].id;
  const incoming = rings.find(r => r.phone === chosen);
  const identity = useAuthStore(s => s.user?.id);

  const request = useCallback(async (action = 'poll', phone?: string, call?: string) => {
    const p = latest.current;
    const { data, error: failure } = await supabase.rpc('house_phone_desk', {
      p_tab: tab, p_room: p.room, p_available: enabledRef.current && !p.busy,
      p_adult: p.adult, p_action: action, p_phone: phone || null, p_call: call || null,
    });
    if (failure) throw failure;
    return data as PhoneState;
  }, [tab]);

  useEffect(() => {
    mounted.current = true;
    let stopped = false;
    const poll = async () => {
      if (working.current || stopped) return;
      working.current = true;
      try {
        await useAuthStore.getState().initialize();
        if (!useAuthStore.getState().user) await useAuthStore.getState().signInAsGuest(latest.current.name);
        if (stopped) return;
        const next = await request();
        if (!stopped) { setState(next); setReady(true); setError(''); }
      } catch (e) { if (!stopped) { setReady(false); setState({}); setError(errorText(e)); } }
      finally { working.current = false; }
    };
    if (configured()) void poll();
    const timer = window.setInterval(() => { if (configured()) void poll(); }, 4000);
    return () => { stopped = true; mounted.current = false; clearInterval(timer); if (configured()) void request('leave').catch(() => {}); };
  }, [request]);
  useEffect(() => { if (ready && !working.current) void request().then(setState).catch(() => {}); }, [props.room, props.busy, enabled, props.adult, request, ready]);
  useEffect(() => { props.onBusy(active); }, [active, props.onBusy]);
  useEffect(() => {
    if (visible && !dialog.current?.open) dialog.current?.showModal();
    if (!visible) dialog.current?.close();
  }, [visible]);
  useEffect(() => { setSelected(null); }, [props.room]);
  useEffect(() => {
    let cancelled = false;
    setToken(null);
    if (mine?.status === 'accepted' && mine.roomId && mine.inviteId && identity) {
      void fetchRoomToken(mine.roomId, identity, mine.inviteId).then(value => {
        if (!cancelled) setToken({id: mine.id, value});
      }).catch(e => { if (!cancelled) setError(errorText(e)); });
    }
    return () => { cancelled = true; };
  }, [mine?.id, mine?.status, identity]);
  const ringKey = rings.map(r => r.id).join(',');
  useEffect(() => {
    const unlock = () => { if (!muted && configured()) { audio.current ||= new AudioContext(); void audio.current.resume().catch(() => {}); } };
    document.addEventListener('pointerdown', unlock);
    return () => document.removeEventListener('pointerdown', unlock);
  }, [muted]);
  useEffect(() => {
    if (muted || !ringKey || props.busy || active) return;
    const chime = () => {
      const ctx = audio.current;
      if (!ctx || ctx.state !== 'running') return;
      for (const offset of [0, .24]) {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = 660;
        gain.gain.setValueAtTime(0, ctx.currentTime+offset);
        gain.gain.linearRampToValueAtTime(.045,ctx.currentTime+offset+.015);
        gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+offset+.19);
        oscillator.connect(gain); gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime+offset); oscillator.stop(ctx.currentTime+offset+.2);
      }
    };
    chime(); const timer = setInterval(chime, 3200);
    return () => clearInterval(timer);
  }, [muted, ringKey, props.busy, active]);
  useEffect(() => () => { void audio.current?.close(); }, []);
  async function act(action: string, callId?: string) {
    if (working.current) return;
    working.current = true; setPending(true); setError('');
    if (action === 'end') setToken(null);
    try { const next = await request(action, chosen, callId); if (mounted.current) setState(next); }
    catch (e) { if (mounted.current) setError(errorText(e)); }
    finally { working.current = false; if (mounted.current) setPending(false); }
  }
  const close = () => { if (!active) { setSelected(null); props.onClose(); } };
  const ending = () => { void act('end'); };
  return <>
    {props.target && createPortal(HOUSE_PHONES[props.room].map((phone, i) => {
      const ringing = rings.some(r => r.phone === phone.id) && !props.busy && !active;
      return <button key={phone.id} className={`house-red-phone${ringing?' is-ringing':''}`} style={{left:`${phone.x*100}%`,top:`${phone.y*100}%`}}
        aria-label={`Telefone vermelho ${i+1}${ringing ? ': atender ligação' : ': Disque Surpresa'}`} onClick={() => setSelected(phone.id)} disabled={props.busy}>
        <span className="red-phone-body" aria-hidden="true"><Phone/><span className="red-phone-dial"/><i/></span>
        {ringing && <span className="red-phone-answer">Atender</span>}
      </button>;
    }), props.target)}
    {rings.length>0 && !active && !props.busy && <button className="phone-ring-notice" onClick={() => setSelected(rings[0].phone)}><Phone size={18}/> Um telefone está tocando <strong>Atender</strong></button>}
    <dialog ref={dialog} className={`house-phone-dialog${mine?.status==='accepted'?' has-call':''}`} onCancel={e => {e.preventDefault(); close();}} aria-labelledby="house-phone-title">
      {!active && <button className="house-phone-close" aria-label="Fechar telefones" onClick={close}><X/></button>}
      <header><span className="phone-eyebrow">DISQUE SURPRESA · 1 A 1</span><h2 id="house-phone-title">{mine?.status==='accepted'?'Alô, nova companhia.':mine?'Tem alguém do outro lado?':incoming?'Tem uma ligação para a casa.':'Quem será que vai atender?'}</h2></header>
      {mine?.status==='accepted' && token?.id===mine.id && identity && mine.roomId && mine.peer ?
        <div className="house-phone-video"><CameraSetupProvider><RouletteCall roomId={mine.roomId} token={token.value} identity={identity} displayName={props.name} peerId={mine.peer} isGuest={true} onEnd={ending} onNext={ending} onReport={peer => {void reportUser({reportedIdentity:peer,reporterIdentity:identity,reason:'inappropriate_content',roomSlug:mine.roomId!}); ending();}}/></CameraSetupProvider></div>
      : <>
        <div className={`phone-dialog-art${incoming || mine?.status === 'ringing' ? ' is-ringing' : ''}`} aria-hidden="true"><Phone size={46}/></div>
        <p>{mine ? mine.status==='accepted'?'Conectando a conversa…':'Um telefone foi sorteado. Ele está tocando em '+ROOMS[mine.target.split('-')[0] as RoomId].name+'.' : incoming?'Toque em atender para começar uma conversa só entre vocês.':'Ligue para um dos telefones da casa. O destino é sorteado entre ambientes com alguém disponível.'}</p>
        {state.notice==='empty' && <p role="status">Ninguém disponível para atender agora. Continue na casa e tente novamente daqui a pouco.</p>}
        {!configured() && <p role="status">As ligações precisam da conexão online da casa.</p>}
        {error && <p role="alert">{error}</p>}
        {active ? <button className="phone-primary" onClick={ending} disabled={pending}><PhoneOff size={18}/>{mine?.status==='accepted'?'Encerrar conversa':'Cancelar ligação'}</button> :
          <button className="phone-primary" disabled={!ready || pending || props.busy || !enabled} onClick={() => void act(incoming?'answer':'call',incoming?.id)}><Phone size={18}/>{pending?'Conectando…':incoming?'Atender ligação':'Ligar para alguém'}</button>}
        <small>Câmera e microfone começam desligados. Você escolhe se quer ativá-los.</small>
      </>}
      {!active && <footer><label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}/> Disponível para receber ligações</label><button onClick={() => { if (muted) {audio.current ||= new AudioContext(); void audio.current.resume();} setMuted(!muted); }}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>} {muted?'Ativar toque':'Silenciar toque'}</button></footer>}
    </dialog>
  </>;
}
