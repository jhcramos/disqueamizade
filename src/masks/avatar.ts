import {readCameraAvatar} from '@/garage/cameraAvatar';
import {appearanceKey} from '@/garage/avatarStyle';
import type { MaskDef } from "./types";
import type { AvatarMaskRenderer } from "@/garage/AvatarMaskRenderer";
let renderer: AvatarMaskRenderer | null = null;
let loading: Promise<void> | null = null;
let lookKey="";
const key=()=>{const a=readCameraAvatar();return `${a.avatar}:${appearanceKey(a.appearance)}`;};
let timeout: ReturnType<typeof setTimeout> | undefined;
function keepAlive() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    renderer?.dispose();
    renderer = null;
    loading = null;
  }, 2000);
}
export const avatarMask: MaskDef = {
  id: "meu-avatar",
  name: "Meu avatar",
  icon: "🧑‍🎨",
  description: "Capacete Bloco Pop · corpo e ambiente reais",
  opaqueBackground: false,
  preload: () => {
    if (renderer && lookKey===key()) {
      keepAlive();
      return Promise.resolve();
    }
    if(renderer){renderer.dispose();renderer=null;loading=null;}
    return (loading ||= import("@/garage/AvatarMaskRenderer")
      .then(({ AvatarMaskRenderer }) => {
        renderer = new AvatarMaskRenderer();lookKey=key();
        keepAlive();
      })
      .catch((e) => {
        loading = null;
        throw e;
      }));
  },
  render: ({ ctx, pose }) => {
    if (!renderer || lookKey!==key()) {
      void avatarMask.preload();
      throw new Error("Avatar carregando");
    }
    keepAlive();
    renderer.draw(ctx, pose);
  },
};
