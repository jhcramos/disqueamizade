import { HAIRSTYLES, type HairStyle } from "./avatarHair.ts";
import { OUTFITS, cleanAccessories } from "./wardrobe.ts";
export const SKIN_COLORS = {
  original: "",
  porcelain: "#f1d0af",
  warm: "#ddb08b",
  golden: "#bf8757",
  brown: "#94603d",
  deep: "#613e2b",
};
export const HAIR_COLORS = {
  original: "",
  black: "#292526",
  brown: "#643e28",
  blonde: "#d6ae66",
  copper: "#ae5734",
  silver: "#c9c4bb",
  pink: "#c97194",
  violet: "#8053bd",
  turquoise: "#299b9b",
  lime: "#9bbd3e",
};
export const CLOTH_COLORS = {
  original: "",
  clay: "#b95836",
  olive: "#65774d",
  ocean: "#447b8c",
  plum: "#825573",
  cream: "#e7d7b6",
  charcoal: "#3c4046",
};
export const INTENTIONS = {
  hidden: { symbol: "", label: "Não mostrar" },
  dating: { symbol: "❤️", label: "Namoro" },
  friendship: { symbol: "👋", label: "Amizade" },
  chat: { symbol: "💬", label: "Bater papo" },
  fun: { symbol: "🎉", label: "Conhecer gente" },
  open: { symbol: "🌿", label: "Deixar acontecer" },
};
export type Appearance = {
  hairstyle: HairStyle;
  intention: keyof typeof INTENTIONS;
  body: "auto" | "masculine" | "feminine";
  outfit: string;
  accessories: string[];
  skin: keyof typeof SKIN_COLORS;
  hair: keyof typeof HAIR_COLORS;
  shirt: keyof typeof CLOTH_COLORS;
  pants: keyof typeof CLOTH_COLORS;
  costume: "casual" | "leaves";
  accessory: "none" | "glasses" | "crown";
};
export const DEFAULT_APPEARANCE: Appearance = {
  hairstyle: "auto",
  intention: "hidden",
  body: "auto",
  outfit: "m15",
  accessories: [],
  skin: "original",
  hair: "original",
  shirt: "original",
  pants: "original",
  costume: "casual",
  accessory: "none",
};
export function normalizeAppearance(raw: unknown): Appearance {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<Appearance>;
  const own = (map: object, key: unknown) =>
    typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key);
  return {
    hairstyle: own(HAIRSTYLES, p.hairstyle) ? p.hairstyle! : "auto",
    intention: own(INTENTIONS, p.intention) ? p.intention! : "hidden",
    body: p.body === "masculine" || p.body === "feminine" ? p.body : "auto",
    outfit:
      p.outfit === "base" ||
      p.outfit === "leaves" ||
      OUTFITS.some((o) => o.id === p.outfit)
        ? p.outfit!
        : p.costume === "leaves"
          ? "leaves"
          : "m15",
    accessories: cleanAccessories(
      p.accessories ??
        (p.accessory === "crown"
          ? ["af2"]
          : p.accessory === "glasses"
            ? ["am6"]
            : []),
    ),
    skin: own(SKIN_COLORS, p.skin) ? p.skin! : "original",
    hair: own(HAIR_COLORS, p.hair) ? p.hair! : "original",
    shirt: own(CLOTH_COLORS, p.shirt) ? p.shirt! : "original",
    pants: own(CLOTH_COLORS, p.pants) ? p.pants! : "original",
    costume: p.costume === "leaves" ? "leaves" : "casual",
    accessory:
      p.accessory === "glasses" || p.accessory === "crown"
        ? p.accessory
        : "none",
  };
}
export function appearanceKey(raw?: unknown) {
  const { intention: _intention, ...visual } = normalizeAppearance(raw);
  return JSON.stringify(visual);
}
export function readSavedAvatar() {
  try {
    const raw = JSON.parse(localStorage.getItem("garage-avatar-v1") || "{}");
    return {
      avatar:
        Number.isInteger(raw.avatar) && raw.avatar >= 0 && raw.avatar < 10
          ? raw.avatar
          : 0,
      appearance: raw.appearance
        ? normalizeAppearance(raw.appearance)
        : normalizeAppearance({
            ...DEFAULT_APPEARANCE,
            body: "masculine",
            skin: "golden",
            hairstyle: "blockquiff",
            hair: "black",
            outfit: "m22",
            accessories: [],
          }),
    };
  } catch {
    return { avatar: 0, appearance: { ...DEFAULT_APPEARANCE } };
  }
}
export function saveAvatar(avatar: number, appearance: Appearance) {
  try {
    localStorage.setItem(
      "garage-avatar-v1",
      JSON.stringify({ avatar, appearance: normalizeAppearance(appearance) }),
    );
    return true;
  } catch {
    return false;
  }
}
