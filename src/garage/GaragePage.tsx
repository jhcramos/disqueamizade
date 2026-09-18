import { HousePhones } from "./HousePhones";
import { HouseTrayContext, MobileHouseViewport, useMobileHouse } from './MobileHouseViewport';
import { GatheringPanel } from './GatheringPanel';
import { CONVERSATION_SPOTS, type ConversationSpot } from './gatherings';
import { useSocialChat } from "./useSocialChat";
import { SocialChat } from "./SocialChat";
import { BrandLogo } from "../components/common/BrandLogo";
import { AccountModal } from "../social/AccountPanel";
import { RoomChat } from "./RoomChat";
import { useRoomChat } from "./useRoomChat";
import { CameraPreview } from "./CameraPreview";
import { AVATAR_PRESETS, presetAppearance } from "./avatarPresets";
import { BarPlay } from "./BarPlay";
import { HOUSE_SEATS, seatsForRoom, seatWinner } from "./seats";
import { personalSpace } from "./model";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { readSavedAvatar, saveAvatar, type Appearance } from "./avatarStyle";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  Armchair,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Check,
  DoorOpen,
  Footprints,
  House,
  List,
  MessageCircle,
  MicOff,
  Settings2,
  Sparkles,
  UserRound,
  Users,
  VideoOff,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { GarageScene } from "../garage3d/HouseScene";
import {
  AVATARS,
  ROOMS,
  freeSpawn,
  distance,
  inside,
  nearby,
  sameRoom,
  START,
  type RoomId,
  type Person,
} from "./model";
import { useGarage, type ConnectionMode } from "./useGarage";
import { CloudCall, LocalCall } from "./GarageCall";
import "./garage.css";
import { useAgeVerification } from "@/components/common/AgeVerificationModal";
import { RoomPlay } from "./RoomPlay";
import { useRoomPlay } from "./useRoomPlay";
import { AvatarPortrait } from "./AvatarPortrait";

