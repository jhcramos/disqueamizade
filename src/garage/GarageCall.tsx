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
  peer,
  remote,
  publish,
  onEnd,
}: {
  peer: string;
  remote: MediaStream | null;
  publish: (
    kind: "audio" | "video",
    enabled: boolean,
  ) => Promise<MediaStream | null>;
  onEnd: () => void;
}) {
  const [remoteVisible, setRemoteVisible] = useState(false);
  useEffect(() => {
    const tracks = remote?.getVideoTracks() || [];
    const check = () =>
      setRemoteVisible(tracks.some((t) => !t.muted && t.readyState === "live"));
    check();
    for (const t of tracks) {
      t.addEventListener("mute", check);
      t.addEventListener("unmute", check);
      t.addEventListener("ended", check);
    }
    return () => {
      for (const t of tracks) {
        t.removeEventListener("mute", check);
        t.removeEventListener("unmute", check);
        t.removeEventListener("ended", check);
      }
    };
  }, [remote]);
  const [stream, setStream] = useState<MediaStream | null>(null),
    [camera, setCamera] = useState(false),
    [mic, setMic] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const toggle = async (kind: "audio" | "video") => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const enabled = kind === "video" ? !camera : !mic;
      const s = await publish(kind, enabled);
      setStream(s ? new MediaStream(s.getTracks()) : null);
      if (kind === "video") setCamera(enabled);
      else setMic(enabled);
    } catch {
      setError(
        "Não foi possível acessar o dispositivo. Confira a permissão de câmera ou microfone do navegador.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="garage-call" aria-label="Conversa privada">
      <p className="eyebrow">CONVERSA PRIVADA</p>
      <h2>Você e {peer}</h2>
      <div className="call-video">
        <StreamVideo stream={remote} />
        {!remoteVisible && (
          <span>
            <VideoOff />
            Aguardando a câmera de {peer}
          </span>
        )}
        <small>{peer}</small>
      </div>
      <div className="call-video self-video">
        {camera ? (
          <StreamVideo stream={stream} muted />
        ) : (
          <span>
            <VideoOff />
            Sua câmera está desligada
          </span>
        )}
        <small>Você</small>
      </div>
      {error && (
        <p role="alert" className="garage-error">
          {error}
        </p>
      )}
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
      <button className="garage-primary" onClick={onEnd}>
        <PhoneOff />
        Sair da conversa
      </button>
      <p className="garage-note">
        Vídeo real, transmitido somente após você ligar a câmera.
      </p>
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
