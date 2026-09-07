import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  BALL_START,
  CUSHION_START,
  playPosition,
  type PlayState,
} from "./play";
export function createPlayObjects(scene: THREE.Scene) {
  const geometry = new THREE.IcosahedronGeometry(0.17, 1),
    positions = geometry.getAttribute("position"),
    colors = [];
  for (let i = 0; i < positions.count; i++) {
    const c = new THREE.Color(
      Math.floor(i / 3) % 7 === 0 ? 0x3b3330 : 0xfff2da,
    );
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const ball = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      flatShading: true,
    }),
  );
  const cushion = new THREE.Mesh(
    new RoundedBoxGeometry(0.46, 0.19, 0.3, 3, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xc57447, roughness: 1 }),
  );
  const ballShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.19, 20),
    new THREE.MeshBasicMaterial({
      color: 0x21180e,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
  );
  const cushionShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 20),
    new THREE.MeshBasicMaterial({
      color: 0x21180e,
      transparent: true,
      opacity: 0.19,
      depthWrite: false,
    }),
  );
  for (const mesh of [ballShadow, cushionShadow]) mesh.scale.y = 0.28;
  scene.add(ball, cushion, ballShadow, cushionShadow);
  return {
    update(
      state: PlayState,
      actors: Map<string, { group: THREE.Group }>,
      now: number,
    ) {
      const b = playPosition(state.ball, BALL_START, now),
        bt = state.ball
          ? Math.max(0, Math.min(1, (now - state.ball.at) / 1100))
          : 1;
      ball.position.set(
        b.x * 10,
        ((1 - b.y) * 20) / 3 +
          0.16 +
          Math.abs(Math.sin(bt * Math.PI * 3)) * 0.36 * (1 - bt),
        2 - b.y,
      );
      ball.rotation.set(bt * 7, 0, bt * 5);
      ballShadow.position.set(b.x * 10, ((1 - b.y) * 20) / 3, 1.9 - b.y);
      const owner = state.cushion?.on
        ? actors.get(state.cushion.actor)
        : undefined;
      if (owner) {
        cushion.position
          .copy(owner.group.position)
          .add(new THREE.Vector3(0.28, 0.55, 0.18));
        cushion.rotation.set(0.4, 0, 0.25);
        cushionShadow.visible = false;
      } else {
        const c = playPosition(state.cushion, CUSHION_START, now),
          ct =
            state.cushion && !state.cushion.on
              ? Math.max(0, Math.min(1, (now - state.cushion.at) / 1100))
              : 1;
        cushion.position.set(
          c.x * 10,
          ((1 - c.y) * 20) / 3 + 0.1 + Math.sin(ct * Math.PI) * 0.95,
          2.05 - c.y,
        );
        cushion.rotation.set(0.35, ct * Math.PI * 2, 0.12);
        cushionShadow.visible = true;
        cushionShadow.position.set(c.x * 10, ((1 - c.y) * 20) / 3, 1.9 - c.y);
      }
    },
    dispose() {
      for (const mesh of [ball, cushion, ballShadow, cushionShadow]) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    },
  };
}
