import { readCameraMaskChoice, saveCameraMaskChoice } from "./cameraPreference";
import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Camera, Mic, MicOff, PhoneOff, VideoOff } from "lucide-react";
import { LIVEKIT_URL } from "@/rooms/livekit";

export function StreamVideo({
  stream,
  muted = false,
}: {
  stream: MediaStream | null;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (v) {
      v.srcObject = stream;
      void v.play().catch(() => {});
    }
    return () => {
      if (v) v.srcObject = null;
    };
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} />;
}
export function LocalCall({
  identity,
  selfName,
  members,
  people,
  group,
  localMedia,
  remoteStreams,
  remoteFlags,
  camera,
  mic,
  publish,
  onEnd,
  onInvite,
  candidates,
}: {
  identity: string;
  selfName: string;
  members: string[];
  people: { id: string; name: string }[];
  group: import("./useLocalGroup").GroupView;
  localMedia: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  remoteFlags: Record<string, { video: boolean; audio: boolean }>;
  camera: boolean;
  mic: boolean;
  publish: (
    kind: "audio" | "video",
    enabled: boolean,
    avatarMask?: boolean,
    expectedGroup?: { id: string; revision: number },
  ) => Promise<MediaStream | null>;
  onEnd: () => void;
  onInvite: (person: import("./model").Person) => void;
  candidates: import("./model").Person[];
}) {
  const [avatarMask, setAvatarMask] = useState(readCameraMaskChoice);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function toggle(kind: "audio" | "video") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await publish(kind, kind === "video" ? !camera : !mic, avatarMask, group);
    } catch {
      setError(
        "Não foi possível ligar o dispositivo. Confira a permissão e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function changeMask(next: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (camera) await publish("video", false, avatarMask, group);
      setAvatarMask(next);
      saveCameraMaskChoice(next);
      if (camera) await publish("video", true, next, group);
    } catch {
      setError(
        "A câmera foi pausada. Tente ligá-la novamente com a escolha desejada.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="garage-call" aria-label="Conversa em grupo">
      <p className="eyebrow">VÍDEO REAL · ATÉ 4 PESSOAS</p>
      <h2>
        Nossa roda <small>{members.length}/4</small>
      </h2>
      <p className="garage-note" role="status">
        {group.notice}
      </p>
      <div className="group-video-grid">
        {[identity, ...members.filter((id) => id !== identity)].map((id) => {
          const self = id === identity,
            name = self
              ? `${selfName} · você`
              : people.find((p) => p.id === id)?.name || "Visita";
          const visible = self ? camera : remoteFlags[id]?.video;
          return (
            <div
              className="call-video group-video"
              key={id}
              data-participant={name}
            >
              <StreamVideo
                stream={self ? localMedia : remoteStreams[id] || null}
                muted={self}
              />
              {!visible && (
                <span>
                  <VideoOff size={22} />
                  Câmera desligada
                </span>
              )}
              <small>
                {name}{" "}
                {(self ? mic : remoteFlags[id]?.audio) ? "" : "· mic off"}
              </small>
            </div>
          );
        })}
        {Array.from({ length: 4 - members.length }, (_, i) => (
          <div className="group-empty" key={`empty-${i}`}>
            <Camera size={22} />
            <span>Lugar livre</span>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="garage-error">
          {error}
        </p>
      )}
      <div className="garage-note" style={{ margin: "14px 0" }}>
        <p>
          {avatarMask
            ? "Capacete do avatar selecionado"
            : "Sem máscara · seu rosto real será mostrado"}
        </p>
        <button
          className="garage-secondary"
          disabled={busy}
          onClick={() => void changeMask(!avatarMask)}
        >
          {avatarMask ? "Mostrar meu rosto" : "Colocar capacete do avatar"}
        </button>
      </div>
      <div className="call-controls">
        <button disabled={busy} onClick={() => void toggle("video")}>
          {camera ? <Camera /> : <VideoOff />}
          {camera ? "Desligar câmera" : "Ligar câmera"}
        </button>
        <button disabled={busy} onClick={() => void toggle("audio")}>
          {mic ? <Mic /> : <MicOff />}
          {mic ? "Desligar microfone" : "Ligar microfone"}
        </button>
      </div>
      {group.host === identity && (
        <div className="group-invitations">
          {members.length === 4 ? (
            <p>Roda completa · quatro pessoas.</p>
          ) : group.pendingName ? (
            <p role="status">Aguardando {group.pendingName} aceitar…</p>
          ) : (
            <>
              <p>
                Convide quem está perto · {4 - members.length}{" "}
                {members.length === 3 ? "lugar livre" : "lugares livres"}
              </p>
              {candidates.map((person) => (
                <button
                  className="garage-secondary"
                  key={person.id}
                  onClick={() => onInvite(person)}
                >
                  Convidar {person.name}
                </button>
              ))}
              {!candidates.length && (
                <small>
                  Uma visita precisa se aproximar para receber o convite.
                </small>
              )}
            </>
          )}
        </div>
      )}
      {group.host !== identity && members.length < 4 && (
        <p className="garage-note">
          Quem iniciou pode convidar outras pessoas próximas.
        </p>
      )}
      <button className="garage-primary" onClick={onEnd}>
        <PhoneOff />
        Sair da conversa
      </button>
      {group.host === identity && (
        <p className="garage-note">
          Ao sair, você encerra esta roda para todos.
        </p>
      )}
    </section>
  );
}
function CloudCallInner({ peer, onEnd }: { peer: string; onEnd: () => void }) {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } =
      useLocalParticipant(),
    tracks = useTracks([Track.Source.Camera]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function toggle(kind: "video" | "audio") {
    if (kind === "video" && !isCameraEnabled && readCameraMaskChoice()) {
      setError(
        "O capacete na garagem está disponível na visita local. Não ligamos seu vídeo sem a máscara escolhida.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (kind === "video")
        await localParticipant.setCameraEnabled(!isCameraEnabled, {
          resolution: { width: 640, height: 360 },
        });
      else await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      setError(
        "Não foi possível acessar o dispositivo. Confira as permissões do navegador.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="garage-call">
      <p className="eyebrow">CONVERSA PRIVADA</p>
      <h2>Você e {peer}</h2>
      <RoomAudioRenderer />
      {tracks.map((t) => (
        <div className="call-video" key={t.participant.identity}>
          <VideoTrack trackRef={t} />
          <small>{t.participant.isLocal ? "Você" : peer}</small>
        </div>
      ))}
      {!tracks.length && (
        <div className="call-video">
          <span>
            <VideoOff />
            As câmeras estão desligadas
          </span>
        </div>
      )}
      {error && (
        <p role="alert" className="garage-error">
          {error}
        </p>
      )}
      <div className="call-controls">
        <button disabled={busy} onClick={() => void toggle("video")}>
          <Camera />
          {isCameraEnabled ? "Desligar câmera" : "Ligar câmera"}
        </button>
        <button disabled={busy} onClick={() => void toggle("audio")}>
          <Mic />
          {isMicrophoneEnabled ? "Desligar microfone" : "Ligar microfone"}
        </button>
      </div>
      <button className="garage-primary" onClick={onEnd}>
        <PhoneOff />
        Sair da conversa
      </button>
    </section>
  );
}
export function CloudCall({
  token,
  peer,
  onEnd,
}: {
  token: string;
  peer: string;
  onEnd: () => void;
}) {
  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={token}
      audio={false}
      video={false}
      connect
      options={{ adaptiveStream: true, dynacast: true }}
      onDisconnected={onEnd}
    >
      <CloudCallInner peer={peer} onEnd={onEnd} />
    </LiveKitRoom>
  );
}
