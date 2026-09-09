import {
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  type Appearance,
} from "./avatarStyle.ts";
export const AVATAR_PRESETS: { name: string; appearance: Appearance }[] = [
  [
    "Caio · Bloco Pop",
    {
      body: "masculine",
      skin: "golden",
      hairstyle: "blockquiff",
      hair: "black",
      outfit: "m22",
      accessories: [],
    },
  ],
  [
    "Davi · afro",
    {
      body: "masculine",
      skin: "deep",
      hairstyle: "afro",
      hair: "black",
      outfit: "m8",
      accessories: ["am8"],
    },
  ],
  [
    "Ícaro · punk",
    {
      body: "masculine",
      skin: "porcelain",
      hairstyle: "liberty",
      hair: "lime",
      outfit: "m12",
      accessories: ["am19"],
    },
  ],
  [
    "Rui · careca",
    {
      body: "masculine",
      skin: "brown",
      hairstyle: "bald",
      outfit: "m21",
      accessories: [],
    },
  ],
  [
    "Noah · ondas",
    {
      body: "masculine",
      skin: "golden",
      hairstyle: "medium",
      hair: "silver",
      outfit: "m3",
      accessories: ["am6"],
    },
  ],
  [
    "Lia · Bloco Pop",
    {
      body: "feminine",
      skin: "brown",
      hairstyle: "blockcurls",
      hair: "brown",
      outfit: "f22",
      accessories: ["af7"],
    },
  ],
  [
    "Nina · afro",
    {
      body: "feminine",
      skin: "deep",
      hairstyle: "afro",
      hair: "black",
      outfit: "f19",
      accessories: ["af7"],
    },
  ],
  [
    "Maya · punk",
    {
      body: "feminine",
      skin: "porcelain",
      hairstyle: "punk",
      hair: "violet",
      outfit: "f15",
      accessories: ["af19"],
    },
  ],
  [
    "Sol · careca",
    {
      body: "feminine",
      skin: "golden",
      hairstyle: "bald",
      outfit: "f21",
      accessories: ["af8"],
    },
  ],
  [
    "Bia · azul",
    {
      body: "feminine",
      skin: "brown",
      hairstyle: "long",
      hair: "turquoise",
      outfit: "f2",
      accessories: ["af13"],
    },
  ],
].map(([name, appearance]) => ({
  name: name as string,
  appearance: normalizeAppearance({
    ...DEFAULT_APPEARANCE,
    ...(appearance as Partial<Appearance>),
  }),
}));
export function presetAppearance(index: number): Appearance {
  return normalizeAppearance(
    AVATAR_PRESETS[index]?.appearance ?? AVATAR_PRESETS[0].appearance,
  );
}
