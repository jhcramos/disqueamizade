import { useEffect, useRef, useState } from "react";
import {
  Armchair,
  Lightbulb,
  Music2,
  Wine,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { BAR_SEATS } from "./seats";
import { distance, type Person, type Point } from "./model";
import type { PlayAction, PlayState } from "./play";
type Props = {
  self: Person;
  people: Person[];
  state: PlayState;
  act: (a: PlayAction) => boolean;
  onApproach: (p: Point) => void;
  onSeat: (id?: string) => void;
  frozen: boolean;
  connected: boolean;
};
export function BarPlay({
  self,
  people,
  state,
  act,
  onApproach,
  onSeat,
  frozen,
  connected,
}: Props) {
  const [pending, setPending] = useState<string>(),
    [notice, setNotice] = useState(
      "Escolha uma cadeira, puxe um papo e fique à vontade.",
    ),
    [listening, setListening] = useState(false);
  const started = useRef(0),
    [tick, setTick] = useState(0);
  const powered = state.screen?.on === true,
    dim = state.lights?.on === false;
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(timer);
  }, []);
  const occupied = (id: string) => people.find((p) => p.seat === id);
  function sit(id: string) {
    if (frozen || !connected) return;
    if (self.seat === id) {
      onSeat();
      setNotice("De pé. O lugar ficou livre.");
      return;
    }
    if (occupied(id)) {
      setNotice("Esse lugar já está ocupado. Escolha outro.");
      return;
    }
    onSeat();
    const seat = BAR_SEATS.find((s) => s.id === id)!;
    started.current = Date.now();
    setPending(id);
    onApproach(seat.point);
    setNotice(`Chegando: ${seat.name.toLowerCase()}…`);
  }
  useEffect(() => {
    if (!pending) return;
    if (frozen || Date.now() - started.current > 15000 || occupied(pending)) {
      setPending(undefined);
      onApproach(self.position);
      setNotice("A aproximação foi interrompida. Escolha um lugar livre.");
      return;
    }
    const seat = BAR_SEATS.find((s) => s.id === pending)!;
    if (distance(self.position, seat.point) < 0.018) {
      setPending(undefined);
      onApproach(seat.point);
      onSeat(seat.id);
      setNotice(
        "À vontade! Sentar não liga sua câmera nem inicia uma chamada.",
      );
    }
  }, [self.position, pending, tick, frozen, people]);
  function action(kind: "lights" | "screen" | "perform") {
    if (frozen || !connected) return;
    const on = kind === "lights" ? dim : kind === "screen" ? !powered : true;
    if (
      act({
        id: crypto.randomUUID(),
        actor: self.id,
        name: self.name,
        at: Date.now(),
        room: "bar",
        kind,
        on,
        from: self.position,
        to: self.position,
      })
    )
      setNotice(
        kind === "lights"
          ? on
            ? "Luzes acesas."
            : "Luz baixa, clima de encontro."
          : kind === "screen"
            ? on
              ? "Jukebox ligada. Toque em Ouvir para escutar."
              : "Jukebox desligada."
            : "Um brinde aos bons encontros!",
      );
    else setNotice("Espere um instante para repetir.");
  }
  useEffect(() => {
    if (!listening || !powered || frozen) {
      setListening(false);
      return;
    }
    let context: AudioContext;
    try {
      context = new AudioContext();
      void context.resume();
    } catch {
      setListening(false);
      return;
    }
    let beat = 0;
    const play = () => {
      const osc = context.createOscillator(),
        gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = [
        130.81, 164.81, 196, 246.94, 146.83, 174.61, 220, 261.63,
      ][beat++ % 8];
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.035, context.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.4);
    };
    play();
    const timer = setInterval(play, 430);
    return () => {
      clearInterval(timer);
      void context.close();
    };
  }, [listening, powered, frozen]);
  const toast =
    state.perform && Date.now() - state.perform.at < 3500
      ? state.perform
      : undefined;
  return (
    <>
      <div className="bar-seats" aria-label="Lugares do bar">
        {BAR_SEATS.map((s) => {
          const owner = occupied(s.id),
            mine = self.seat === s.id;
          return (
            <button
              key={s.id}
              className={`bar-seat ${mine ? "is-seated" : ""}`}
              style={{ left: `${s.point.x * 100}%`, top: `${s.seatY * 100}%` }}
              disabled={frozen || !connected || !!owner}
              aria-label={`${mine ? "Levantar de" : "Sentar em"} ${s.name}${owner ? ` · ocupado por ${owner.name}` : ""}`}
              title={owner ? `${s.name} · ${owner.name}` : s.name}
              onClick={() => sit(s.id)}
            >
              <Armchair size={13} />
              <span>{mine ? "Seu lugar" : owner ? "Ocupado" : s.name}</span>
            </button>
          );
        })}
      </div>
      {powered && <div className="bar-jukebox-glow" aria-hidden="true" />}
      {toast && (
        <div
          className="bar-toast"
          role="status"
          style={{
            left: `${toast.from.x * 100}%`,
            top: `${Math.max(8, toast.from.y * 100 - 27)}%`,
          }}
        >
          🥂 {toast.name}: aos bons encontros!
        </div>
      )}
      <div
        className="play-tray bar-tray"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="play-tray-title">
          <Wine size={14} /> Bar Vinyl · 3 mesas de 4 + 3 bancos
        </span>
        <div className="play-tray-actions">
          <button
            disabled={frozen || !connected}
            onClick={() => action("lights")}
          >
            <Lightbulb size={14} />
            {dim ? "Acender luzes" : "Luz de encontro"}
          </button>
          <button
            disabled={frozen || !connected}
            onClick={() => action("screen")}
          >
            <Music2 size={14} />
            {powered ? "Desligar jukebox" : "Ligar jukebox"}
          </button>
          <button
            disabled={frozen || !connected}
            onClick={() => action("perform")}
          >
            <Wine size={14} />
            Brindar
          </button>
          {self.seat && (
            <button
              disabled={frozen}
              onClick={() => {
                onSeat();
                setNotice("Lugar liberado. Clique no piso para andar.");
              }}
            >
              <Armchair size={14} />
              Levantar
            </button>
          )}
          {powered && (
            <button disabled={frozen} onClick={() => setListening((v) => !v)}>
              {listening ? <VolumeX size={14} /> : <Volume2 size={14} />}{" "}
              {listening ? "Silenciar" : "Ouvir jukebox"}
            </button>
          )}
          <details className="bar-seat-list">
            <summary>Escolher lugar na lista</summary>
            <div>
              {BAR_SEATS.map((s) => (
                <button
                  key={s.id}
                  disabled={frozen || !connected || !!occupied(s.id)}
                  onClick={() => sit(s.id)}
                >
                  {s.name}
                  {self.seat === s.id
                    ? " · seu lugar"
                    : occupied(s.id)
                      ? " · ocupado"
                      : ""}
                </button>
              ))}
            </div>
          </details>
        </div>
        <p role="status">
          {frozen
            ? "Objetos pausados durante o convite ou a conversa."
            : notice}
          {pending && (
            <button
              onClick={() => {
                setPending(undefined);
                onApproach(self.position);
                setNotice("Aproximação cancelada.");
              }}
            >
              <X size={12} />
              Cancelar
            </button>
          )}
        </p>
      </div>
    </>
  );
}
