import { SurpriseDialog } from "./SurpriseStation";
import { useSocialChat } from "./useSocialChat";
import { SocialChat } from "./SocialChat";
import { BrandLogo } from "../components/common/BrandLogo";
import { AccountModal } from "../social/AccountPanel";
import { RoomChat } from "./RoomChat";
import { useRoomChat } from "./useRoomChat";
import { CameraPreview } from "./CameraPreview";
import { AVATAR_PRESETS, presetAppearance } from "./avatarPresets";
import { BarPlay } from "./BarPlay";
import { BAR_SEATS, seatWinner } from "./seats";
import { personalSpace } from "./model";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { readSavedAvatar, saveAvatar, type Appearance } from "./avatarStyle";
import { useEffect, useState } from "react";
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
  const [appearance, setAppearance] = useState(initialAppearance);
  const [seat, setSeat] = useState<string>();
  const [barGate, setBarGate] = useState(false),
    [adultConfirmed, setAdultConfirmed] = useState(false);
  const [rouletteOpen, setRouletteOpen] = useState(false);
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
  const net = useGarage(name, avatar, mode, userId, appearance, seat);
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
    id: net.identity,
    name,
    avatar,
    appearance,
    seat,
    position,
    room,
    busy: call,
  };
  const roomChat = useRoomChat(room, mode, self, roomPeople);
  const social = useSocialChat(self, roomPeople, room, mode);
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
  const stopPreview = () => setPreviewOpen(false);
  useEffect(() => {
    if (call) stopPreview();
  }, [call]);

  return (
    <main className="garage-app">
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
            Disque Surpresa<small>Roleta · encontro 1 a 1</small>
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
          <GarageScene
            rouletteDisabled={!!social.session}
            onRoulette={() => {
              if (!net.invite && !social.session) setRouletteOpen(true);
            }}
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
            onSelect={(id) => {
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
          <SocialChat social={social} people={roomPeople} />
          <RoomChat
            chat={roomChat}
            room={room}
            people={[self, ...roomPeople]}
            inCall={!!call}
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
      {rouletteOpen && (
        <SurpriseDialog onClose={() => setRouletteOpen(false)} />
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
  );
}
