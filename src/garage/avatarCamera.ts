import {
  getFaceLandmarker,
  detectFrame,
  FaceSmoother,
} from "@/vision/faceTracker";
import { computePose } from "@/vision/facePose";
import { AvatarMaskRenderer } from "./AvatarMaskRenderer";
import type { Appearance } from "./avatarStyle";
/** Full opaque avatar output. Raw capture is never returned to publication. */
export async function createAvatarCameraStream(
  raw: MediaStream,
  index: number,
  appearance: Appearance,
): Promise<MediaStream> {
  let disposed = false,
    raf = 0;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = raw;
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  let renderer: AvatarMaskRenderer | undefined;
  const close = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    raw.getTracks().forEach((t) => t.stop());
    video.pause();
    video.srcObject = null;
    renderer?.dispose();
  };
  try {
    if (raw.getVideoTracks()[0]?.readyState !== "live")
      throw Error("Câmera encerrada");
    await video.play();
    const tracker = await getFaceLandmarker();
    if (raw.getVideoTracks()[0]?.readyState !== "live")
      throw Error("Câmera encerrada");
    renderer = new AvatarMaskRenderer(index, appearance);
    const smoother = new FaceSmoother();
    let last = 0;
    const cover = () => {
      ctx.fillStyle = "#ede0ce";
      ctx.fillRect(0, 0, 640, 360);
    };
    cover();
    const render = (time: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(render);
      if (time - last < 50) return;
      last = time;
      cover();
      try {
        const frame = detectFrame(tracker, video, time);
        if (frame) {
          const smoothed = smoother.push(frame)!;
          renderer!.draw(ctx, computePose(smoothed, 640, 360));
        } else {
          smoother.reset();
          ctx.fillStyle = "#66505f";
          ctx.font = "16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Posicione o rosto para usar seu avatar", 320, 180);
        }
      } catch {
        cover();
      }
    };
    raf = requestAnimationFrame(render);
    const output = canvas.captureStream(20),
      track = output.getVideoTracks()[0],
      stop = track.stop.bind(track);
    track.stop = () => {
      close();
      stop();
    };
    raw
      .getVideoTracks()[0]
      .addEventListener("ended", () => track.stop(), { once: true });
    return output;
  } catch (e) {
    close();
    throw e;
  }
}
