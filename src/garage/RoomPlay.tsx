import { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  Radio,
  Tv,
  Volume2,
  VolumeX,
  Armchair,
  Hand,
  Sparkles,
  CircleDot,
} from "lucide-react";
import {
  distance,
  inside,
  PERSONAL_SPACE,
  type Person,
  type Point,
} from "./model";
import {
  BALL_START,
  CUSHION_START,
  playPosition,
  throwTarget,
  type PlayKind,
  type PlayAction,
  type PlayState,
} from "./play";
type Props = {
  self: Person;
  people: Person[];
  state: PlayState;
  act: (a: PlayAction) => boolean;
  onApproach: (p: Point) => void;
  frozen: boolean;
  connected: boolean;
};
export function RoomPlay({
  self,
  people,
  state,
  act,
  onApproach,
  frozen,
  connected,
}: Props) {
  const room = self.room || "garage",
    living = room === "living";
  const [pending, setPending] = useState<PlayKind | null>(null),
    [notice, setNotice] = useState(""),
    [listening, setListening] = useState(false),
    [tick, setTick] = useState(0);
  const pendingAt = useRef(0),
    audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 150);
    return () => clearInterval(timer);
  }, []);
  const ball = playPosition(state.ball, BALL_START),
    cushion = playPosition(state.cushion, CUSHION_START);
  const holder = state.cushion?.on
    ? [self, ...people].find((p) => p.id === state.cushion?.actor)
    : undefined;
  const ownCushion = holder?.id === self.id;
  const powered = state.screen?.on === true,
    dim = state.lights?.on === false;
  function anchor(kind: PlayKind): Point {
    if (kind === "ball") return ball;
    if (kind === "cushion")
      return ownCushion ? self.position : holder?.position || cushion;
    if (kind === "lights") return { x: 0.66, y: 0.4 };
    if (kind === "perform")
      return living ? { x: 0.65, y: 0.52 } : { x: 0.57, y: 0.56 };
    return living ? { x: 0.45, y: 0.45 } : { x: 0.44, y: 0.43 };
  }
  function reach(kind: PlayKind) {
    return kind === "ball" || kind === "cushion" ? 0.11 : 0.17;
  }
  function execute(kind: PlayKind) {
    if (frozen || !connected) return;
    if (kind === "cushion" && holder && !ownCushion) {
      setNotice(
        `${holder.name} está com a almofada. Espere ela voltar ao chão.`,
      );
      return;
    }
    if (
      kind === "lights" &&
      state.lights &&
      Date.now() - state.lights.at < 1200
    ) {
      setNotice("Espere um instante antes de mudar a luz.");
      return;
    }
    if (
      kind === "perform" &&
      state.perform &&
      Date.now() - state.perform.at < 2800
    ) {
      setNotice("Espere a brincadeira terminar para entrar.");
      return;
    }
    const from =
      kind === "ball"
        ? ball
        : kind === "cushion"
          ? ownCushion
            ? self.position
            : cushion
          : self.position;
    const to =
      kind === "ball" || (kind === "cushion" && ownCushion)
        ? throwTarget(from, self.position, room)
        : from;
    const on =
      kind === "lights"
        ? dim
        : kind === "screen"
          ? !powered
          : kind === "cushion"
            ? !ownCushion
            : true;
    if (
      act({
        id: crypto.randomUUID(),
        actor: self.id,
        name: self.name,
        at: Date.now(),
        room,
        kind,
        on,
        from,
        to,
      })
    ) {
      setNotice(
        kind === "ball"
          ? "Boa! Quem devolve a bola?"
          : kind === "cushion"
            ? ownCushion
              ? "Almofada no ar!"
              : "Pegou! Clique de novo para jogar."
            : kind === "lights"
              ? on
                ? "A casa acendeu."
                : "Luz baixa, conversa boa."
              : kind === "screen"
                ? on
                  ? living
                    ? "Canal Amizade está no ar."
                    : "Som ligado. Escolha Ouvir para escutar o ritmo."
                  : "Desligado."
                : living
                  ? "Um pulo e de volta ao papo!"
                  : "Solta o passinho!",
      );
    } else setNotice("Espere um instante antes de brincar de novo.");
  }
  function request(kind: PlayKind) {
    if (frozen) return;
    setPending(null);
    if (kind === "cushion" && holder && !ownCushion) {
      execute(kind);
      return;
    }
    const goal = anchor(kind);
    if (distance(self.position, goal) < reach(kind)) {
      onApproach(self.position);
      execute(kind);
      return;
    }
    const candidates = Array.from({ length: 16 }, (_, i) => ({
      x: goal.x + Math.cos((i * Math.PI) / 8) * 0.075,
      y: goal.y + (Math.sin((i * Math.PI) / 8) * 0.075) / 0.8,
    })).filter(
      (p) =>
        inside(p, room) &&
        people.every((other) => distance(p, other.position) > PERSONAL_SPACE),
    );
    const next = candidates.sort(
      (a, b) => distance(a, self.position) - distance(b, self.position),
    )[0];
    if (!next) {
      setNotice(
        "Está um pouco cheio perto desse objeto. Tente novamente daqui a pouco.",
      );
      return;
    }
    pendingAt.current = Date.now();
    setPending(kind);
    onApproach(next);
    setNotice("Chegando perto para brincar…");
  }
  useEffect(() => {
    if (!pending) return;
    if (frozen || Date.now() - pendingAt.current > 10000) {
      setPending(null);
      setNotice("Escolha o objeto para tentar novamente.");
      return;
    }
    if (distance(self.position, anchor(pending)) < reach(pending)) {
      const kind = pending;
      setPending(null);
      onApproach(self.position);
      execute(kind);
    }
  }, [self.position, pending, frozen, tick]);
  useEffect(() => {
    if (!listening || !powered || frozen) {
      setListening(false);
      return;
    }
    let context: AudioContext;
    try {
      context = new AudioContext();
      audio.current = context;
      void context.resume();
    } catch {
      setListening(false);
      setNotice("Não foi possível abrir o áudio neste navegador.");
      return;
    }
    let beat = 0;
    const play = () => {
      if (context.state === "closed") return;
      const osc = context.createOscillator(),
        gain = context.createGain();
      osc.type = "triangle";
      osc.frequency.value = [
        130.81, 164.81, 196, 164.81, 146.83, 174.61, 220, 174.61,
      ][beat++ % 8];
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.24);
    };
    play();
    const timer = setInterval(play, 300);
    return () => {
      clearInterval(timer);
      void context.close();
      audio.current = null;
    };
  }, [listening, powered, frozen]);
  const actions: [PlayKind, string, typeof Lightbulb, Point][] = [
    [
      "lights",
      dim ? "Acender luzes" : "Apagar luzes",
      Lightbulb,
      living ? { x: 0.705, y: 0.2 } : { x: 0.72, y: 0.245 },
    ],
    [
      "screen",
      powered
        ? living
          ? "Desligar TV"
          : "Desligar som"
        : living
          ? "Ligar TV"
          : "Ligar som",
      living ? Tv : Radio,
      living ? { x: 0.355, y: 0.28 } : { x: 0.37, y: 0.29 },
    ],
    ["ball", "Chutar bola", CircleDot, ball],
    [
      "cushion",
      ownCushion ? "Jogar almofada" : "Pegar almofada",
      Hand,
      holder
        ? { x: holder.position.x + 0.045, y: holder.position.y - 0.09 }
        : cushion,
    ],
    [
      "perform",
      living ? "Pular no sofá" : "Dançar",
      living ? Armchair : Sparkles,
      living ? { x: 0.76, y: 0.43 } : { x: 0.56, y: 0.43 },
    ],
  ];
  return (
    <>
      <div className="play-hotspots" aria-label="Objetos interativos">
        {actions.map(([kind, label, Icon, p]) => (
          <button
            key={kind}
            title={label}
            aria-label={label}
            disabled={frozen || !connected}
            onClick={() => request(kind)}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            className={`play-hotspot play-${kind}`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {living && powered && (
        <div className="room-tv-screen" aria-hidden="true">
          <span>
            CANAL
            <br />
            AMIZADE
          </span>
        </div>
      )}
      {!living && powered && (
        <div className="stereo-on" aria-hidden="true">
          ● ● ●
        </div>
      )}
      <div className="play-tray" onPointerDown={(e) => e.stopPropagation()}>
        <span className="play-tray-title">
          <Sparkles size={14} /> A casa tem brincadeira
        </span>
        <div className="play-tray-actions">
          {actions.map(([kind, label, Icon]) => (
            <button
              key={kind}
              disabled={frozen || !connected}
              onClick={() => request(kind)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          {powered && (
            <button onClick={() => setListening((v) => !v)} disabled={frozen}>
              {listening ? <VolumeX size={14} /> : <Volume2 size={14} />}{" "}
              {listening ? "Silenciar" : "Ouvir ritmo"}
            </button>
          )}
        </div>
        <p role="status">
          {frozen
            ? "As brincadeiras pausam durante o convite ou a conversa."
            : notice ||
              "Toque em um objeto. Seu avatar chega perto para brincar."}
          {pending && (
            <button
              onClick={() => {
                setPending(null);
                setNotice("Aproximação cancelada.");
                onApproach(self.position);
              }}
            >
              Cancelar
            </button>
          )}
        </p>
      </div>
    </>
  );
}
