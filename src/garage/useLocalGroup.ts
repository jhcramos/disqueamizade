import { useEffect, useRef, useState } from "react";
import { type Appearance } from "./avatarStyle";
import {
  sameRoom,
  parsePerson,
  START,
  type Person,
  type Point,
  type RoomId,
} from "./model";
import { acquireGarageMedia } from "./media";
import { canAddMember, validGroup, type LocalGroup } from "./groupRules";
import type { Invite } from "./useGarage";

type Pending = Invite & { groupId: string; members: string[] };
type Link = {
  pc: RTCPeerConnection;
  ice: RTCIceCandidateInit[];
  offered: boolean;
};
type Flags = { video: boolean; audio: boolean };
export type GroupView = LocalGroup & { pendingName: string; notice: string };
type State = {
  people: Person[];
  invite: Invite | null;
  error: string;
  connected: boolean;
  group: GroupView | null;
  localMedia: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  remoteFlags: Record<string, Flags>;
  camera: boolean;
  mic: boolean;
};
const initial = (): State => ({
  people: [],
  invite: null,
  error: "",
  connected: false,
  group: null,
  localMedia: null,
  remoteStreams: {},
  remoteFlags: {},
  camera: false,
  mic: false,
});

// Local prototype transport. Group membership is controlled by the inviter;
// media signaling is accepted only from members of the approved revision.
class LocalConversation {
  channel: BroadcastChannel;
  state = initial();
  self: Person;
  seen = new Map<string, { person: Person; time: number }>();
  group: LocalGroup | null = null;
  pending: Pending | null = null;
  acceptedPending = false;
  links = new Map<string, Link>();
  media: MediaStream | null = null;
  generation = 0;
  alive = true;
  capturing = new Set<string>();
  pendingCaptures = new Set<MediaStream>();
  timer: ReturnType<typeof setInterval>;
  constructor(
    readonly id: string,
    readonly change: (s: State) => void,
    profile: Pick<Person, "name" | "avatar" | "appearance" | "seat">,
  ) {
    this.self = {
      id,
      ...profile,
      position: START,
      room: "garage",
      busy: false,
    };
    this.channel = new BroadcastChannel("disque-garagem-local-v2");
    this.channel.onmessage = (e) => {
      const m = e.data;
      if (
        !m ||
        typeof m.from !== "string" ||
        m.from === id ||
        (m.to && m.to !== id)
      )
        return;
      void this.receive(m.event, m.data, m.from).catch(() =>
        this.patch({
          error:
            "Não foi possível completar a conexão. Saia da conversa e tente novamente.",
        }),
      );
    };
    this.patch({ connected: true });
    this.send("hello", this.self);
    this.update();
    this.timer = setInterval(() => this.tick(), 1500);
    window.addEventListener("pagehide", this.dispose);
  }
  patch(part: Partial<State>) {
    if (this.alive) {
      this.state = { ...this.state, ...part };
      this.change(this.state);
    }
  }
  send(event: string, data: unknown, to?: string) {
    if (this.alive)
      this.channel.postMessage({ event, data, from: this.id, to });
  }
  update(point?: Point, room?: RoomId, profile?: Partial<Person>) {
    this.self = {
      ...this.self,
      ...profile,
      ...(point ? { position: point } : {}),
      ...(room ? { room } : {}),
      id: this.id,
      busy: !!this.group || this.acceptedPending,
    };
    this.send("person", this.self);
  }
  refresh() {
    const g = this.group;
    this.patch({
      invite: g
        ? {
            id: g.id,
            from: g.host,
            to: g.members.find((id) => id !== g.host)!,
            status: "accepted",
            expires: Infinity,
          }
        : this.pending,
      group: g
        ? {
            ...g,
            pendingName: this.pending
              ? this.seen.get(this.pending.to)?.person.name || "Visita"
              : "",
            notice: this.state.group?.notice || "",
          }
        : null,
    });
    this.update();
  }
  stopMedia() {
    this.generation++;
    this.pendingCaptures.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    this.pendingCaptures.clear();
    this.media?.getTracks().forEach((t) => t.stop());
    this.media = null;
    for (const { pc } of this.links.values()) pc.close();
    this.links.clear();
    this.patch({
      localMedia: null,
      remoteStreams: {},
      remoteFlags: {},
      camera: false,
      mic: false,
    });
  }
  applyGroup(g: LocalGroup) {
    if (this.group?.id === g.id && this.group.revision >= g.revision) return;
    const added =
      !!this.group && g.members.some((id) => !this.group!.members.includes(id));
    this.stopMedia();
    this.group = g;
    this.pending = null;
    this.acceptedPending = false;
    this.patch({
      group: {
        ...g,
        pendingName: "",
        notice: added
          ? "Uma pessoa entrou. Câmera e microfone foram pausados. Ligue novamente quando quiser."
          : "Câmera e microfone começam desligados.",
      },
    });
    this.refresh();
    for (const peer of g.members.filter((id) => id !== this.id)) {
      this.ensureLink(peer);
      this.signal("ready", {}, peer);
    }
  }
  signal(event: string, data: object, peer: string) {
    if (this.group)
      this.send(
        event,
        { ...data, id: this.group.id, revision: this.group.revision },
        peer,
      );
  }
  ensureLink(peer: string): Link {
    const old = this.links.get(peer);
    if (old) return old;
    const pc = new RTCPeerConnection({ iceServers: [] });
    const link: Link = { pc, ice: [], offered: false };
    this.links.set(peer, link);
    if (this.id < peer) {
      pc.addTransceiver("video", { direction: "sendrecv" });
      pc.addTransceiver("audio", { direction: "sendrecv" });
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && this.links.get(peer) === link)
        this.signal("ice", { candidate: e.candidate.toJSON() }, peer);
    };
    pc.ontrack = () => {
      if (this.links.get(peer) !== link) return;
      const stream = new MediaStream(pc.getReceivers().map((r) => r.track));
      this.patch({
        remoteStreams: { ...this.state.remoteStreams, [peer]: stream },
      });
    };
    pc.onconnectionstatechange = () => {
      if (this.links.get(peer) === link && pc.connectionState === "failed")
        this.patch({
          error:
            "A conexão de vídeo com uma pessoa falhou. Saiam e entrem novamente na conversa.",
        });
    };
    return link;
  }
  async bind(pc: RTCPeerConnection) {
    for (const t of pc.getTransceivers()) {
      t.direction = "sendrecv";
      await t.sender.replaceTrack(
        this.media
          ?.getTracks()
          .find((track) => track.kind === t.receiver.track.kind) || null,
      );
    }
  }
  async receive(event: string, data: any, from: string) {
    if (!this.alive) return;
    if (event === "person" || event === "hello") {
      const p = parsePerson(data);
      if (p && p.id === from) {
        this.seen.set(from, { person: p, time: Date.now() });
        this.patch({ people: [...this.seen.values()].map((v) => v.person) });
      }
      if (event === "hello") this.update();
      return;
    }
    if (event === "leave") {
      this.removePeer(from);
      return;
    }
    if (!data || typeof data !== "object") return;
    if (event === "invite") {
      const p = this.seen.get(from)?.person;
      if (this.group || this.pending || !p || !sameRoom(this.self, p)) return;
      if (
        typeof data.id !== "string" ||
        data.id.length > 80 ||
        typeof data.groupId !== "string" ||
        data.groupId.length > 80 ||
        !Number.isFinite(data.expires) ||
        data.expires < Date.now() ||
        data.expires > Date.now() + 31000 ||
        !Array.isArray(data.members) ||
        data.members.length < 1 ||
        data.members.length > 3 ||
        data.members[0] !== from ||
        new Set(data.members).size !== data.members.length ||
        !data.members.every(
          (id: unknown) => typeof id === "string" && id.length <= 80,
        )
      )
        return;
      this.pending = {
        id: data.id,
        groupId: data.groupId,
        members: data.members,
        from,
        to: this.id,
        status: "pending",
        expires: data.expires,
      };
      this.acceptedPending = false;
      this.refresh();
      return;
    }
    if (event === "accept") {
      const p = this.pending,
        person = this.seen.get(from)?.person;
      if (
        !p ||
        p.from !== this.id ||
        p.to !== from ||
        data.id !== p.id ||
        p.expires < Date.now() ||
        !person ||
        !sameRoom(this.self, person) ||
        (this.group && this.group.host !== this.id)
      )
        return;
      const members = this.group?.members || [this.id];
      if (members.length >= 4) return;
      const next = {
        id: p.groupId,
        host: this.id,
        members: [...members, from],
        revision: (this.group?.revision || 0) + 1,
      };
      const inviteId = p.id;
      this.applyGroup(next);
      for (const id of next.members.filter((id) => id !== this.id))
        this.send("roster", { group: next, inviteId }, id);
      return;
    }
    if (event === "decline" || event === "cancel") {
      const p = this.pending;
      if (
        p &&
        data.id === p.id &&
        from === (p.from === this.id ? p.to : p.from)
      ) {
        this.pending = null;
        this.acceptedPending = false;
        this.patch({
          error:
            event === "decline"
              ? "O convite não foi aceito desta vez."
              : "O convite foi cancelado.",
        });
        this.refresh();
      }
      return;
    }
    if (event === "roster") {
      const g = data.group;
      if (!validGroup(g) || g.host !== from || !g.members.includes(this.id))
        return;
      const existing =
        this.group?.id === g.id &&
        this.group.host === from &&
        g.revision === this.group.revision + 1;
      const invited =
        this.acceptedPending &&
        this.pending?.from === from &&
        this.pending.groupId === g.id &&
        this.pending.id === data.inviteId &&
        g.members.length === this.pending.members.length + 1 &&
        this.pending.members.every((id) => g.members.includes(id));
      if (existing || invited) this.applyGroup(g);
      return;
    }
    const g = this.group;
    if (!g || data.id !== g.id || !g.members.includes(from)) return;
    if (event === "end" && from === g.host) {
      this.clear();
      this.patch({ error: "Quem iniciou encerrou a conversa." });
      return;
    }
    if (event === "exit" && g.host === this.id) {
      this.removeMember(from);
      return;
    }
    if (data.revision !== g.revision) return;
    if (event === "media") {
      this.patch({
        remoteFlags: {
          ...this.state.remoteFlags,
          [from]: { video: data.video === true, audio: data.audio === true },
        },
      });
      return;
    }
    const link = this.ensureLink(from),
      pc = link.pc;
    if (event === "ready" && this.id < from && !link.offered) {
      link.offered = true;
      await this.bind(pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (this.links.get(from) === link)
        this.signal("offer", { sdp: offer }, from);
      return;
    }
    if (event === "offer" && from < this.id && pc.signalingState === "stable") {
      await pc.setRemoteDescription(data.sdp);
      await this.bind(pc);
      for (const c of link.ice) await pc.addIceCandidate(c);
      link.ice = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (this.links.get(from) === link)
        this.signal("answer", { sdp: answer }, from);
      return;
    }
    if (
      event === "answer" &&
      this.id < from &&
      pc.signalingState === "have-local-offer"
    ) {
      await pc.setRemoteDescription(data.sdp);
      for (const c of link.ice) await pc.addIceCandidate(c);
      link.ice = [];
      return;
    }
    if (event === "ice") {
      if (pc.remoteDescription) await pc.addIceCandidate(data.candidate);
      else if (link.ice.length < 100) link.ice.push(data.candidate);
    }
  }
  request = async (person: Person) => {
    const peer = this.seen.get(person.id)?.person;
    if (
      !peer ||
      this.pending ||
      (this.group && this.group.host !== this.id) ||
      peer.busy ||
      this.group?.members.includes(peer.id) ||
      !sameRoom(this.self, peer)
    )
      return;
    if (!canAddMember(this.group, !!this.pending)) {
      this.patch({ error: "A conversa já tem quatro pessoas." });
      return;
    }
    this.pending = {
      id: crypto.randomUUID(),
      groupId: this.group?.id || crypto.randomUUID(),
      members: this.group?.members || [this.id],
      from: this.id,
      to: peer.id,
      expires: Date.now() + 30000,
      status: "pending",
    };
    this.patch({ error: "" });
    this.refresh();
    this.send("invite", this.pending, peer.id);
  };
  respond = async (accept: boolean) => {
    const p = this.pending,
      peer = p && this.seen.get(p.from)?.person;
    if (
      !p ||
      p.to !== this.id ||
      p.expires < Date.now() ||
      this.acceptedPending
    )
      return;
    if (accept && (!peer || !sameRoom(this.self, peer))) {
      this.patch({
        error: "A pessoa saiu de perto. Você pode recusar o convite.",
      });
      return;
    }
    if (accept) {
      this.acceptedPending = true;
      this.send("accept", { id: p.id }, p.from);
    } else {
      this.send("decline", { id: p.id }, p.from);
      this.pending = null;
      this.refresh();
    }
  };
  clear() {
    this.stopMedia();
    this.group = null;
    this.pending = null;
    this.acceptedPending = false;
    this.refresh();
  }
  end = async () => {
    if (this.group) {
      const g = this.group;
      if (g.host === this.id)
        for (const peer of g.members.filter((id) => id !== this.id))
          this.send("end", { id: g.id }, peer);
      else this.send("exit", { id: g.id }, g.host);
    }
    if (this.pending)
      this.send(
        "cancel",
        { id: this.pending.id },
        this.pending.from === this.id ? this.pending.to : this.pending.from,
      );
    this.clear();
  };
  removeMember(peer: string) {
    const g = this.group;
    if (!g || g.host !== this.id || !g.members.includes(peer)) return;
    const members = g.members.filter((id) => id !== peer);
    if (members.length < 2) {
      void this.end();
      return;
    }
    const next = { ...g, members, revision: g.revision + 1 };
    if (this.pending) {
      this.send("cancel", { id: this.pending.id }, this.pending.to);
      this.pending = null;
    }
    this.applyGroup(next);
    for (const id of members.filter((id) => id !== this.id))
      this.send("roster", { group: next }, id);
  }
  removePeer(peer: string) {
    this.seen.delete(peer);
    this.patch({ people: [...this.seen.values()].map((v) => v.person) });
    if (this.group?.host === peer) {
      this.clear();
      this.patch({ error: "Quem iniciou desconectou." });
    } else this.removeMember(peer);
    if (this.pending && [this.pending.from, this.pending.to].includes(peer)) {
      this.pending = null;
      this.acceptedPending = false;
      this.refresh();
    }
  }
  tick() {
    this.update();
    for (const [id, v] of this.seen)
      if (v.time < Date.now() - 7000) this.removePeer(id);
    if (this.pending && this.pending.expires < Date.now()) {
      this.pending = null;
      this.acceptedPending = false;
      this.patch({ error: "O convite expirou." });
      this.refresh();
    }
    if (this.group)
      for (const peer of this.group.members.filter((id) => id !== this.id)) {
        this.signal("ready", {}, peer);
        this.signal(
          "media",
          { video: this.state.camera, audio: this.state.mic },
          peer,
        );
      }
  }
  publish = async (
    kind: "video" | "audio",
    enabled: boolean,
    avatarMask = false,
    expectedGroup?: { id: string; revision: number },
  ): Promise<MediaStream | null> => {
    if (
      expectedGroup &&
      (this.group?.id !== expectedGroup.id ||
        this.group?.revision !== expectedGroup.revision)
    )
      throw new Error(
        "O grupo mudou. Confira os participantes antes de ligar a câmera.",
      );
    if (!this.group) throw new Error("Entre em uma conversa.");
    if (this.capturing.has(kind)) throw new Error("Aguarde o dispositivo.");
    this.capturing.add(kind);
    const generation = this.generation;
    try {
      let track: MediaStreamTrack | null = null;
      if (enabled) {
        let stream = await acquireGarageMedia(kind);
        if (!this.alive || generation !== this.generation || !this.group) {
          stream.getTracks().forEach((t) => t.stop());
          throw new Error("A conversa mudou.");
        }
        if (kind === "video" && avatarMask) {
          const raw = stream;
          this.pendingCaptures.add(raw);
          try {
            const { createAvatarCameraStream } = await import("./avatarCamera");
            stream = await createAvatarCameraStream(
              raw,
              this.self.avatar,
              this.self.appearance!,
            );
          } catch (e) {
            raw.getTracks().forEach((t) => t.stop());
            throw e;
          } finally {
            this.pendingCaptures.delete(raw);
          }
        }
        track = stream.getTracks()[0];
        if (!this.alive || generation !== this.generation || !this.group) {
          stream.getTracks().forEach((t) => t.stop());
          throw new Error("A conversa mudou. Ligue novamente se quiser.");
        }
      }
      const old = this.media?.getTracks().filter((t) => t.kind === kind) || [];
      try {
        await Promise.all(
          [...this.links.values()].map(({ pc }) =>
            pc
              .getTransceivers()
              .find((t) => t.receiver.track.kind === kind)
              ?.sender.replaceTrack(track),
          ),
        );
      } catch (e) {
        track?.stop();
        throw e;
      }
      if (generation !== this.generation) {
        track?.stop();
        throw new Error("A conversa mudou.");
      }
      old.forEach((t) => {
        t.stop();
        this.media?.removeTrack(t);
      });
      if (track) {
        this.media ||= new MediaStream();
        this.media.addTrack(track);
      }
      this.patch({
        localMedia: this.media ? new MediaStream(this.media.getTracks()) : null,
        ...(kind === "video" ? { camera: enabled } : { mic: enabled }),
      });
      for (const peer of this.group!.members.filter((id) => id !== this.id))
        this.signal(
          "media",
          { video: this.state.camera, audio: this.state.mic },
          peer,
        );
      return this.state.localMedia;
    } finally {
      this.capturing.delete(kind);
    }
  };
  dispose = () => {
    if (!this.alive) return;
    void this.end();
    this.send("leave", {});
    this.stopMedia();
    this.alive = false;
    clearInterval(this.timer);
    this.channel.close();
    window.removeEventListener("pagehide", this.dispose);
  };
}
export function useLocalGroup(
  name: string,
  avatar: number,
  enabled: boolean,
  appearance: Appearance,
  seat?: string,
) {
  const [identity] = useState(() => crypto.randomUUID());
  const [state, setState] = useState(initial);
  const controller = useRef<LocalConversation | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const c = new LocalConversation(identity, setState, {
      name,
      avatar,
      appearance,
      seat,
    });
    controller.current = c;
    return () => {
      c.dispose();
      controller.current = null;
    };
  }, [identity, enabled]);
  useEffect(() => {
    controller.current?.update(undefined, undefined, {
      name,
      avatar,
      appearance,
      seat,
    });
  }, [name, avatar, appearance, seat]);
  return {
    ...state,
    identity,
    token: null,
    remoteStream: null,
    setError: (error: string) => controller.current?.patch({ error }),
    update: (point?: Point, room?: RoomId) =>
      controller.current?.update(point, room),
    request: (person: Person) =>
      controller.current?.request(person) ?? Promise.resolve(),
    respond: (accept: boolean) =>
      controller.current?.respond(accept) ?? Promise.resolve(),
    end: () => controller.current?.end() ?? Promise.resolve(),
    publish: (
      kind: "video" | "audio",
      on: boolean,
      avatarMask = false,
      expectedGroup?: { id: string; revision: number },
    ) =>
      controller.current?.publish(kind, on, avatarMask, expectedGroup) ??
      Promise.resolve(null),
  };
}
