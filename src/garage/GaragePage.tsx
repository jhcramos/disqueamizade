import { BarPlay } from "./BarPlay";
import { BAR_SEATS, seatWinner } from "./seats";
import { personalSpace } from "./model";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { readSavedAvatar, saveAvatar, type Appearance } from "./avatarStyle";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
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
import { GarageScene } from "./GarageScene";
import {
  AVATARS,
  DEMO,
  ROOMS,
  freeSpawn,
  distance,
  approachRadius,
  inside,
  nearby,
  START,
  type RoomId,
  type Person,
} from "./model";
import { useGarage, type ConnectionMode } from "./useGarage";
import { CloudCall, LocalCall, StreamVideo } from "./GarageCall";
import "./garage.css";
import { useAgeVerification } from "@/components/common/AgeVerificationModal";
import { acquireGarageMedia } from "./media";
import { RoomPlay } from "./RoomPlay";
import { useRoomPlay } from "./useRoomPlay";
import { AvatarPortrait } from "./AvatarPortrait";

export default function GaragePage() {
  const [saved] = useState(readSavedAvatar);
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
        "Não foi possível iniciar sua sessão. Você pode experimentar a visita local.",
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
          <House />
          <span>
            disque
            <br />
            amizade
          </span>
        </Link>
        <span className="garage-tag">LAB / PRIMEIRA VISITA</span>
        <Link to="/rooms">
          Voltar às salas <ArrowRight size={16} />
        </Link>
      </header>
      <div className="entry-layout">
        <section className="entry-picture">
          <img
            src="/garage/garage-background.webp"
            alt="Uma garagem brasileira com luzes de festa e som dos anos 80"
          />
          <div className="entry-story">
            <span className="eyebrow">A CASA ESTÁ ABERTA</span>
            <h1>
              Chegue como você é.
              <br />
              <em>Encontre sua turma.</em>
            </h1>
            <p>
              Escolha um avatar, entre na garagem e deixe a conversa acontecer.
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
            Escolha seu avatar <span>Você pode trocar depois</span>
          </p>
          <AvatarPicker value={avatar} onChange={setAvatar} />
          <button
            className="garage-secondary entry-customize"
            onClick={() => setCustomizing(true)}
          >
            <Settings2 size={16} />
            Personalizar este avatar
          </button>
          <label className="mode-option">
            <input
              type="radio"
              name="mode"
              checked={mode === "local"}
              onChange={() => setMode("local")}
            />
            <span>
              Visita local
              <small>Explore e teste com outra aba deste navegador.</small>
            </span>
          </label>
          <label className={`mode-option ${!configured ? "unavailable" : ""}`}>
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
          {entryError && <p role="alert">{entryError}</p>}
          <button
            className="garage-primary"
            disabled={!name.trim() || busy}
            onClick={() =>
              mode === "online" ? verifyAge(() => void enter()) : void enter()
            }
          >
            {busy ? "Entrando…" : "Entrar na garagem"}
            <ArrowRight />
          </button>
          <p className="garage-note">
            <VideoOff size={15} /> Câmera e microfone começam desligados.
          </p>
          <p className="prototype-note">
            Protótipo: cenário pré-renderizado e avatares 3D de teste. As
            chamadas mostram vídeo real.
          </p>
        </section>
      </div>
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
          <span>{String(i + 1).padStart(2, "0")}</span>
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
  const [appearance, setAppearance] = useState(initialAppearance);
  const [seat, setSeat] = useState<string>();
  const [barGate, setBarGate] = useState(false),
    [adultConfirmed, setAdultConfirmed] = useState(false);
  const [avatar, setAvatar] = useState(initialAvatar),
    [position, setPosition] = useState(START),
    [destination, setDestination] = useState(START),
    [room, setRoom] = useState<RoomId>("garage"),
    [arrival, setArrival] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [settings, setSettings] = useState(false),
    [list, setList] = useState(false),
    [low, setLow] = useState(false),
    [preview, setPreview] = useState<MediaStream | null>(null),
    [previewBusy, setPreviewBusy] = useState(false);
  const previewRef = useRef<MediaStream | null>(null),
    mounted = useRef(true);
  const net = useGarage(name, avatar, mode, userId, appearance, seat);
  const roomPlay = useRoomPlay(room, mode);
  const guide = mode === "local" && net.people.length === 0;
  const roomPeople = net.people.filter((p) => (p.room || "garage") === room);
  const people = guide
    ? [
        {
          ...DEMO,
          room,
          ...(room === "bar" ? { position: { x: 0.55, y: 0.55 } } : {}),
        },
      ]
    : roomPeople;
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
    id: net.identity,
    name,
    avatar,
    appearance,
    seat,
    position,
    room,
    busy: call,
  };
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
    const target = BAR_SEATS.find((s) => s.id === id);
    if (target && roomPeople.some((p) => p.seat === id)) return;
    setSeat(id);
    if (target) {
      setPosition(target.point);
      setDestination(target.point);
      net.update(target.point);
    }
  }
  function changeRoom(next: RoomId, confirmed = false) {
    if (next === room || net.invite) return;
    if (next === "bar" && !adultConfirmed && !confirmed) {
      setBarGate(true);
      return;
    }
    const spawn = freeSpawn(
      net.people
        .filter((p) => (p.room || "garage") === next)
        .map((p) => p.position),
      START,
      next,
    );
    if (!spawn) {
      net.setError("Este ambiente está cheio. Aguarde um lugar ficar livre.");
      return;
    }
    stopPreview();
    setSelected(null);
    setSeat(undefined);
    setRoom(next);
    setPosition(spawn);
    setDestination(spawn);
    net.update(spawn, next);
  }
  const move = (p: typeof START) => {
    if (call || seat) return;
    setPosition(p);
    net.update(p, room);
  };
  const stopPreview = () => {
    previewRef.current?.getTracks().forEach((t) => t.stop());
    previewRef.current = null;
    setPreview(null);
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      previewRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    if (call) stopPreview();
  }, [call]);
  async function cameraPreview() {
    if (preview) {
      stopPreview();
      return;
    }
    setPreviewBusy(true);
    net.setError("");
    try {
      const stream = await acquireGarageMedia("video");
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      previewRef.current = stream;
      setPreview(stream);
    } catch {
      net.setError(
        "A câmera não foi liberada. Confira as permissões do navegador.",
      );
    } finally {
      setPreviewBusy(false);
    }
  }
  function approach(p: Person) {
    setSelected(p.id);
    const candidates = Array.from({ length: 16 }, (_, i) => ({
      x: p.position.x + Math.cos((i * Math.PI) / 8) * approachRadius(room),
      y:
        p.position.y +
        (Math.sin((i * Math.PI) / 8) * approachRadius(room)) / 0.8,
    })).filter(
      (point) =>
        inside(point, room) &&
        people.every(
          (other) => distance(point, other.position) >= personalSpace(room),
        ),
    );
    const next = candidates.sort(
      (a, b) => distance(position, a) - distance(position, b),
    )[0];
    if (next) setDestination(next);
    else
      net.setError(
        "Não há espaço perto dessa pessoa agora. Tente outro lado do ambiente.",
      );
  }
  return (
    <main className="garage-app">
      <header className="garage-topbar">
        <Link to="/" className="garage-brand">
          <House />
          <span>
            disque
            <br />
            amizade
          </span>
        </Link>
        <nav aria-label="Localização">
          <span>Casa</span>
          <span>/</span>
          <strong>{ROOMS[room].name}</strong>
        </nav>
        <div className="topbar-actions">
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
          {mode === "local" ? "Visita local" : "Garagem experimental"} ·{" "}
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
        <p>
          {net.invite
            ? "Finalize o convite ou a conversa para trocar de ambiente."
            : "A casa é sua. Escolha onde quer ficar."}
        </p>
      </nav>
      <div className="garage-layout">
        <section className="garage-world">
          <GarageScene
            play={roomPlay.state}
            playControls={
              room === "bar" ? (
                <BarPlay
                  self={self}
                  people={people}
                  state={roomPlay.state}
                  act={roomPlay.act}
                  onApproach={setDestination}
                  onSeat={chooseSeat}
                  frozen={!!net.invite || settings || barGate}
                  connected={roomPlay.connected}
                />
              ) : (
                <RoomPlay
                  key={room}
                  self={self}
                  people={people}
                  state={roomPlay.state}
                  act={roomPlay.act}
                  onApproach={setDestination}
                  frozen={!!net.invite || settings || barGate}
                  connected={roomPlay.connected}
                />
              )
            }
            key={`${room}-${arrival}`}
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
            people={people}
            onMove={move}
            onSelect={(id) => setSelected(id)}
            frozen={!!net.invite || settings || barGate}
            low={low}
          />
          <footer className="world-footer">
            <span>
              <Footprints size={17} />
              {call
                ? "Sua conversa está aberta"
                : "Clique no piso ou use as setas para andar"}
            </span>
            <button onClick={() => setList(!list)}>
              <List size={17} />
              {list ? "Ver ambiente" : "Ver pessoas em lista"}
            </button>
          </footer>
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
          {call ? (
            mode === "local" ? (
              <LocalCall
                peer={peerName}
                remote={net.remoteStream}
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
                Você decide. Sua câmera e seu microfone continuam desligados.
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
                {guide
                  ? "Avatar de demonstração · não é uma pessoa online"
                  : person
                    ? "Um novo encontro pode começar aqui."
                    : "Convide alguém para conhecer este ambiente com você."}
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
                        {guide
                          ? "Guia da visita local"
                          : person.busy
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
              {guide ? (
                <>
                  <button
                    className="garage-primary"
                    onClick={() => approach(DEMO)}
                  >
                    Chegar perto da Bia
                    <Footprints />
                  </button>
                  <div className="local-help">
                    <strong>Vamos testar com alguém real?</strong>
                    <p>
                      Abra uma segunda aba neste navegador, escolha outro nome e
                      aproxime os avatares. O convite e a webcam funcionam entre
                      as abas.
                    </p>
                    <a
                      className="garage-secondary"
                      href="/garagem"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir segunda aba
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </>
              ) : person ? (
                <button
                  className="garage-primary"
                  disabled={person.busy}
                  onClick={() =>
                    nearby(position, person.position)
                      ? void net.request(person)
                      : approach(person)
                  }
                >
                  {person.busy
                    ? "Em conversa"
                    : nearby(position, person.position)
                      ? "Pedir para conversar"
                      : "Aproximar meu avatar"}
                  <MessageCircle />
                </button>
              ) : (
                <a
                  className="garage-primary"
                  href="/garagem"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir outra visita
                  <ArrowRight />
                </a>
              )}
              {!guide && (
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
              {preview && (
                <div className="call-video">
                  <StreamVideo stream={preview} muted />
                  <small>Prévia privada · não transmitida</small>
                </div>
              )}
              <button
                className="preview-toggle"
                disabled={previewBusy}
                onClick={() => void cameraPreview()}
              >
                <Camera size={17} />
                {preview
                  ? "Fechar minha prévia"
                  : previewBusy
                    ? "Abrindo câmera…"
                    : "Testar minha câmera"}
              </button>
              <small>Só você vê esta prévia.</small>
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
                approach(p);
                setList(false);
              }}
            >
              <UserRound />
              {p.name}
              <span>
                {p.id === DEMO.id
                  ? "Demonstração"
                  : p.busy
                    ? "Em conversa"
                    : "Aproximar"}
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </section>
      )}
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
                  changeRoom("bar", true);
                }}
              >
                Tenho 18 anos ou mais
              </button>
            </div>
          </section>
        </div>
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
          Protótipo · cenário fixo + avatares 3D{" "}
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
  );
}
