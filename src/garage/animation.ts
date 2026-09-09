import { AnimationClip } from "three";
/** Kenney clips are sparse. Fill missing channels from the standing rest pose,
 * otherwise a walk can leave legs in its final pose when transitioning to idle. */
export function completeClip(
  clips: AnimationClip[],
  name: string,
): AnimationClip | undefined {
  const clip = AnimationClip.findByName(clips, name),
    rest = AnimationClip.findByName(clips, "static");
  if (!clip) return undefined;
  const used = new Set(clip.tracks.map((t) => t.name));
  return new AnimationClip(name, clip.duration, [
    ...clip.tracks,
    ...(rest?.tracks.filter((t) => !used.has(t.name)) || []),
  ]);
}
