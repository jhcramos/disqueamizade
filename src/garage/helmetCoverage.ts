import type { FacePose } from "@/vision/facePose";
/** Reject views where a single front-facing helmet cannot safely cover the face. */
export function safeHelmetPose(pose: FacePose, w: number, h: number) {
  const { box } = pose;
  return (
    [pose.cx, pose.cy, pose.faceW, pose.faceH, pose.roll, pose.yaw].every(
      Number.isFinite,
    ) &&
    pose.faceW >= 48 &&
    pose.faceH >= 60 &&
    Math.abs(pose.yaw) <= 0.6 &&
    Math.abs(pose.roll) <= 1.1 &&
    !!box &&
    box.x >= 4 &&
    box.y >= 4 &&
    box.x + box.w <= w - 4 &&
    box.y + box.h <= h - 4
  );
}
