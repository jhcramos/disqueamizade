import * as T from "three";
import { createAdultAvatar } from "./adultAvatar";
import { readSavedAvatar, type Appearance } from "./avatarStyle";
import type { FacePose } from "@/vision/facePose";
/** Uses the exact same head meshes as the walking avatar. */
export class AvatarMaskRenderer {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera = new T.OrthographicCamera(-0.36, 0.36, 0.36, -0.36, 0.1, 10);
  owner: T.Group;
  head: T.Object3D;
  constructor(index?: number, appearance?: Appearance) {
    const saved = readSavedAvatar();
    this.owner = createAdultAvatar(
      index ?? saved.avatar,
      appearance ?? saved.appearance,
    );
    this.head = this.owner.getObjectByName("avatar-head")!;
    this.head.removeFromParent();
    this.head.position.set(0, 0, 0);
    this.head.scale.setScalar(1);
    this.scene.add(this.head, new T.HemisphereLight(0xfff2de, 0x686061, 3));
    const light = new T.DirectionalLight(0xffffff, 2.5);
    light.position.set(3, 4, 5);
    this.scene.add(light);
    this.camera.position.z = 2;
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(512, 512);
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85;
  }
  draw(ctx: CanvasRenderingContext2D, pose: FacePose) {
    this.head.rotation.y = Math.max(-0.8, Math.min(0.8, pose.yaw)) * 1.1;
    for (const [side, blink] of [
      ["left", pose.blinkL],
      ["right", pose.blinkR],
    ] as const) {
      const eye = this.head.getObjectByName(`eye-${side}`);
      if (eye) eye.scale.y = Math.max(0.06, 1 - blink);
    }
    const mouth = this.head.getObjectByName("avatar-mouth");
    if (mouth) mouth.scale.y = 1 + Math.max(0, Math.min(1, pose.mouthOpen)) * 4;
    this.renderer.render(this.scene, this.camera);
    const scaleX = pose.faceW / 0.285,
      scaleY = pose.faceH / 0.27;
    ctx.save();
    ctx.translate(pose.cx, pose.cy);
    ctx.rotate(pose.roll);
    ctx.drawImage(
      this.renderer.domElement,
      -0.36 * scaleX,
      (-0.36 + 0.014) * scaleY,
      0.72 * scaleX,
      0.72 * scaleY,
    );
    ctx.restore();
  }
  dispose() {
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>();
    for (const root of [this.owner, this.head])
      root.traverse((o) => {
        if (o instanceof T.Mesh) {
          geometries.add(o.geometry);
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            materials.add(m);
        }
      });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
