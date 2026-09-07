import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, ChevronDown } from "lucide-react";
import { AvatarPortrait } from "./AvatarPortrait";
import { ROOMS, type Person, type RoomId } from "./model";
import type { useRoomChat } from "./useRoomChat";
export function RoomChat({
  chat,
  room,
  people,
  inCall,
}: {
  chat: ReturnType<typeof useRoomChat>;
  room: RoomId;
  people: Person[];
  inCall: boolean;
}) {
  const [open, setOpen] = useState(false),
    [text, setText] = useState("");
  const [seen, setSeen] = useState<string | undefined>();
  const end = useRef<HTMLDivElement>(null);
  const latest = chat.messages[chat.messages.length - 1]?.id;
  useEffect(() => {
    setOpen(false);
    setText("");
    setSeen(undefined);
  }, [room, inCall]);
  useEffect(() => {
    if (open) {
      setSeen(latest);
      end.current?.scrollIntoView({ block: "nearest" });
    }
  }, [latest, open]);
  const seenIndex = chat.messages.findIndex((m) => m.id === seen);
  const unread = open ? 0 : chat.messages.length - (seenIndex + 1);
  function submit(value: string) {
    if (chat.send(value)) setText("");
  }
  return (
    <section className="room-chat" aria-label="Chat público do ambiente">
      <button
        className="room-chat-toggle"
        aria-expanded={open}
        aria-controls="room-chat-content"
        onClick={() => setOpen(!open)}
      >
        <MessageCircle size={20} />
        <strong>Chat · {ROOMS[room].name}</strong>
        <span>{unread ? `${unread} novas` : "Dê um oi"}</span>
        <ChevronDown size={18} />
      </button>
      {open && (
        <div id="room-chat-content">
          <p className="room-chat-public">
            Público · todos em {ROOMS[room].name} podem ler
          </p>
          {!chat.available ? (
            <p className="room-chat-public">
              O chat de texto está disponível na visita local por enquanto.
            </p>
          ) : (
            <>
              <div
                className="room-chat-history"
                role="log"
                aria-label="Mensagens da sala"
                aria-live="polite"
                aria-relevant="additions"
              >
                {!chat.messages.length && (
                  <p className="room-chat-empty">
                    Toda amizade pode começar com um oi.
                    <br />
                    <small>As mensagens ficam apenas nesta visita.</small>
                  </p>
                )}
                {chat.messages.map((m) => {
                  const person = people.find((p) => p.id === m.sender);
                  return (
                    <article className="room-chat-message" key={m.id}>
                      <div className="room-chat-portrait">
                        {person ? (
                          <AvatarPortrait
                            index={person.avatar}
                            appearance={person.appearance}
                          />
                        ) : (
                          <MessageCircle size={18} />
                        )}
                      </div>
                      <div>
                        <strong>{m.name}</strong>
                        <time>
                          {new Date(m.at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                        <p>{m.text}</p>
                      </div>
                    </article>
                  );
                })}
                <div ref={end} />
              </div>
              <div className="room-chat-quick">
                {[
                  "Oi, pessoal! 👋",
                  "Posso participar?",
                  "Quem quer conversar?",
                ].map((t) => (
                  <button key={t} onClick={() => submit(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(text);
                }}
              >
                <input
                  aria-label="Mensagem pública"
                  placeholder="Diga um oi para a sala…"
                  maxLength={280}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  aria-label="Enviar mensagem"
                >
                  <Send size={18} />
                </button>
              </form>
              <small className="room-chat-count">
                {text.length}/280 · Sem transcrição de voz
              </small>
              {chat.error && (
                <p role="alert" className="garage-error">
                  {chat.error}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