export default function GaragePage() {
  const [saved] = useState(readSavedAvatar);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false),
    [appearance, setAppearance] = useState(saved.appearance);
  const [entered, setEntered] = useState(false),
    [name, setName] = useState(""),
    [avatar, setAvatar] = useState(saved.avatar),
    [mode, setMode] = useState<ConnectionMode>("local"),
    [entryError, setEntryError] = useState(""),
    [busy, setBusy] = useState(false);
  const { user, signInAsGuest } = useAuthStore();
  const { verifyAge } = useAgeVerification();
  const configured = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_LIVEKIT_URL &&
      import.meta.env.VITE_GARAGE_ROOM_SLUG,
  );
  async function enter() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (mode === "online" && !user) await signInAsGuest();
      setEntered(true);
    } catch {
      setEntryError(
        "Não foi possível entrar agora. Tente novamente em instantes.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (entered)
    return (
      <GarageRoom
        name={name.trim().slice(0, 24)}
        initialAppearance={appearance}
        onAvatarSaved={(id, look) => {
          setAvatar(id);
          setAppearance(look);
        }}
        initialAvatar={avatar}
        mode={mode}
        userId={user?.id}
        onLeave={() => setEntered(false)}
      />
    );
  return (
    <main className="garage-app garage-entry">
      <header className="garage-topbar">
        <Link to="/" className="garage-brand">
          <BrandLogo />
        </Link>
        <span className="garage-tag">BEM-VINDO À CASA</span>
        <Link to="/rooms">
          Voltar às salas <ArrowRight size={16} />
        </Link>
      </header>
      <div className="entry-layout">
        <section className="entry-picture">
          <img
            src="/garage/whole-house.webp"
            alt="Nossa casa: garagem, sala de estar e Bar Vinyl conectados"
          />
          <div className="entry-story">
            <span className="eyebrow">A CASA ESTÁ ABERTA</span>
            <h1>
              Chegue como você é.
              <br />
              <em>Encontre sua turma.</em>
            </h1>
            <p>
              Escolha seu avatar e entre na casa. Lá dentro, você pode mudar de
              ambiente quando quiser.
            </p>
          </div>
        </section>
        <section className="entry-form">
          <span className="eyebrow">ANTES DE TOCAR A CAMPAINHA</span>
          <h2>
            Quem está
            <br />
            chegando?
          </h2>
          <label htmlFor="garage-name">Como podemos chamar você?</label>
          <input
            id="garage-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="Seu nome ou apelido"
            autoComplete="nickname"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (mode === "online") verifyAge(() => void enter());
                else void enter();
              }
            }}
          />
          <p className="field-label">
            Escolha seu avatar <span>5 masculinos · 5 femininos</span>
          </p>
          <AvatarPicker
            value={avatar}
            onChange={(index) => {
              setAvatar(index);
              setAppearance({
                ...presetAppearance(index),
                intention: appearance.intention,
              });
            }}
          />
          <button
            className="garage-secondary entry-customize"
            onClick={() => setCustomizing(true)}
          >
            <Settings2 size={16} />
            Personalizar este avatar
          </button>
          {import.meta.env.DEV &&
            new URLSearchParams(location.search).has("devTools") && (
              <>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "local"}
                    onChange={() => setMode("local")}
                  />
                  <span>
                    Visita local
                    <small>
                      Explore e teste com outra aba deste navegador.
                    </small>
                  </span>
                </label>
                <label
                  className={`mode-option ${!configured ? "unavailable" : ""}`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "online"}
                    disabled={!configured}
                    onChange={() => setMode("online")}
                  />
                  <span>
                    Entrar online
                    <small>
                      {configured
                        ? "Encontre outros participantes da garagem experimental."
                        : "Disponível no ambiente com Supabase e LiveKit configurados."}
                    </small>
                  </span>
                </label>
              </>
            )}
          <button
            className="garage-secondary"
            onClick={() => setPreviewOpen(true)}
          >
            <Camera size={18} />
            Testar câmera e máscara antes de entrar
          </button>
          {entryError && <p role="alert">{entryError}</p>}
          <button
            className="garage-primary"
            disabled={!name.trim() || busy}
            onClick={() =>
              mode === "online" ? verifyAge(() => void enter()) : void enter()
            }
          >
            {busy ? "Entrando…" : "Entrar na casa"}
            <ArrowRight />
          </button>
          <p className="garage-note">
            <VideoOff size={15} /> Câmera e microfone começam desligados.
          </p>
          {mode === "local" && (
            <div className="entry-availability">
              <p>
                Por enquanto, você pode explorar a casa. Os encontros online
                nesses ambientes estarão disponíveis em breve.
              </p>
              <Link to="/rooms">
                Quer conversar agora? Conheça as salas online{" "}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
      </div>
      {previewOpen && (
        <CameraPreview
          avatar={avatar}
          appearance={appearance}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {customizing && (
        <AvatarCustomizer
          avatar={avatar}
          appearance={appearance}
          onClose={() => setCustomizing(false)}
          onApply={(id, look) => {
            setAvatar(id);
            setAppearance(look);
            saveAvatar(id, look);
            setCustomizing(false);
          }}
        />
      )}
    </main>
  );
}
function AvatarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="avatar-picker" role="group" aria-label="Escolha seu avatar">
      {AVATARS.map((_, i) => (
        <button
          key={i}
          aria-label={`Avatar ${i + 1}`}
          aria-pressed={value === i}
          className={value === i ? "selected" : ""}
          onClick={() => onChange(i)}
        >
          <AvatarPortrait index={i} />
          <span>{AVATAR_PRESETS[i].name}</span>
          {value === i && <Check size={12} />}
        </button>
      ))}
    </div>
  );
}
function GarageRoom({
  name,
  initialAvatar,
  initialAppearance,
  onAvatarSaved,
  mode,
  userId,
  onLeave,
}: {
  name: string;
  initialAvatar: number;
  initialAppearance: Appearance;
  onAvatarSaved: (id: number, look: Appearance) => void;
  mode: ConnectionMode;
  userId?: string;
  onLeave: () => void;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const mobileHouse = useMobileHouse();
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'rods' | 'play' | 'people' | 'menu' | null>(null);
  const [trayTarget, setTrayTarget] = useState<HTMLDivElement | null>(null);
  const [appearance, setAppearance] = useState(initialAppearance);
  const [seat, setSeat] = useState<string>();
  const [barGate, setBarGate] = useState(false),
    [adultConfirmed, setAdultConfirmed] = useState(false);
  const [immersive, setImmersive] = useState(false);
  useEffect(() => {
    if (!immersive && !mobileHouse) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const viewport = window.visualViewport;
    const update = () =>
      document.documentElement.style.setProperty(
        "--house-screen-height",
        `${viewport?.height || window.innerHeight}px`,
      );
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersive(false);
    };
    update();
    viewport?.addEventListener("resize", update);
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      viewport?.removeEventListener("resize", update);
      window.removeEventListener("keydown", escape);
      document.documentElement.style.removeProperty("--house-screen-height");
    };
  }, [immersive, mobileHouse]);
  const [rouletteOpen, setRouletteOpen] = useState(() => new URLSearchParams(window.location.search).has('phones'));
  const [selectedPhone,setSelectedPhone]=useState<string>();
  const [ringingPhones,setRingingPhones]=useState<string[]>([]);
  const [barPosition,setBarPosition]=useState<typeof START>();
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [avatar, setAvatar] = useState(initialAvatar),
    [position, setPosition] = useState(START),
    [destination, setDestination] = useState(START),
    [room, setRoom] = useState<RoomId>("garage"),
    [arrival, setArrival] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [settings, setSettings] = useState(false),
    [list, setList] = useState(false),
    [low, setLow] = useState(false),
    [previewOpen, setPreviewOpen] = useState(false);
  const net = useGarage(name, avatar, mode, userId, appearance, seat, phoneBusy);
  const roomPlay = useRoomPlay(room, mode);
  const roomPeople = net.people.filter((p) => (p.room || "garage") === room);
  const people = roomPeople;
  const person =
    people.find((p) => p.id === selected) ||
    people.find((p) => nearby(position, p.position));
  const call = net.invite?.status === "accepted",
    incoming =
      net.invite?.status === "pending" && net.invite.to === net.identity;
  const peerId = net.invite
    ? net.invite.from === net.identity
      ? net.invite.to
      : net.invite.from
    : null;
  const peerName =
    net.people.find((p) => p.id === peerId)?.name || "seu convidado";
  const self: Person = {
    gathering: net.gathering ? { ...net.gathering, count: net.group?.members.length || 1 } : undefined,
    id: net.identity,
    name,
    avatar,
    appearance,
    seat,
    position,
    room,
    busy: call || phoneBusy,
  };
  const roomChat = useRoomChat(room, mode, self, roomPeople);
  const [lastSeenMessage, setLastSeenMessage] = useState<string>();
  const latestMessage = roomChat.messages[roomChat.messages.length - 1];
  useEffect(() => { if (mobilePanel === 'chat') setLastSeenMessage(latestMessage?.id); }, [mobilePanel, latestMessage?.id]);
  useEffect(() => { setMobilePanel(null); setLastSeenMessage(undefined); }, [room]);
  const unreadMessages = mobilePanel === 'chat' ? 0 : roomChat.messages.length - (roomChat.messages.findIndex(m => m.id === lastSeenMessage) + 1);
  const social = useSocialChat(self, roomPeople, room, mode);
  useEffect(() => {
    if (mobileHouse && (incoming || call || social.session)) setMobilePanel('people');
  }, [mobileHouse, incoming, call, social.session?.peer]);
  useEffect(() => {
    if (mobileHouse && net.knocks.some(k => !social.isBlocked(k.from))) setMobilePanel('rods');
  }, [net.knocks.length]);
  const canGather = social.preference.video && !social.session && !phoneBusy;
  useEffect(() => {
    if (!canGather && net.gathering) net.setGathering(undefined);
  }, [canGather]);
  function openGathering(spot: ConversationSpot) {
    if (net.invite?.status === 'pending' || (net.group && net.group.host !== net.identity) || social.session || !canGather || mode !== 'local') return;
    const freeSeat = HOUSE_SEATS.find(s => s.spot === spot.id && !roomPeople.some(p => p.seat === s.id));
    const point = freeSeat?.point || freeSpawn(roomPeople.map(p => p.position), spot.point, room);
    if (!point) { net.setError('Não há lugar livre aqui agora. Tente outra roda.'); return; }
    setSeat(freeSeat?.id);
    setPosition(point);
    setDestination(point);
    net.update(point, room);
    setArrival(n => n + 1);
    net.setGathering({ spot: spot.id, open: true, count: 1 });
    if (mobileHouse) setMobilePanel(null);
  }
  const gatheringPlaces = CONVERSATION_SPOTS[room].map((spot, index) => {
    const hosts = [self, ...roomPeople].filter(p => p.gathering?.spot === spot.id && !social.isBlocked(p.id));
    const own = hosts.some(p => p.id === self.id);
    const occupied = hosts.length > 0;
    const status = hosts.length > 1 ? `${hosts.length} rodas · Ver opções`
      : occupied ? `${hosts[0].gathering!.count}/4 · ${hosts[0].gathering!.count >= 4 ? 'Completa' : !hosts[0].gathering!.open ? 'Reservada' : own ? 'Sua roda' : 'Pode chegar'}`
      : '4 vagas · Começar';
    const disabled = !occupied && (!canGather || net.invite?.status === 'pending' || !!net.group?.pendingName || (!!net.group && net.group.host !== self.id));
    return { spot, index, status, occupied, disabled };
  });
  function selectGathering(spot: ConversationSpot, occupied: boolean) {
    if (mobileHouse) {
      setMobilePanel('rods');
      const details = document.querySelector<HTMLDetailsElement>('.gathering-panel details');
      if (details) details.open = true;
      requestAnimationFrame(() => document.getElementById(`gathering-${spot.id}`)?.scrollIntoView({ block: 'nearest' }));
      return;
    }
    if (!occupied) { openGathering(spot); return; }
    const details = document.querySelector<HTMLDetailsElement>('.gathering-panel details');
    if (details) details.open = true;
    const card = document.getElementById(`gathering-${spot.id}`);
    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  const gatheringHost = roomPeople.find(p => p.id === net.group?.host && p.gathering);
  useEffect(() => {
    if (!net.group || net.group.host === net.identity || !gatheringHost) return;
    const freeSeat = HOUSE_SEATS.find(s => s.spot === gatheringHost.gathering?.spot && !roomPeople.some(p => p.seat === s.id));
    const point = freeSeat?.point || freeSpawn(roomPeople.map(p => p.position), gatheringHost.position, room);
    if (!point) return;
    setSeat(freeSeat?.id);
    setPosition(point);
    setDestination(point);
    net.update(point, room);
    setArrival(n => n + 1);
  }, [net.group?.id, gatheringHost?.gathering?.spot]);
  useEffect(() => {
    if (
      incoming &&
      (!social.preference.video || social.isBlocked(peerId || ""))
    )
      void net.respond(false);
  }, [incoming, social.preference.video]);
  useEffect(() => {
    const overlap = roomPeople.some(
      (p) =>
        p.id < net.identity &&
        distance(position, p.position) < personalSpace(room),
    );
    if (!overlap || call || seat) return;
    const spawn = freeSpawn(
      roomPeople.map((p) => p.position),
      position,
      room,
    );
    if (spawn) {
      setPosition(spawn);
      setDestination(spawn);
      net.update(spawn, room);
      setArrival((n) => n + 1);
    }
  }, [net.people, room]);
  useEffect(() => {
    if (seat && seatWinner([self, ...roomPeople], seat) !== net.identity) {
      setSeat(undefined);
      net.setError(
        "Outra pessoa ocupou esse lugar. Escolha uma cadeira livre.",
      );
    }
  }, [seat, net.people]);
  function chooseSeat(id?: string) {
    if (net.invite) return;
    const target = seatsForRoom(room).find((s) => s.id === id);
    if (target && roomPeople.some((p) => p.seat === id)) return;
    setSeat(id);
    if (target) {
      setPosition(target.point);
      setDestination(target.point);
      net.update(target.point);
    }
  }
  function changeRoom(next: RoomId, confirmed = false, at?: typeof START) {
    if (next === room || net.invite || phoneBusy || social.session) return false;
    if (next === "bar" && !adultConfirmed && !confirmed) {
      setBarPosition(at);
      setBarGate(true);
      return false;
    }
    const spawn = freeSpawn(
      net.people
        .filter((p) => (p.room || "garage") === next)
        .map((p) => p.position),
      at || START,
      next,
    );
    if (!spawn) {
      net.setError("Este ambiente está cheio. Aguarde um lugar ficar livre.");
      return false;
    }
    stopPreview();
    setSelected(null);
    setSeat(undefined);
    setRoom(next);
    setPosition(spawn);
    setDestination(spawn);
    net.update(spawn, next);
    return true;
  }
  const move = (p: typeof START) => {
    if (call || seat) return;
    setPosition(p);
    net.update(p, room);
  };
  const stopPreview = () => setPreviewOpen(false);
  useEffect(() => {
    if (call) stopPreview();
  }, [call]);

  return (
    <HouseTrayContext.Provider value={mobileHouse ? trayTarget : null}>
    <main className={`garage-app${immersive ? " is-immersive" : ""}${mobileHouse ? ' is-mobile-house' : ''}`} data-mobile-panel={mobilePanel || 'none'}>
      {mobileHouse && <>
        <header className="mobile-house-header">
          <label><span className="sr-only">Escolher ambiente</span><select value={room} disabled={!!net.invite} onChange={e => changeRoom(e.target.value as RoomId)}>
            {(['garage', 'living', 'bar'] as RoomId[]).map(id => <option key={id} value={id}>{ROOMS[id].name}{id === 'bar' ? ' · 18+' : ''}</option>)}
          </select><small>{roomPeople.length + 1} {roomPeople.length ? 'pessoas' : 'pessoa'} aqui</small></label>
          {(call || social.session) && <button onClick={() => setMobilePanel('people')}>Conversa</button>}
          <button onClick={() => setMobilePanel(mobilePanel === 'menu' ? null : 'menu')} aria-label="Meu perfil e opções"><UserRound size={20} /></button>
        </header>
        {mobilePanel && <button className="mobile-sheet-close" onClick={() => setMobilePanel(null)} aria-label="Fechar painel e voltar à casa"><X size={18} /> Voltar à casa</button>}
        <div className="mobile-play-sheet" ref={setTrayTarget} onClick={e => { if ((e.target as HTMLElement).closest('button')) setMobilePanel(null); }}>
          <button className="mobile-phone-shortcut" disabled={!!net.invite || !!social.session} onClick={() => setRouletteOpen(true)}>Disque Surpresa · telefones vermelhos</button>
        </div>
        <footer className="mobile-house-dock">
          {latestMessage && mobilePanel !== 'chat' && <button className="mobile-last-message" onClick={() => setMobilePanel('chat')}><strong>{latestMessage.name}</strong> {latestMessage.text}</button>}
          <nav aria-label="Ferramentas da casa">
            <button aria-pressed={mobilePanel === 'chat'} onClick={() => setMobilePanel(mobilePanel === 'chat' ? null : 'chat')}><MessageCircle size={20} /> Chat {unreadMessages > 0 && <small>{unreadMessages}</small>}</button>
            <button aria-pressed={mobilePanel === 'rods'} onClick={() => setMobilePanel(mobilePanel === 'rods' ? null : 'rods')}><Users size={20} /> Rodas</button>
            <button aria-pressed={mobilePanel === 'play'} onClick={() => setMobilePanel(mobilePanel === 'play' ? null : 'play')}><Sparkles size={20} /> Interagir</button>
            <button aria-pressed={mobilePanel === 'people'} onClick={() => setMobilePanel(mobilePanel === 'people' ? null : 'people')}><UserRound size={20} /> Pessoas</button>
          </nav>
        </footer>
      </>}
      <button
        className="house-screen-toggle"
        onClick={() => setImmersive(!immersive)}
        aria-pressed={immersive}
      >
        {immersive ? "✕ Sair da tela cheia" : "⛶ Tela cheia"}
      </button>
      {accountOpen && (
        <AccountModal
          nickname={name}
          look={{ avatar, appearance }}
          onClose={() => setAccountOpen(false)}
          onRestore={(look) => {
            setAvatar(look.avatar);
            setAppearance(look.appearance);
            onAvatarSaved(look.avatar, look.appearance);
          }}
        />
      )}
      <header className="garage-topbar">
        <Link to="/" className="garage-brand">
          <BrandLogo />
        </Link>
        <nav aria-label="Localização">
          <span>Casa</span>
          <span>/</span>
          <strong>{ROOMS[room].name}</strong>
        </nav>
        <div className="topbar-actions">
          <button onClick={() => setAccountOpen(true)}>
            <UserRound size={17} /> Perfil e amigos
          </button>
          <button onClick={() => setSettings(!settings)}>
            <UserRound size={18} />
            Meu avatar
          </button>
          <button
            onClick={() => {
              void net.end();
              stopPreview();
              onLeave();
            }}
          >
            <DoorOpen size={18} />
            Sair da casa
          </button>
        </div>
      </header>
      <div className="garage-heading">
        <div>
          <p className="eyebrow">{ROOMS[room].label}</p>
          <h1>
            Um passo para um novo <em>oi.</em>
          </h1>
        </div>
        <span className="garage-status">
          <span className={net.connected ? "online-dot" : "offline-dot"} />
          {mode === "local" ? "Explorando a casa" : "Na casa"} ·{" "}
          {net.people.length + 1}{" "}
          {net.people.length ? "pessoas na casa" : "pessoa na casa"}
        </span>
      </div>
      <nav className="house-rooms" aria-label="Ambientes da casa">
        {(["garage", "living", "bar"] as RoomId[]).map((id) => (
          <button
            key={id}
            aria-pressed={room === id}
            disabled={!!net.invite && room !== id}
            onClick={() => changeRoom(id)}
          >
            <House size={18} />
            <span>
              {ROOMS[id].name}
              <small>
                {id === "garage"
                  ? "Música e encontros"
                  : id === "bar"
                    ? "18+ · mesas, música e encontros"
                    : "Papo leve e boas histórias"}
              </small>
            </span>
            <span className="room-count">
              {net.people.filter((p) => (p.room || "garage") === id).length +
                (room === id ? 1 : 0)}
            </span>
          </button>
        ))}
        <button
          className="surprise-menu"
          disabled={!!net.invite || !!social.session}
          onClick={() => setRouletteOpen(true)}
        >
          <Sparkles size={20} />
          <span>
            Disque Surpresa<small>Telefones · encontro 1 a 1</small>
          </span>
        </button>
        <p>
          {net.invite
            ? "Finalize o convite ou a conversa para trocar de ambiente."
            : "A casa é sua. Escolha onde quer ficar."}
        </p>
      </nav>
      <div className={`garage-layout${call ? " is-chatting" : ""}`}>
        <section className="garage-world">
          {mode === 'local' && <nav className="gathering-places" aria-label="Lugares para conversar">
            <p><Armchair size={16} /> Puxe uma cadeira <small>Escolha um cantinho para começar ou participar de uma conversa.</small></p>
            <div>{gatheringPlaces.map(({ spot, status, occupied, disabled }) =>
              <button key={spot.id} disabled={disabled} onClick={() => selectGathering(spot, occupied)}>
                <Armchair size={20} aria-hidden="true" />
                <span><strong>{spot.name}</strong><small>{status}</small></span>
              </button>
            )}</div>
          </nav>}
          <MobileHouseViewport active={false} position={position} room={`${room}-${arrival}`}>
          <GarageScene
            revision={arrival}
            onRoom={(next,point)=>changeRoom(next,false,point)}
            onSeat={chooseSeat}
            onPhone={id=>{setSelectedPhone(id);setRouletteOpen(true);}}
            ringingPhones={ringingPhones}
            onPlay={roomPlay.act}
            preferences={social.preferences}
            chatBubbles={{
              ...roomChat.bubbles,
              ...(social.session && !social.session.accepted
                ? {
                    [social.session.incoming ? social.session.peer : self.id]:
                      social.session.incoming
                        ? "Quer conversar por mensagem? Veja o convite no painel."
                        : "Convite de mensagem enviado",
                  }
                : {}),
            }}
            play={roomPlay.state}
            playControls={
              room === "bar" ? (
                <BarPlay spatial
                  self={self}
                  people={people}
                  state={roomPlay.state}
                  act={roomPlay.act}
                  onApproach={setDestination}
                  onSeat={chooseSeat}
                  frozen={!!net.invite || settings || barGate || phoneBusy || rouletteOpen || previewOpen || !!social.session}
                  connected={roomPlay.connected}
                />
              ) : (
                <RoomPlay spatial
                  key={room}
                  self={self}
                  people={people}
                  state={roomPlay.state}
                  act={roomPlay.act}
                  onApproach={setDestination}
                  frozen={!!net.invite || settings || barGate || phoneBusy || rouletteOpen || previewOpen || !!social.session}
                  connected={roomPlay.connected}
                />
              )
            }
            destination={destination}
            bubbleOwner={net.invite?.from}
            bubble={
              net.invite?.status === "pending" ? (
                <>
                  <MessageCircle size={16} />
                  <strong>Vamos conversar?</strong>
                  <small>
                    {incoming
                      ? "Câmera e microfone ficam desligados"
                      : "Aguardando um oi de volta…"}
                  </small>
                  <div className="bubble-actions">
                    {incoming ? (
                      <>
                        <button
                          onClick={() => void net.respond(true)}
                          aria-label="Aceitar convite no balão"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => void net.respond(false)}
                          aria-label="Recusar convite no balão"
                        >
                          Agora não
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => void net.end()}
                        aria-label="Cancelar convite no balão"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </>
              ) : undefined
            }
            self={self}
            people={net.people}
            onMove={move}
            onSelect={(id) => {
              if (mobileHouse) setMobilePanel('people');
              if (id === self.id) {
                const panel = document.querySelector<HTMLDetailsElement>(
                  ".social-chat details",
                );
                if (panel) {
                  panel.open = true;
                  panel.scrollIntoView({ block: "nearest" });
                }
              } else setSelected(id);
            }}
            frozen={!!net.invite || settings || barGate || phoneBusy || rouletteOpen || previewOpen || !!social.session}
            low={low}
          />
          </MobileHouseViewport>
          <footer className="world-footer">
            <span>
              <Footprints size={17} />
              {call
                ? "Sua conversa está aberta"
                : "Toque no piso para andar · experimente a vista em primeira pessoa"}
            </span>
            <button onClick={() => setList(!list)}>
              <List size={17} />
              {list ? "Ver ambiente" : "Ver pessoas em lista"}
            </button>
          </footer>
          <GatheringPanel room={room} self={self} people={roomPeople} gathering={net.gathering} group={net.group}
            knocks={net.knocks} pending={net.invite?.status === 'pending' || !!net.group?.pendingName} unavailable={mode !== 'local'}
            canVideo={!!canGather} isBlocked={social.isBlocked} onOpen={openGathering} onChange={net.setGathering}
            onKnock={p => { if (canGather && !social.isBlocked(p.id)) net.knock(p); }}
            onAnswer={(id, accept) => { if (!accept || (canGather && !social.isBlocked(id))) void net.answerKnock(id, accept); }}
            onShare={roomChat.send} />
          <div className="mobile-walk" aria-label="Controles de movimento">
            {[
              [ArrowLeft, -0.045, 0, "Andar à esquerda"],
              [ArrowUp, 0, -0.045, "Andar para cima"],
              [ArrowDown, 0, 0.045, "Andar para baixo"],
              [ArrowRight, 0.045, 0, "Andar à direita"],
            ].map(([Icon, x, y, label]) => {
              const I = Icon as typeof ArrowLeft;
              return (
                <button
                  key={String(label)}
                  aria-label={String(label)}
                  disabled={!!net.invite}
                  onClick={() => {
                    const p = {
                      x: position.x + Number(x),
                      y: position.y + Number(y),
                    };
                    if (inside(p, room)) setDestination(p);
                  }}
                >
                  <I size={20} />
                </button>
              );
            })}
          </div>
          <div className="garage-under">
            <span>
              <VideoOff size={15} /> Ao explorar, sua câmera fica desligada
            </span>
            <span>
              <MicOff size={15} /> Sua voz só entra na conversa quando você
              quiser
            </span>
          </div>
        </section>
        <aside className="garage-sidebar">
          {mobileHouse && <div className="mobile-people-picks"><h2>Pessoas neste ambiente</h2>
            {roomPeople.length ? roomPeople.map(p => <button key={p.id} onClick={() => setSelected(p.id)}>{p.name}{p.busy ? ' · em conversa' : ''}</button>) : <p>Você chegou primeiro. Explore a casa enquanto a conversa começa.</p>}
          </div>}
          <SocialChat social={social} people={roomPeople} />
          <RoomChat
            chat={roomChat}
            room={room}
            people={[self, ...roomPeople]}
            inCall={!!call}
            expanded={mobileHouse ? mobilePanel === 'chat' : undefined}
            onExpandedChange={mobileHouse ? open => setMobilePanel(open ? 'chat' : null) : undefined}
          />

          {call ? (
            mode === "local" ? (
              <LocalCall
                identity={net.identity}
                selfName={name}
                members={net.group!.members}
                people={net.people}
                group={net.group!}
                localMedia={net.localMedia}
                remoteStreams={net.remoteStreams}
                remoteFlags={net.remoteFlags}
                camera={net.camera}
                mic={net.mic}
                candidates={net.people.filter(
                  (p) =>
                    !p.busy &&
                    !net.group!.members.includes(p.id) &&
                    sameRoom(self, p) &&
                    nearby(position, p.position),
                )}
                onInvite={(p) => void net.request(p)}
                publish={net.publish}
                onEnd={() => void net.end()}
              />
            ) : net.token ? (
              <CloudCall
                token={net.token}
                peer={peerName}
                onEnd={() => void net.end()}
              />
            ) : (
              <>
                <h2>Conectando vocês…</h2>
                <button onClick={() => void net.end()}>Cancelar</button>
              </>
            )
          ) : incoming ? (
            <section
              className="invite-panel"
              role="dialog"
              aria-labelledby="invite-title"
            >
              <span className="sidebar-icon">
                <MessageCircle />
              </span>
              <p className="eyebrow">UM NOVO ENCONTRO</p>
              <h2 id="invite-title">{peerName} quer conversar.</h2>
              <p>
                Conversa com até quatro pessoas. Você decide: sua câmera e seu
                microfone continuam desligados.
              </p>
              <button
                className="garage-primary"
                onClick={() => void net.respond(true)}
              >
                Aceitar convite
                <Check />
              </button>
              <button
                className="garage-secondary"
                onClick={() => void net.respond(false)}
              >
                Agora não
              </button>
            </section>
          ) : net.invite ? (
            <section>
              <span className="sidebar-icon">
                <MessageCircle />
              </span>
              <h2>Convite enviado.</h2>
              <p>
                Aguardando {peerName} aceitar. Você ainda não está transmitindo.
              </p>
              <button
                className="garage-secondary"
                onClick={() => void net.end()}
              >
                Cancelar convite
              </button>
            </section>
          ) : (
            <section>
              <span className="sidebar-icon">
                <Users />
              </span>
              <p className="eyebrow">
                {person ? "PERTO DE VOCÊ" : "PODE CHEGAR"}
              </p>
              <h2>{person ? person.name : "A casa também é sua."}</h2>
              <p className="sidebar-subtitle">
                {person
                  ? "Um novo encontro pode começar aqui."
                  : "Explore o ambiente e personalize seu avatar. Os encontros online na casa estarão disponíveis em breve."}
              </p>
              {person && (
                <>
                  <div className="person-profile">
                    <AvatarPortrait
                      index={person.avatar}
                      appearance={person.appearance}
                    />
                    <div>
                      <strong>{person.name}</strong>
                      <small>
                        {person.busy
                          ? "Em conversa"
                          : nearby(position, person.position)
                            ? "Ao seu alcance"
                            : "Um pouco mais adiante"}
                      </small>
                    </div>
                  </div>
                  <p className="conversation-prompt">{ROOMS[room].topic}</p>
                </>
              )}
              {person && (
                <div className="social-actions">
                  {social.preferences[person.id]?.text &&
                    !social.isBlocked(person.id) && (
                      <button
                        className="garage-secondary"
                        disabled={!!social.session}
                        onClick={() => social.request(person)}
                      >
                        Mandar mensagem
                      </button>
                    )}
                  {social.preferences[person.id]?.video &&
                    !social.isBlocked(person.id) && (
                      <button
                        className="garage-primary"
                        disabled={person.busy}
                        onClick={() => void net.request(person)}
                      >
                        Convidar para vídeo
                      </button>
                    )}
                  {!social.preferences[person.id] && (
                    <p>Preferências ainda não informadas.</p>
                  )}
                </div>
              )}
              {person && (
                <p className="garage-note">
                  A conversa começa quando a outra pessoa aceitar.
                </p>
              )}
            </section>
          )}
          {net.error && (
            <div className="garage-error" role="alert">
              {net.error}
              <button
                aria-label="Fechar aviso"
                onClick={() => net.setError("")}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {!call && (
            <div className="preview-area">
              <button
                className="preview-toggle"
                onClick={() => setPreviewOpen(true)}
              >
                <Camera size={17} />
                Testar minha câmera e máscara
              </button>
              <small>
                Prévia privada, antes de aceitar ou enviar o convite.
              </small>
            </div>
          )}
        </aside>
      </div>
      {list && (
        <section className="garage-people">
          <h2>Quem está em {ROOMS[room].name.toLowerCase()}</h2>
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelected(p.id);
                setList(false);
              }}
            >
              <UserRound />
              {p.name}
              <span>
                {p.busy ? "Em conversa" : "Ver preferências"}
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </section>
      )}
      <HousePhones room={room} name={name} adult={adultConfirmed} busy={!!net.invite || !!social.session || !!net.group} target={null} open={rouletteOpen} onClose={() => {setRouletteOpen(false);setSelectedPhone(undefined);}} onBusy={setPhoneBusy} selectedPhone={selectedPhone} onRings={setRingingPhones}/>
      {barGate && (
        <div className="avatar-editor-backdrop">
          <section
            className="bar-entry-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bar-entry-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setBarGate(false);
              if (e.key === "Tab") {
                const buttons = e.currentTarget.querySelectorAll("button");
                if (e.shiftKey && document.activeElement === buttons[0]) {
                  e.preventDefault();
                  buttons[1].focus();
                } else if (
                  !e.shiftKey &&
                  document.activeElement === buttons[1]
                ) {
                  e.preventDefault();
                  buttons[0].focus();
                }
              }
            }}
          >
            <span className="eyebrow">BAR VINYL · 18+</span>
            <h2 id="bar-entry-title">Uma mesa para novos encontros.</h2>
            <p>
              Este ambiente é destinado a adultos. Confirme que você tem 18 anos
              ou mais para entrar.
            </p>
            <div>
              <button
                autoFocus
                className="garage-secondary"
                onClick={() => setBarGate(false)}
              >
                Voltar para a casa
              </button>
              <button
                className="garage-primary"
                onClick={() => {
                  setAdultConfirmed(true);
                  setBarGate(false);
                  changeRoom("bar", true, barPosition);
                }}
              >
                Tenho 18 anos ou mais
              </button>
            </div>
          </section>
        </div>
      )}
      {previewOpen && !call && (
        <CameraPreview
          avatar={avatar}
          appearance={appearance}
          onClose={stopPreview}
        />
      )}
      {settings && (
        <AvatarCustomizer
          avatar={avatar}
          appearance={appearance}
          low={low}
          onLow={setLow}
          onClose={() => setSettings(false)}
          onApply={(id, look) => {
            setAvatar(id);
            setAppearance(look);
            onAvatarSaved(id, look);
            if (!saveAvatar(id, look))
              net.setError(
                "Visual aplicado nesta visita. O navegador não permitiu guardar sua escolha.",
              );
            setSettings(false);
          }}
        />
      )}
      <footer className="garage-bottom">
        <span>
          <Sparkles size={14} /> Um lugar para encontrar pessoas, no seu ritmo.
        </span>
        <span>
          A casa é sua também.{" "}
          {import.meta.env.DEV && location.search.includes("testMedia=1")
            ? " · MÍDIA SINTÉTICA DE TESTE"
            : ""}{" "}
          <button
            onClick={() => setSettings(true)}
            aria-label="Preferências gráficas"
          >
            <Settings2 size={15} />
          </button>
        </span>
      </footer>
    </main>
    </HouseTrayContext.Provider>
  );
}
