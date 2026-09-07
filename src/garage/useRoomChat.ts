import { useEffect, useRef, useState } from "react";
import type { Person, RoomId } from "./model";

export type RoomMessage = {
  id: string;
  sender: string;
  name: string;
  text: string;
  room: RoomId;
  at: number;
};
// Local prototype transport. Online delivery needs server-verified membership and moderation.
export function useRoomChat(
  room: RoomId,
  mode: "local" | "online",
  self: Person,
  people: Person[],
) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  const roster = useRef([self, ...people]);
  roster.current = [self, ...people];
  const last = useRef(0);
  useEffect(() => {
    setMessages([]);
    setError("");
    last.current = 0;
    if (mode !== "local") return;
    const bus = new BroadcastChannel(`disque-room-chat-v1:${room}`);
    channel.current = bus;
    const seen = new Set<string>();
    const limits = new Map<string, number>();
    bus.onmessage = ({ data }) => {
      if (
        !data ||
        typeof data !== "object" ||
        data.room !== room ||
        typeof data.id !== "string" ||
        data.id.length > 80 ||
        typeof data.text !== "string" ||
        !data.text.trim() ||
        data.text.length > 280
      )
        return;
      const person = roster.current.find(
        (p) => p.id === data.sender && (p.room || "garage") === room,
      );
      if (
        !person ||
        seen.has(data.id) ||
        Date.now() - (limits.get(person.id) || 0) < 800
      )
        return;
      seen.add(data.id);
      if (seen.size > 200) seen.delete(seen.values().next().value!);
      limits.set(person.id, Date.now());
      const message: RoomMessage = {
        id: data.id,
        sender: person.id,
        name: person.name,
        text: data.text.trim(),
        room,
        at: Date.now(),
      };
      setMessages((old) => [...old, message].slice(-100));
    };
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      bus.close();
      channel.current = null;
      window.clearInterval(timer);
    };
  }, [room, mode]);
  function send(text: string) {
    const clean = text.trim();
    if (!channel.current || !clean || clean.length > 280) return false;
    if (Date.now() - last.current < 1000) {
      setError("Espere um instante antes da próxima mensagem.");
      return false;
    }
    const message: RoomMessage = {
      id: crypto.randomUUID(),
      sender: self.id,
      name: self.name,
      text: clean,
      room,
      at: Date.now(),
    };
    try {
      channel.current.postMessage(message);
    } catch {
      setError("Não foi possível enviar. Tente novamente.");
      return false;
    }
    last.current = message.at;
    setError("");
    setNow(Date.now());
    setMessages((old) => [...old, message].slice(-100));
    return true;
  }
  const bubbles: Record<string, string> = {};
  for (const m of messages)
    if (m.room === room && now - m.at < 6000) bubbles[m.sender] = m.text;
  return {
    messages: messages.filter((m) => m.room === room),
    bubbles,
    send,
    error,
    available: mode === "local",
  };
}
