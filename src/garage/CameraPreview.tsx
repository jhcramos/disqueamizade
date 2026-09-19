import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { StreamVideo } from "./GarageCall";
import { acquireGarageMedia } from "./media";
import { readCameraMaskChoice, saveCameraMaskChoice } from "./cameraPreference";
import type { Appearance } from "./avatarStyle";
export function CameraPreview({
  avatar,
  appearance,
  onClose,
}: {
  avatar: number;
  appearance: Appearance;
  onClose: () => void;
}) {
  const [masked, setMasked] = useState(readCameraMaskChoice),
    [stream, setStream] = useState<MediaStream | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0),
    resources = useRef(new Set<MediaStream>()),
    root = useRef<HTMLElement>(null);
  const stop = () => {
    generation.current++;
    resources.current.forEach((s) =>
      s.getTracks().forEach((t) => {
        if (t.readyState === "live") t.stop();
      }),
    );
    resources.current.clear();
  };
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    window.addEventListener("pagehide", stop);
    return () => {
      window.removeEventListener("pagehide", stop);
      stop();
      before?.focus();
    };
  }, []);
  async function start(mask: boolean) {
    stop();
    setStream(null);
    setBusy(true);
    setError("");
    const token = generation.current;
    try {
      const raw = await acquireGarageMedia("video");
      if (token !== generation.current) {
        raw.getTracks().forEach((t) => t.stop());
        return;
      }
      resources.current.add(raw);
      let output = raw;
      if (mask) {
        const { createAvatarCameraStream } = await import("./avatarCamera");
        if (token !== generation.current) return;
        output = await createAvatarCameraStream(raw, avatar, appearance);
      }
      if (token !== generation.current) {
        output.getTracks().forEach((t) => t.stop());
        return;
      }
      resources.current.add(output);
      setStream(output);
    } catch {
      if (token === generation.current) {
        stop();
        setError(
          "Não foi possível abrir a prévia. Confira a permissão da câmera e tente novamente.",
        );
      }
    } finally {
      if (token === generation.current || !resources.current.size)
        setBusy(false);
    }
  }
  function choose(value: boolean) {
    setMasked(value);
    if (stream) void start(value);
  }
  return (
    <div className="avatar-editor-backdrop">
      <section
        ref={root}
        className="garage-settings helmet-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby="helmet-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            stop();
            onClose();
          }
          if (e.key === "Tab") {
            const items = [
              ...root.current!.querySelectorAll<HTMLButtonElement>("button"),
            ].filter((b) => !b.disabled);
            const first = items[0],
              last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <div>
            <p className="eyebrow">PRÉVIA PRIVADA · NINGUÉM ESTÁ ASSISTINDO</p>
            <h2 id="helmet-title">Confira antes de conversar.</h2>
          </div>
          <button
            aria-label="Fechar prévia privada"
            onClick={() => {
              stop();
              onClose();
            }}
          >
            <X />
          </button>
        </header>
        <div className="call-video helmet-preview-video">
          {stream ? (
            <StreamVideo stream={stream} muted />
          ) : (
            <span>
              <Camera />
              {busy
                ? "Preparando sua prévia…"
                : "Sua câmera ainda está desligada"}
            </span>
          )}
        </div>
        <div className="avatar-collections" aria-label="Modo da câmera">
          <button
            disabled={busy}
            aria-pressed={masked}
            onClick={() => choose(true)}
          >
            Capacete do avatar
          </button>
          <button
            disabled={busy}
            aria-pressed={!masked}
            onClick={() => choose(false)}
          >
            Rosto real
          </button>
        </div>
        <p>
          {masked
            ? "Seu corpo e o ambiente aparecem. O capacete cobre o rosto; se ele sair do enquadramento, a imagem será bloqueada."
            : "Sem máscara: seu rosto real aparecerá quando você ligar a câmera na conversa."}
        </p>
        <p className="garage-note">
          Vire devagar a cabeça, pisque e abra a boca para conferir o encaixe. A
          máscara não garante anonimato: voz, corpo e ambiente também podem
          identificar você.
        </p>
        {error && (
          <p className="garage-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          {!stream ? (
            <button
              className="garage-primary"
              disabled={busy}
              onClick={() => void start(masked)}
            >
              {busy ? "Preparando…" : "Ativar prévia privada"}
            </button>
          ) : (
            <button
              className="garage-secondary"
              onClick={() => {
                stop();
                setStream(null);
              }}
            >
              Desligar prévia
            </button>
          )}
          <button
            className="garage-primary"
            disabled={!stream || busy}
            onClick={() => {
              saveCameraMaskChoice(masked);
              stop();
              onClose();
            }}
          >
            Usar esta escolha
          </button>
        </footer>
        <small>
          Sair da prévia desliga a câmera. Ela não será ligada automaticamente
          ao entrar na conversa.
        </small>
      </section>
    </div>
  );
}
