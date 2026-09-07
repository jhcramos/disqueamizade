import { useEffect, useRef, useState } from "react";
import type { Person, RoomId } from "./model";
export type SocialPreference = {
  text: boolean;
  video: boolean;
  orientation: string;
};
export const ORIENTATIONS = [
  "",
  "Gay",
  "Lésbica",
  "Hétero",
  "Bi",
  "Pan",
  "Assexual",
  "Queer",
];
export type DirectSession = {
  id: string;
  peer: string;
  incoming: boolean;
  accepted: boolean;
  expires: number;
};
export function useSocialChat(
  self: Person,
  people: Person[],
  room: RoomId,
  mode: string,
) {
  const [preference, setPreference] = useState<SocialPreference>({
    text: true,
    video: true,
    orientation: "",
  });
  const [preferences, setPreferences] = useState<
    Record<string, SocialPreference>
  >({});
  const [session, setSession] = useState<DirectSession | null>(null);
  const [messages, setMessages] = useState<
    { id: string; name: string; text: string }[]
  >([]);
  const [notice, setNotice] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  const state = useRef({ self, people, preference, session });
  state.current = { self, people, preference, session };
  const blocked = useRef(new Set<string>());
  const last = useRef(0);
  const emit = (type: string, extra = {}) =>
    channel.current?.postMessage({ type, from: self.id, room, ...extra });
  const finish = (message = "") => {
    const s = state.current.session;
    if (s) emit("end", { to: s.peer, id: s.id });
    state.current.session = null;
    setSession(null);
    setMessages([]);
    setNotice(message);
  };
  useEffect(() => {
    setPreferences({});
    setSession(null);
    setMessages([]);
    state.current.session = null;
    if (mode !== "local") return;
    const bus = new BroadcastChannel(`disque-social-v1:${room}`);
    channel.current = bus;
    const announce = () =>
      bus.postMessage({
        type: "preference",
        from: state.current.self.id,
        room,
        preference: state.current.preference,
      });
    bus.onmessage = ({ data: d }) => {
      const current = state.current;
      const peer = current.people.find(
        (p) => p.id === d?.from && (p.room || "garage") === room,
      );
      if (!peer || d.room !== room || blocked.current.has(peer.id)) return;
      if (d.type === "preference") {
        const p = d.preference;
        if (
          p &&
          typeof p.text === "boolean" &&
          typeof p.video === "boolean" &&
          ORIENTATIONS.includes(p.orientation)
        )
          setPreferences((old) => ({ ...old, [peer.id]: p }));
        return;
      }
      if (
        d.to !== current.self.id ||
        typeof d.id !== "string" ||
        d.id.length > 80
      )
        return;
      if (d.type === "invite") {
        if (
          current.session ||
          !current.preference.text ||
          !Number.isFinite(d.expires) ||
          d.expires < Date.now() ||
          d.expires > Date.now() + 61000
        )
          return;
        const next = {
          id: d.id,
          peer: peer.id,
          incoming: true,
          accepted: false,
          expires: d.expires,
        };
        current.session = next;
        setSession(next);
        setMessages([]);
        setNotice("");
        return;
      }
      const s = current.session;
      if (!s || s.peer !== peer.id || s.id !== d.id) return;
      if (d.type === "end") {
        current.session = null;
        setSession(null);
        setMessages([]);
        setNotice("A conversa foi encerrada.");
      }
      if (
        d.type === "accept" &&
        !s.incoming &&
        !s.accepted &&
        s.expires > Date.now()
      ) {
        const next = { ...s, accepted: true };
        current.session = next;
        setSession(next);
      }
      if (
        d.type === "message" &&
        s.accepted &&
        typeof d.text === "string" &&
        d.text.trim() &&
        d.text.length <= 280 &&
        typeof d.messageId === "string"
      )
        setMessages((old) =>
          old.some((m) => m.id === d.messageId)
            ? old
            : [
                ...old,
                { id: d.messageId, name: peer.name, text: d.text.trim() },
              ].slice(-100),
        );
    };
    announce();
    const timer = setInterval(() => {
      announce();
      const s = state.current.session;
      if (
        s &&
        ((!s.accepted && s.expires < Date.now()) ||
          !state.current.people.some((p) => p.id === s.peer))
      )
        finish("O convite expirou ou a pessoa saiu da sala.");
    }, 1000);
    return () => {
      const s = state.current.session;
      if (s)
        bus.postMessage({
          type: "end",
          from: self.id,
          room,
          to: s.peer,
          id: s.id,
        });
      clearInterval(timer);
      bus.close();
      channel.current = null;
    };
  }, [self.id, room, mode]);
  useEffect(() => {
    emit("preference", { preference });
  }, [preference]);
  return {
    isBlocked: (id: string) => blocked.current.has(id),
    preference,
    setPreference,
    preferences: { ...preferences, [self.id]: preference },
    session,
    messages,
    notice,
    request: (peer: Person) => {
      if (
        mode !== "local" ||
        state.current.session ||
        blocked.current.has(peer.id) ||
        !preferences[peer.id]?.text
      )
        return;
      const next = {
        id: crypto.randomUUID(),
        peer: peer.id,
        incoming: false,
        accepted: false,
        expires: Date.now() + 60000,
      };
      state.current.session = next;
      setSession(next);
      setMessages([]);
      setNotice("");
      emit("invite", { to: peer.id, id: next.id, expires: next.expires });
    },
    respond: (accept: boolean) => {
      const s = state.current.session;
      if (!s || !s.incoming || s.accepted || s.expires < Date.now()) return;
      if (!accept) return finish("Convite recusado.");
      const next = { ...s, accepted: true };
      state.current.session = next;
      setSession(next);
      emit("accept", { to: s.peer, id: s.id });
    },
    send: (text: string) => {
      const s = state.current.session;
      const value = text.trim();
      if (
        !s?.accepted ||
        !value ||
        value.length > 280 ||
        Date.now() - last.current < 800
      )
        return false;
      last.current = Date.now();
      const id = crypto.randomUUID();
      emit("message", { to: s.peer, id: s.id, messageId: id, text: value });
      setMessages((old) =>
        [...old, { id, name: self.name, text: value }].slice(-100),
      );
      return true;
    },
    finish,
    block: () => {
      const s = state.current.session;
      if (s) blocked.current.add(s.peer);
      finish("Pessoa bloqueada nesta visita.");
    },
  };
}
