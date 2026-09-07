import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { completeClip } from "./animation";
import { AVATARS, inside, step, type Person, type Point } from "./model";

type Props = {
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
    target = useRef(props.self.position);
  const [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState(false);
  live.current = props;
  useEffect(() => {
    target.current = props.self.position;
  }, [props.self.id]);
  useEffect(() => {
    const el = host.current!;
    let active = true,
      frame = 0,
      last = performance.now(),
      lastEmit = 0;
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
    const loader = new GLTFLoader();
    type Actor = {
      group: THREE.Group;
      mixer: THREE.AnimationMixer;
      idle?: THREE.AnimationAction;
      walk?: THREE.AnimationAction;
      position: Point;
      avatar: number;
    };
    const actors = new Map<string, Actor>(),
      pending = new Set<string>();
    const materials = new Set<THREE.Material>(),
      geometries = new Set<THREE.BufferGeometry>();
    function remove(id: string) {
      const a = actors.get(id);
      if (a) {
        a.mixer.stopAllAction();
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
      loader.load(
        `/garage/avatars/character-${AVATARS[person.avatar]}.glb`,
        (gltf) => {
          pending.delete(person.id);
          if (!active) return;
          const model = clone(gltf.scene),
            group = new THREE.Group();
          const mixer = new THREE.AnimationMixer(model),
            idleClip = completeClip(gltf.animations, "idle"),
            walkClip = completeClip(gltf.animations, "walk");
          const idle = idleClip ? mixer.clipAction(idleClip) : undefined,
            walk = walkClip ? mixer.clipAction(walkClip) : undefined;
          idle?.play();
          mixer.update(0.01);
          model.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(model),
            height = box.max.y - box.min.y;
          model.scale.setScalar(1.1 / height);
          model.position.y = (-box.min.y * 1.1) / height;
          model.rotation.x = 0.18;
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
          walk?.play();
          walk?.setEffectiveWeight(0);
          actors.set(person.id, {
            group,
            mixer,
            idle,
            walk,
            position: { ...person.position },
            avatar: person.avatar,
          });
          scene.add(group);
          setLoaded(true);
        },
        undefined,
        () => {
          pending.delete(person.id);
          setFailed(true);
        },
      );
    }
    const render = (now: number) => {
      if (!active) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { self, people, frozen } = live.current,
        all = [self, ...people];
      for (const [id, a] of actors) {
        const p = all.find((p) => p.id === id);
        if (!p || p.avatar !== a.avatar) remove(id);
      }
      for (const person of all) {
        if (!actors.has(person.id)) {
          if (!pending.has(person.id)) add(person);
          continue;
        }
        const a = actors.get(person.id)!,
          isSelf = person.id === self.id;
        if (
          isSelf &&
          Math.hypot(
            person.position.x - a.position.x,
            person.position.y - a.position.y,
          ) > 0.035
        )
          target.current = person.position;
        const dest = isSelf
          ? frozen
            ? a.position
            : target.current
          : person.position;
        const next = step(a.position, dest, dt),
          dx = next.x - a.position.x,
          dy = next.y - a.position.y,
          moving = Math.abs(dx) + Math.abs(dy) > 0.00001;
        if (moving) a.group.rotation.y = dx < 0 ? -0.5 : 0.5;
        a.walk?.setEffectiveWeight(moving ? 1 : 0);
        a.idle?.setEffectiveWeight(moving ? 0 : 1);
        a.position = next;
        a.group.position.set(next.x * 10, ((1 - next.y) * 20) / 3, 2 - next.y);
        a.mixer.update(dt);
        if (isSelf && moving && now - lastEmit > 80) {
          lastEmit = now;
          live.current.onMove({ ...next });
        }
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const key = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement) || live.current.frozen) return;
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
      const p = {
        x: target.current.x + delta[e.key].x,
        y: target.current.y + delta[e.key].y,
      };
      if (inside(p)) target.current = p;
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
      actors.forEach((a) => a.mixer.stopAllAction());
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => {
        for (const value of Object.values(m))
          if (value instanceof THREE.Texture) value.dispose();
        m.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [props.self.id, props.low]);
  return (
    <div
      className="garage-scene"
      ref={host}
      tabIndex={0}
      role="group"
      aria-label="Garagem navegável. Clique no piso ou use as setas para andar."
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button") || props.frozen) return;
        e.currentTarget.focus();
        const r = e.currentTarget.getBoundingClientRect(),
          p = {
            x: (e.clientX - r.left) / r.width,
            y: (e.clientY - r.top) / r.height,
          };
        if (inside(p)) target.current = p;
      }}
    >
      <img
        className="garage-backdrop"
        src="/garage/garage-background.webp"
        alt="Garagem anos 80 com aparelho de som, luzes coloridas e cadeiras de praia"
      />
      {!loaded && !failed && (
        <span className="scene-loading">Preparando seus avatares…</span>
      )}
      {[props.self, ...props.people].map((p) => (
        <button
          key={p.id}
          className={`avatar-name ${p.id === props.self.id ? "is-self" : ""}`}
          style={{
            left: `${p.position.x * 100}%`,
            top: `${p.position.y * 100 - 18}%`,
          }}
          onClick={() => props.onSelect(p.id)}
        >
          {p.id === props.self.id ? "Você" : p.name}
          {p.busy ? " · em conversa" : ""}
        </button>
      ))}
      <span className="scene-location">GARAGEM / LADO A</span>
      {failed && (
        <div className="scene-fallback" role="status">
          Seu dispositivo não carregou os avatares 3D. Você ainda pode escolher
          uma pessoa pela lista.
        </div>
      )}
    </div>
  );
}
