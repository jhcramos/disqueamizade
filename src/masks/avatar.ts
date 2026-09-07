import type { MaskDef } from "./types";
import type { AvatarMaskRenderer } from "@/garage/AvatarMaskRenderer";
let renderer: AvatarMaskRenderer | null = null;
let loading: Promise<void> | null = null;
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
  description: "Seu Bloco Pop · salve o visual na garagem",
  opaqueBackground: true,
  preload: () => {
    if (renderer) {
      keepAlive();
      return Promise.resolve();
    }
    return (loading ||= import("@/garage/AvatarMaskRenderer")
      .then(({ AvatarMaskRenderer }) => {
        renderer = new AvatarMaskRenderer();
        keepAlive();
      })
      .catch((e) => {
        loading = null;
        throw e;
      }));
  },
  render: ({ ctx, pose }) => {
    if (!renderer) {
      void avatarMask.preload();
      throw new Error("Avatar carregando");
    }
    keepAlive();
    renderer.draw(ctx, pose);
  },
};
