import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { createAdultAvatar, animateAdult } from "./adultAvatar";
import { BAR_SEATS } from "./seats";
import { INTENTIONS } from "./avatarStyle";
import { appearanceKey } from "./avatarStyle";
import { createPlayObjects } from "./playObjects";
import type { PlayState } from "./play";
import {
  ROOMS,
  inside,
  safeStep,
  planRoute,
  distance,
  type Person,
  type Point,
} from "./model";

type Props = {
  play: PlayState;
  playControls: ReactNode;
  destination: Point;
  bubble?: ReactNode;
  bubbleOwner?: string;
  self: Person;
  people: Person[];
  onMove: (point: Point) => void;
  onSelect: (id: string) => void;
  frozen: boolean;
  low: boolean;
};
export function GarageScene(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    live = useRef(props),
    target = useRef(props.self.position),
    labels = useRef(new Map<string, HTMLButtonElement>());
  const [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState(false),
    [blocked, setBlocked] = useState(false);
  live.current = props;
  useEffect(() => {
    target.current = props.self.position;
  }, [props.self.id, props.self.room]);
  useEffect(() => {
    target.current = props.destination;
  }, [props.destination]);
  useEffect(() => {
    const el = host.current!;
    let active = true,
      frame = 0,
      last = performance.now(),
      lastEmit = 0,
      wasBlocked = false,
      lastPlan = 0;
    let route: Point[] = [],
      plannedTarget: Point | null = null;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, props.low ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(0, 10, 20 / 3, 0, 0.1, 100);
    camera.position.z = 10;
    scene.add(new THREE.HemisphereLight(0xffeed7, 0x554635, 2.5));
    const light = new THREE.DirectionalLight(0xffe1b2, 3);
    light.position.set(-3, 7, 6);
    scene.add(light);
    const toys = createPlayObjects(scene);
    const reducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    type Actor = {
      group: THREE.Group;
      model: THREE.Group;
      position: Point;
      avatar: number;
      appearance: string;
    };
    const actors = new Map<string, Actor>(),
      pending = new Set<string>();
    const materials = new Set<THREE.Material>(),
      geometries = new Set<THREE.BufferGeometry>();
    function remove(id: string) {
      const a = actors.get(id);
      if (a) {
        a.group.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            geometries.delete(o.geometry);
            for (const m of Array.isArray(o.material)
              ? o.material
              : [o.material]) {
              m.dispose();
              materials.delete(m);
            }
          }
        });
        scene.remove(a.group);
        actors.delete(id);
      }
    }
    const resize = new ResizeObserver(() =>
      renderer.setSize(el.clientWidth, el.clientHeight),
    );
    resize.observe(el);
    function add(person: Person) {
      pending.add(person.id);
      try {
        const model = createAdultAvatar(person.avatar, person.appearance),
          group = new THREE.Group();
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model),
          height = box.max.y - box.min.y;
        const actorHeight = props.self.room === "bar" ? 1.04 : 1.2;
        model.scale.setScalar(actorHeight / height);
        model.position.y = (-box.min.y * actorHeight) / height;
        model.rotation.x = 0;
        group.add(model);
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(0.24, 24),
          new THREE.MeshBasicMaterial({
            color: 0x1f1913,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
          }),
        );
        shadow.scale.y = 0.26;
        shadow.position.set(0, 0.025, -0.15);
        group.add(shadow);
        group.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            geometries.add(o.geometry);
            for (const m of Array.isArray(o.material)
              ? o.material
              : [o.material])
              materials.add(m);
          }
        });
        actors.set(person.id, {
          group,
          model,
          position: { ...person.position },
          avatar: person.avatar,
          appearance: appearanceKey(person.appearance),
        });
        scene.add(group);
        setLoaded(true);
      } catch {
        setFailed(true);
      } finally {
        pending.delete(person.id);
      }
    }
    const render = (now: number) => {
      if (!active) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { self, people } = live.current,
        action = live.current.play.perform,
        performing = action?.actor === self.id && Date.now() - action.at < 2800,
        frozen = live.current.frozen || performing,
        all = [self, ...people];
      for (const [id, a] of actors) {
        const p = all.find((p) => p.id === id);
        if (
          !p ||
          p.avatar !== a.avatar ||
          appearanceKey(p.appearance) !== a.appearance
        )
          remove(id);
      }
      for (const person of all) {
        if (!actors.has(person.id)) {
          if (!pending.has(person.id)) add(person);
          continue;
        }
        const a = actors.get(person.id)!,
          isSelf = person.id === self.id;
        const seat =
          person.room === "bar"
            ? BAR_SEATS.find((s) => s.id === person.seat)
            : undefined;
        if (seat) a.position = { ...seat.point };
        const dest = seat
          ? a.position
          : isSelf
            ? frozen
              ? a.position
              : target.current
            : person.position;
        const obstacles = all
          .filter((p) => p.id !== person.id)
          .map((p) => actors.get(p.id)?.position || p.position);
        if (isSelf && !frozen && !seat) {
          if (
            plannedTarget !== target.current ||
            (wasBlocked && now - lastPlan > 500)
          ) {
            route = planRoute(a.position, target.current, obstacles, self.room);
            plannedTarget = target.current;
            lastPlan = now;
          }
          while (route.length && distance(a.position, route[0]) < 0.002)
            route.shift();
        }
        const waypoint =
          isSelf && !frozen && !seat ? route[0] || a.position : dest;
        const next = safeStep(a.position, waypoint, dt, obstacles, self.room),
          dx = next.x - a.position.x,
          dy = next.y - a.position.y,
          moving = Math.abs(dx) + Math.abs(dy) > 0.00001;
        if (isSelf) {
          const blockedNow =
            !frozen &&
            !moving &&
            Math.hypot(dest.x - a.position.x, dest.y - a.position.y) > 0.008;
          if (blockedNow !== wasBlocked) {
            wasBlocked = blockedNow;
            setBlocked(blockedNow);
          }
        }
        if (seat) a.group.rotation.y = seat.rotation;
        else if (moving) {
          const angle = Math.atan2(dx, dy * 0.8);
          const delta = Math.atan2(
            Math.sin(angle - a.group.rotation.y),
            Math.cos(angle - a.group.rotation.y),
          );
          a.group.rotation.y += delta * (1 - Math.exp(-dt * 12));
        }
        a.position = next;
        let drawX = next.x,
          drawY = next.y,
          lift = seat
            ? ((seat.point.y - seat.seatY) * 20) / 3 - 0.79 * a.model.scale.y
            : 0;
        if (
          self.room !== "bar" &&
          action?.actor === person.id &&
          !person.busy
        ) {
          const progress = Math.max(0, (Date.now() - action.at) / 2800);
          if (progress < 1 && !reducedMotion) {
            if (self.room === "living") {
              const travel = Math.sin(
                (Math.min(1, progress / 0.25, (1 - progress) / 0.25) *
                  Math.PI) /
                  2,
              );
              drawX += (0.735 - drawX) * travel;
              drawY += (0.445 - drawY) * travel;
              lift = Math.abs(Math.sin(progress * Math.PI * 4)) * 0.2;
            } else {
              lift = Math.abs(Math.sin(progress * Math.PI * 8)) * 0.16;
              a.group.rotation.y = Math.sin(progress * Math.PI * 8) * 0.65;
            }
          }
        }
        a.group.position.set(
          drawX * 10,
          ((1 - drawY) * 20) / 3 + lift,
          2 - drawY,
        );
        const label = labels.current.get(person.id);
        if (label) {
          label.style.left = `${drawX * 100}%`;
          label.style.top = `${drawY * 100 - (self.room === "bar" ? 17 : 20) - lift * 15}%`;
        }
        animateAdult(
          a.model,
          moving && !reducedMotion,
          now / 1000,
          !!seat,
          reducedMotion ? 1 : dt,
        );
        if (
          isSelf &&
          !frozen &&
          !seat &&
          ((moving && now - lastEmit > 80) ||
            (!moving && distance(self.position, next) > 0.0001))
        ) {
          lastEmit = now;
          live.current.onMove({ ...next });
        }
      }
      toys.setVisible(self.room !== "bar");
      if (self.room !== "bar")
        toys.update(
          live.current.play,
          actors,
          Date.now() + (reducedMotion ? 3000 : 0),
        );
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const key = (e: KeyboardEvent) => {
      if (
        !el.contains(document.activeElement) ||
        live.current.frozen ||
        live.current.self.seat
      )
        return;
      const delta: Record<string, Point> = {
        ArrowLeft: { x: -0.05, y: 0 },
        ArrowRight: { x: 0.05, y: 0 },
        ArrowUp: { x: 0, y: -0.05 },
        ArrowDown: { x: 0, y: 0.05 },
        a: { x: -0.05, y: 0 },
        d: { x: 0.05, y: 0 },
        w: { x: 0, y: -0.05 },
        s: { x: 0, y: 0.05 },
      };
      if (!delta[e.key]) return;
      e.preventDefault();
      const current =
        actors.get(live.current.self.id)?.position ||
        live.current.self.position;
      const p = {
        x: current.x + delta[e.key].x,
        y: current.y + delta[e.key].y,
      };
      if (inside(p, live.current.self.room)) target.current = p;
    };
    el.addEventListener("keydown", key);
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      el.removeEventListener("keydown", key);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => {
        for (const value of Object.values(m))
          if (value instanceof THREE.Texture) value.dispose();
        m.dispose();
      });
      toys.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [props.self.id, props.self.room, props.low]);
  return (
    <div
      className={`garage-scene ${props.play.lights?.on === false ? "room-dim" : ""}`}
      ref={host}
      tabIndex={0}
      role="group"
      aria-label={`${ROOMS[props.self.room || "garage"].name} navegável. Clique no piso ou use as setas para andar.`}
      onPointerDown={(e) => {
        if (
          (e.target as HTMLElement).closest("button") ||
          props.frozen ||
          props.self.seat
        )
          return;
        e.currentTarget.focus();
        const r = e.currentTarget.getBoundingClientRect(),
          p = {
            x: (e.clientX - r.left) / r.width,
            y: (e.clientY - r.top) / r.height,
          };
        if (inside(p, live.current.self.room)) target.current = p;
      }}
    >
      <img
        className="garage-backdrop"
        src={`/garage/${ROOMS[props.self.room || "garage"].image}`}
        alt={`${ROOMS[props.self.room || "garage"].name} acolhedora em estilo anos 80 com piso livre para encontrar pessoas`}
      />
      {!loaded && !failed && (
        <span className="scene-loading">Preparando seus avatares…</span>
      )}
      {[props.self, ...props.people].map((p) => (
        <button
          key={p.id}
          ref={(el) => {
            if (el) labels.current.set(p.id, el);
            else labels.current.delete(p.id);
          }}
          className={`avatar-name ${p.id === props.self.id ? "is-self" : ""}`}
          style={{
            left: `${p.position.x * 100}%`,
            top: `${p.position.y * 100 - 22}%`,
          }}
          onClick={() => props.onSelect(p.id)}
        >
          {p.appearance?.intention && p.appearance.intention !== "hidden" && (
            <span
              className="avatar-intention"
              title={INTENTIONS[p.appearance.intention].label}
              aria-label={`Procura: ${INTENTIONS[p.appearance.intention].label}`}
            >
              <span aria-hidden="true">
                {INTENTIONS[p.appearance.intention].symbol}
              </span>
              <span className="intention-tooltip">
                {INTENTIONS[p.appearance.intention].label}
              </span>
            </span>
          )}
          {p.id === props.self.id ? "Você" : p.name}
          {p.busy ? " · em conversa" : ""}
        </button>
      ))}
      {props.bubble &&
        (() => {
          const p = [props.self, ...props.people].find(
            (p) => p.id === props.bubbleOwner,
          );
          return p ? (
            <div
              className="avatar-bubble"
              role="status"
              style={{
                left: `clamp(125px, ${p.position.x * 100}%, calc(100% - 125px))`,
                top: `max(145px, ${p.position.y * 100 - 20}%)`,
              }}
            >
              {props.bubble}
            </div>
          ) : null;
        })()}
      {props.playControls}
      <span className="scene-location">
        {ROOMS[props.self.room || "garage"].name} /{" "}
        {props.self.room === "bar"
          ? "18+"
          : props.self.room === "living"
            ? "LADO B"
            : "LADO A"}
      </span>
      {blocked && (
        <span className="scene-blocked" role="status">
          Não há passagem livre agora. Escolha outro ponto do piso.
        </span>
      )}
      {failed && (
        <div className="scene-fallback" role="status">
          Seu dispositivo não carregou os avatares 3D. Você ainda pode escolher
          uma pessoa pela lista.
        </div>
      )}
    </div>
  );
}
