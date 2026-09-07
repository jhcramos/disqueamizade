import { useLocalGroup } from "./useLocalGroup";
import { DEFAULT_APPEARANCE, type Appearance } from "./avatarStyle";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase/client";
import {
  PrivateContactClient,
  type PrivateInvite,
} from "@/rooms/privateContact";
import { fetchRoomToken } from "@/rooms/livekit";
import { acquireGarageMedia } from "./media";
import {
  sameRoom,
  parsePerson,
  START,
  type RoomId,
  type Person,
  type Point,
} from "./model";

const GARAGE_ROOM = import.meta.env.VITE_GARAGE_ROOM_SLUG || "garage-prototype";
export type Invite = {
  id: string;
  from: string;
  to: string;
  expires: number;
  status: "pending" | "accepted" | "declined" | "ended";
};
export type ConnectionMode = "local" | "online";
export function useGarage(
  name: string,
  avatar: number,
  mode: ConnectionMode,
  userId?: string,
  appearance: Appearance = DEFAULT_APPEARANCE,
  seat?: string,
) {
  const local = useLocalGroup(name, avatar, mode === "local", appearance, seat);
  const [id] = useState(() => crypto.randomUUID()),
    identity = mode === "online" && userId ? userId : id;
  const [people, setPeople] = useState<Person[]>([]),
    [invite, setInvite] = useState<Invite | null>(null),
    [error, setError] = useState(""),
    [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null),
    [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const profile = useRef({ name, avatar, appearance, seat });
  profile.current = { name, avatar, appearance, seat };
  const self = useRef<Person>({
      id: identity,
      name,
      avatar,
      position: START,
      busy: false,
    }),
    send = useRef<(event: string, data: unknown, to?: string) => void>(
      () => {},
    ),
    contacts = useRef(new PrivateContactClient());
  const currentInvite = useRef(invite),
    peers = useRef(people),
    rtc = useRef<RTCPeerConnection | null>(null),
    localStream = useRef<MediaStream | null>(null),
    ice = useRef<RTCIceCandidateInit[]>([]),
    pendingAction = useRef(false);
  currentInvite.current = invite;
  peers.current = people;
  const update = (point?: Point, room?: RoomId) => {
    self.current = {
      ...self.current,
      id: identity,
      ...profile.current,
      ...(point ? { position: point } : {}),
      ...(room
        ? { room, ...(room !== self.current.room ? { seat: undefined } : {}) }
        : {}),
      busy: currentInvite.current?.status === "accepted",
    };
    send.current("person", self.current);
  };
  const closeMedia = () => {
    rtc.current?.close();
    rtc.current = null;
    ice.current = [];
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    setRemoteStream(null);
    setToken(null);
  };
  const end = async () => {
    const i = currentInvite.current;
    currentInvite.current = null;
    setInvite(null);
    closeMedia();
    update();
    if (i) {
      if (mode === "online")
        await contacts.current
          .end(i.id)
          .catch(() =>
            setError(
              "A chamada foi fechada neste aparelho. Não foi possível avisar o servidor.",
            ),
          );
      else
        send.current("end", { id: i.id }, i.from === identity ? i.to : i.from);
    }
  };
  const makeRtc = (i: Invite) => {
    closeMedia();
    const pc = new RTCPeerConnection({ iceServers: [] });
    rtc.current = pc;
    if (i.from === identity) {
      pc.addTransceiver("video", { direction: "sendrecv" });
      pc.addTransceiver("audio", { direction: "sendrecv" });
    }
    const peer = i.from === identity ? i.to : i.from;
    pc.onicecandidate = (e) => {
      if (e.candidate)
        send.current(
          "ice",
          { id: i.id, candidate: e.candidate.toJSON() },
          peer,
        );
    };
    pc.ontrack = (e) => {
      const stream = new MediaStream();
      pc.getReceivers().forEach((r) => {
        if (r.track) stream.addTrack(r.track);
      });
      if (!stream.getTracks().includes(e.track)) stream.addTrack(e.track);
      setRemoteStream(stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setError("A conexão local falhou. Encerre e tente novamente.");
        void end();
      }
    };
    return pc;
  };
  useEffect(() => {
    if ([mode].includes("local")) return;
    let alive = true;
    const seen = new Map<string, { person: Person; time: number }>();
    setConnected(false);
    setPeople([]);
    setInvite(null);
    closeMedia();
    self.current = { id: identity, name, avatar, position: START, busy: false };
    const deliverPerson = (raw: unknown) => {
      const p = parsePerson(raw);
      if (p && p.id !== identity) {
        seen.set(p.id, { person: p, time: Date.now() });
        if (alive) setPeople([...seen.values()].map((v) => v.person));
      }
    };
    const onSignal = async (event: string, data: any, from: string) => {
      if (!alive) return;
      if (event === "person") {
        deliverPerson(data);
        return;
      }
      if (event === "leave") {
        seen.delete(from);
        setPeople([...seen.values()].map((v) => v.person));
        if (
          currentInvite.current &&
          (currentInvite.current.from === from ||
            currentInvite.current.to === from)
        )
          void end();
        return;
      }
      const i = currentInvite.current;
      if (event === "invite") {
        const p = seen.get(from)?.person;
        if (
          i ||
          !p ||
          !sameRoom(self.current, p) ||
          typeof data.id !== "string" ||
          !Number.isFinite(data.expires) ||
          data.expires < Date.now() ||
          data.expires > Date.now() + 31000
        )
          return;
        const next: Invite = {
          id: data.id,
          from,
          to: identity,
          expires: data.expires,
          status: "pending",
        };
        currentInvite.current = next;
        setInvite(next);
        return;
      }
      if (
        !i ||
        data.id !== i.id ||
        from !== (i.from === identity ? i.to : i.from)
      )
        return;
      if (event === "end" || event === "decline") {
        currentInvite.current = null;
        setInvite(null);
        closeMedia();
        setError(
          event === "decline"
            ? "O convite não foi aceito desta vez."
            : "A outra pessoa saiu da conversa.",
        );
        return;
      }
      if (
        event === "accept" &&
        i.from === identity &&
        i.status === "pending" &&
        i.expires > Date.now()
      ) {
        const next = { ...i, status: "accepted" as const };
        currentInvite.current = next;
        setInvite(next);
        const pc = makeRtc(next);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (alive && rtc.current === pc)
          send.current("offer", { id: i.id, sdp: offer }, from);
        return;
      }
      if (i.status !== "accepted") return;
      if (event === "offer" && i.to === identity) {
        const pc = rtc.current;
        if (!pc || pc.signalingState !== "stable") return;
        await pc.setRemoteDescription(data.sdp);
        for (const transceiver of pc.getTransceivers())
          transceiver.direction = "sendrecv";
        for (const c of ice.current) await pc.addIceCandidate(c);
        ice.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (alive && rtc.current === pc)
          send.current("answer", { id: i.id, sdp: answer }, from);
      }
      if (event === "answer" && i.from === identity) {
        const pc = rtc.current;
        if (!pc || pc.signalingState !== "have-local-offer") return;
        await pc.setRemoteDescription(data.sdp);
        for (const c of ice.current) await pc.addIceCandidate(c);
        ice.current = [];
      }
      if (event === "ice") {
        if (rtc.current?.remoteDescription)
          await rtc.current.addIceCandidate(data.candidate);
        else ice.current.push(data.candidate);
      }
    };
    let cleanup = () => {};
    if (mode === "local") {
      const channel = new BroadcastChannel("disque-garagem-local-v1");
      send.current = (event, data, to) =>
        channel.postMessage({ event, data, from: identity, to });
      channel.onmessage = (e) => {
        const m = e.data;
        if (!m || m.from === identity || (m.to && m.to !== identity)) return;
        void onSignal(m.event, m.data, m.from).catch(() => {
          if (alive) setError("Não foi possível completar a conexão local.");
        });
      };
      setConnected(true);
      update();
      cleanup = () => {
        channel.postMessage({ event: "leave", from: identity });
        channel.close();
      };
    } else if (userId) {
      const channel = supabase.channel("garage:prototype-v1", {
        config: { presence: { key: identity } },
      });
      channel
        .on("presence", { event: "sync" }, () => {
          const fresh = new Set<string>();
          for (const p of Object.values(channel.presenceState()).flat()) {
            const person = parsePerson(p);
            if (person) {
              fresh.add(person.id);
              deliverPerson(person);
            }
          }
          for (const key of seen.keys()) if (!fresh.has(key)) seen.delete(key);
          setPeople([...seen.values()].map((v) => v.person));
        })
        .on("broadcast", { event: "position" }, ({ payload }) =>
          deliverPerson(payload),
        )
        .subscribe((status) => {
          if (!alive) return;
          setConnected(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED") void channel.track(self.current);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
            setError(
              "Não foi possível conectar à garagem. Tente entrar novamente.",
            );
        });
      send.current = (event, data) => {
        if (event === "person")
          void channel.send({
            type: "broadcast",
            event: "position",
            payload: data,
          });
      };
      const receive = (raw: PrivateInvite) => {
        if (!alive || raw.roomSlug !== GARAGE_ROOM) return;
        const previous = currentInvite.current;
        if (!previous && raw.status === "pending") {
          const peer = peers.current.find(
            (p) =>
              p.id === (raw.fromUser === identity ? raw.toUser : raw.fromUser),
          );
          if (!peer || !sameRoom(self.current, peer)) return;
        }
        if (previous && previous.id !== raw.id) return;
        if (
          raw.status === "expired" ||
          raw.status === "declined" ||
          raw.status === "ended"
        ) {
          if (previous?.id === raw.id) {
            currentInvite.current = null;
            setInvite(null);
            closeMedia();
          }
          return;
        }
        const next: Invite = {
          id: raw.id,
          from: raw.fromUser,
          to: raw.toUser,
          expires: Date.parse(raw.expiresAt),
          status: raw.status,
        };
        currentInvite.current = next;
        setInvite(next);
        if (next.status === "accepted" && previous?.status !== "accepted")
          void fetchRoomToken(
            [next.from, next.to].sort().join("-"),
            identity,
            next.id,
          )
            .then((t) => {
              if (alive && currentInvite.current?.id === next.id) setToken(t);
            })
            .catch(() =>
              setError(
                "Não foi possível conectar o vídeo. Confirme a configuração do LiveKit.",
              ),
            );
      };
      void contacts.current
        .subscribe(identity, receive, () =>
          setError("Os convites estão temporariamente indisponíveis."),
        )
        .catch(() => setError("Não foi possível receber convites."));
      const preferences = () =>
        contacts.current
          .setPreferences(GARAGE_ROOM, {
            message: false,
            audio: false,
            video: true,
          })
          .catch(() =>
            setError("Não foi possível habilitar convites nesta garagem."),
          );
      void preferences();
      const refresh = setInterval(() => {
        void preferences();
        void channel.track(self.current);
      }, 30000);
      cleanup = () => {
        clearInterval(refresh);
        contacts.current.leave();
        void supabase.removeChannel(channel);
      };
    }
    const pagehide = () => {
      send.current("leave", {});
      rtc.current?.close();
      localStream.current?.getTracks().forEach((t) => t.stop());
    };
    window.addEventListener("pagehide", pagehide);
    const timer = setInterval(() => {
      update();
      const limit = Date.now() - 7000;
      if (mode === "local") {
        for (const [id, v] of seen) if (v.time < limit) seen.delete(id);
        setPeople([...seen.values()].map((v) => v.person));
        const active = currentInvite.current;
        if (
          active?.status === "accepted" &&
          !seen.has(active.from === identity ? active.to : active.from)
        ) {
          void end();
          setError("A outra visita desconectou.");
        }
      }
      const i = currentInvite.current;
      if (i?.status === "pending" && Date.now() > i.expires) {
        currentInvite.current = null;
        setInvite(null);
        setError("O convite expirou. Você pode tentar novamente.");
      }
    }, 1500);
    return () => {
      alive = false;
      window.removeEventListener("pagehide", pagehide);
      clearInterval(timer);
      send.current = () => {};
      cleanup();
      rtc.current?.close();
      rtc.current = null;
      localStream.current?.getTracks().forEach((t) => t.stop());
      localStream.current = null;
      currentInvite.current = null;
    };
  }, [identity, mode, userId]);
  useEffect(() => {
    update();
  }, [name, avatar, appearance, seat, invite?.status]);
  const request = async (person: Person) => {
    if (
      currentInvite.current ||
      pendingAction.current ||
      person.busy ||
      !sameRoom(self.current, person)
    )
      return;
    pendingAction.current = true;
    setError("");
    try {
      if (mode === "online") {
        const raw = await contacts.current.invite(
          GARAGE_ROOM,
          person.id,
          "video",
        );
        const next: Invite = {
          id: raw.id,
          from: identity,
          to: person.id,
          expires: Date.parse(raw.expiresAt),
          status: "pending",
        };
        if (!currentInvite.current) {
          currentInvite.current = next;
          setInvite(next);
        }
      } else {
        const next: Invite = {
          id: crypto.randomUUID(),
          from: identity,
          to: person.id,
          expires: Date.now() + 30000,
          status: "pending",
        };
        currentInvite.current = next;
        setInvite(next);
        send.current("invite", next, person.id);
      }
    } catch {
      setError(
        "Não foi possível enviar o convite. A pessoa pode estar indisponível.",
      );
    } finally {
      pendingAction.current = false;
    }
  };
  const respond = async (accept: boolean) => {
    setError("");
    const i = currentInvite.current;
    if (
      !i ||
      i.to !== identity ||
      i.expires < Date.now() ||
      i.status !== "pending" ||
      pendingAction.current
    )
      return;
    const peer = peers.current.find((p) => p.id === i.from);
    if (accept && (!peer || !sameRoom(self.current, peer))) {
      setError("A pessoa já saiu de perto. Você pode recusar este convite.");
      return;
    }
    pendingAction.current = true;
    try {
      if (mode === "online")
        await contacts.current.respond(i.id, accept ? "accept" : "decline");
      else if (accept) {
        const next = { ...i, status: "accepted" as const };
        currentInvite.current = next;
        setInvite(next);
        makeRtc(next);
        send.current("accept", { id: i.id }, i.from);
      } else {
        send.current("decline", { id: i.id }, i.from);
        currentInvite.current = null;
        setInvite(null);
      }
    } catch {
      setError("Não foi possível responder ao convite.");
    } finally {
      pendingAction.current = false;
    }
  };
  const publish = async (kind: "video" | "audio", enabled: boolean) => {
    const pc = rtc.current;
    if (!pc || currentInvite.current?.status !== "accepted")
      throw new Error("Entre em uma conversa antes de ligar sua câmera.");
    const transceiver = pc
      .getTransceivers()
      .find((t) => t.receiver.track.kind === kind);
    if (!transceiver) throw new Error("A conexão ainda está sendo preparada.");
    if (!enabled) {
      const track = transceiver.sender.track;
      await transceiver.sender.replaceTrack(null);
      track?.stop();
      if (track) localStream.current?.removeTrack(track);
      return localStream.current;
    }
    const stream = await acquireGarageMedia(kind);
    const track = stream.getTracks()[0];
    if (rtc.current !== pc || currentInvite.current?.status !== "accepted") {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error("A conversa já foi encerrada.");
    }
    try {
      await transceiver.sender.replaceTrack(track);
    } catch (e) {
      track.stop();
      throw e;
    }
    if (!localStream.current) localStream.current = new MediaStream();
    localStream.current.addTrack(track);
    return new MediaStream(localStream.current.getTracks());
  };
  return mode === "local"
    ? local
    : {
        group: null,
        localMedia: null,
        remoteStreams: {},
        remoteFlags: {},
        camera: false,
        mic: false,
        identity,
        people,
        invite,
        error,
        setError,
        connected,
        token,
        remoteStream,
        update,
        request,
        respond,
        end,
        publish,
      };
}
