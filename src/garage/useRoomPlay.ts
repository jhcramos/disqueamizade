import { useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase/client";
import { mergePlay, parsePlay, type PlayAction, type PlayState } from "./play";
import type { RoomId } from "./model";
export function useRoomPlay(room: RoomId, mode: "local" | "online") {
  const [state, setState] = useState<PlayState>({}),
    [connected, setConnected] = useState(false);
  const current = useRef<PlayState>({}),
    send = useRef<(data: unknown) => void>(() => {}),
    last = useRef(0);
  useEffect(() => {
    let alive = true;
    current.current = {};
    setState({});
    setConnected(false);
    const apply = (raw: unknown) => {
      const action = parsePlay(raw, room);
      if (!action) return;
      const next = mergePlay(current.current, action);
      if (next !== current.current) {
        current.current = next;
        if (alive) setState(next);
      }
    };
    const receive = (data: any) => {
      if (!alive || !data || typeof data !== "object") return;
      if (data.type === "hello") {
        send.current({
          type: "snapshot",
          actions: Object.values(current.current),
        });
        return;
      }
      if (data.type === "snapshot" && Array.isArray(data.actions))
        for (const action of data.actions.slice(0, 5)) apply(action);
      if (data.type === "action") apply(data.action);
    };
    let cleanup = () => {};
    if (mode === "local") {
      const channel = new BroadcastChannel(`disque-house-play-v1:${room}`);
      channel.onmessage = (e) => receive(e.data);
      send.current = (data) => channel.postMessage(data);
      setConnected(true);
      send.current({ type: "hello" });
      cleanup = () => channel.close();
    } else {
      const channel = supabase.channel(`garage:play-v1:${room}`);
      channel
        .on("broadcast", { event: "play" }, ({ payload }) => receive(payload))
        .subscribe((status) => {
          if (!alive) return;
          setConnected(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED") send.current({ type: "hello" });
        });
      send.current = (data) => {
        void channel.send({
          type: "broadcast",
          event: "play",
          payload: data as object,
        });
      };
      cleanup = () => {
        void supabase.removeChannel(channel);
      };
    }
    // A second request covers peers still joining their transport.
    const retry = setTimeout(() => send.current({ type: "hello" }), 1200);
    return () => {
      alive = false;
      clearTimeout(retry);
      send.current = () => {};
      cleanup();
    };
  }, [room, mode]);
  function act(action: PlayAction) {
    if (!connected || action.room !== room || Date.now() - last.current < 650)
      return false;
    const valid = parsePlay(action, room);
    if (!valid) return false;
    last.current = Date.now();
    current.current = mergePlay(current.current, valid);
    setState(current.current);
    send.current({ type: "action", action: valid });
    return true;
  }
  return { state, act, connected };
}
