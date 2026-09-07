import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { completeClip } from "./animation";
import { AVATARS } from "./model";
const cache = new Map<number, Promise<string>>();
let queue = Promise.resolve();
function portrait(index: number): Promise<string> {
  const cached = cache.get(index);
  if (cached) return cached;
  const promise = new Promise<string>((resolve, reject) => {
    queue = queue
      .then(async () => {
        let renderer: THREE.WebGLRenderer | undefined;
        try {
          const gltf = await new GLTFLoader().loadAsync(
            `/garage/avatars/character-${AVATARS[index]}.glb`,
          );
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
          renderer.setSize(160, 180);
          renderer.setPixelRatio(1);
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 0.85;
          const scene = new THREE.Scene(),
            model = gltf.scene;
          const mixer = new THREE.AnimationMixer(model),
            clip = completeClip(gltf.animations, "idle");
          if (clip) {
            mixer.clipAction(clip).play();
            mixer.update(0.5);
          }
          model.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(model),
            height = box.max.y - box.min.y;
          model.scale.setScalar(2 / height);
          model.position.y = (-box.min.y * 2) / height;
          model.rotation.y = 0.12;
          scene.add(model);

          scene.add(new THREE.HemisphereLight(0xfff2de, 0x686061, 3));
          const light = new THREE.DirectionalLight(0xffffff, 2.5);
          light.position.set(3, 4, 5);
          scene.add(light);
          const camera = new THREE.PerspectiveCamera(30, 160 / 180, 0.1, 20);
          camera.position.set(0, 1.6, 4.4);
          camera.lookAt(0, 1.05, 0);
          renderer.render(scene, camera);
          resolve(renderer.domElement.toDataURL("image/png"));
          model.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.geometry.dispose();
              for (const m of Array.isArray(o.material)
                ? o.material
                : [o.material]) {
                for (const v of Object.values(m))
                  if (v instanceof THREE.Texture) v.dispose();
                m.dispose();
              }
            }
          });
        } catch (e) {
          reject(e);
        } finally {
          renderer?.dispose();
          renderer?.forceContextLoss();
        }
      })
      .catch(() => {});
  });
  cache.set(index, promise);
  return promise;
}
export function AvatarPortrait({ index }: { index: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    void portrait(index)
      .then((s) => {
        if (active) setSrc(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [index]);
  return src ? (
    <img src={src} alt="" />
  ) : (
    <span className="portrait-loading" aria-hidden="true">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}
