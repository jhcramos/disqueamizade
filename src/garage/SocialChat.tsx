import { useState } from "react";
import { ORIENTATIONS, type useSocialChat } from "./useSocialChat";
import type { Person } from "./model";
export function SocialChat({
  social,
  people,
}: {
  social: ReturnType<typeof useSocialChat>;
  people: Person[];
}) {
  const [orientation, setOrientation] = useState("");
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState("");
  const s = social.session;
  const name = people.find((p) => p.id === s?.peer)?.name || "Visitante";
  return (
    <div className="social-chat">
      <details>
        <summary>Minhas preferências de conversa</summary>
        <label>
          <input
            type="checkbox"
            checked={social.preference.text}
            onChange={(e) =>
              social.setPreference({
                ...social.preference,
                text: e.target.checked,
              })
            }
          />{" "}
          Aberto a mensagens
        </label>
        <label>
          <input
            type="checkbox"
            checked={social.preference.video}
            onChange={(e) =>
              social.setPreference({
                ...social.preference,
                video: e.target.checked,
              })
            }
          />{" "}
          Aberto a convites de vídeo
        </label>
        <label>
          Orientação (opcional)
          <select
            aria-label="Orientação opcional"
            value={orientation}
            onChange={(e) => {
              setOrientation(e.target.value);
              social.setPreference({
                ...social.preference,
                orientation: visible ? e.target.value : "",
              });
            }}
          >
            {ORIENTATIONS.map((o) => (
              <option key={o} value={o}>
                {o || "Prefiro não informar"}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => {
              setVisible(e.target.checked);
              social.setPreference({
                ...social.preference,
                orientation: e.target.checked ? orientation : "",
              });
            }}
          />{" "}
          Mostrar sobre meu avatar
        </label>
        <small>
          Preferências desta visita. A orientação oculta não é compartilhada. A
          intenção é escolhida em Meu avatar.
        </small>
      </details>
      {s && (
        <section aria-label="Conversa privada" className="direct-panel">
          <strong>
            {s.accepted
              ? `Mensagem privada · ${name}`
              : s.incoming
                ? `${name} quer conversar por mensagem`
                : `Convite enviado para ${name}`}
          </strong>
          {!s.accepted ? (
            <>
              <p>A câmera não será ligada.</p>
              {s.incoming ? (
                <>
                  <button onClick={() => social.respond(true)}>
                    Aceitar mensagem
                  </button>
                  <button onClick={() => social.respond(false)}>
                    Agora não
                  </button>
                </>
              ) : (
                <button onClick={() => social.finish()}>
                  Cancelar mensagem
                </button>
              )}
            </>
          ) : (
            <>
              <div
                className="direct-history"
                role="log"
                aria-label="Mensagens privadas"
              >
                {social.messages.map((m) => (
                  <p key={m.id}>
                    <strong>{m.name}: </strong>
                    {m.text}
                  </p>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (social.send(draft)) setDraft("");
                }}
              >
                <input
                  aria-label="Mensagem privada"
                  maxLength={280}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreva sua mensagem…"
                />
                <button disabled={!draft.trim()}>Enviar privada</button>
              </form>
              <button onClick={() => social.finish()}>
                Encerrar mensagens
              </button>
            </>
          )}
          <button onClick={social.block}>Bloquear nesta visita</button>
        </section>
      )}
      {social.notice && <p role="status">{social.notice}</p>}
    </div>
  );
}
