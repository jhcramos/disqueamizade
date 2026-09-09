export type Collection = "masculine" | "feminine";
export type Outfit = {
  id: string;
  name: string;
  collection: Collection;
  top: string;
  bottom: string;
  color: string;
  secondary: string;
  shoes: string;
  detail: string;
};
const men = [
  ["Café & jeans", "tee", "pants", "#d6ccb7", "#405d78", "sneakers", ""],
  [
    "Expedição urbana",
    "tank",
    "cargo",
    "#65794f",
    "#b59b70",
    "boots",
    "pockets",
  ],
  [
    "Linho de domingo",
    "shirt",
    "pants",
    "#f1e4ca",
    "#a78a62",
    "sandals",
    "buttons",
  ],
  [
    "Depois do trabalho",
    "shirt",
    "pants",
    "#91acb8",
    "#343f50",
    "formal",
    "buttons",
  ],
  ["Terno terracota", "jacket", "pants", "#a7593d", "#a7593d", "formal", "tie"],
  ["Noite de gala", "jacket", "pants", "#272a32", "#272a32", "formal", "bow"],
  ["Pista retrô", "long", "pants", "#398487", "#254c65", "sneakers", "stripes"],
  ["Basquete 86", "tank", "shorts", "#d49432", "#d49432", "high", "number"],
  [
    "Corrida no parque",
    "tank",
    "shorts",
    "#b75150",
    "#363946",
    "sneakers",
    "stripes",
  ],
  [
    "Verão na varanda",
    "shirt",
    "shorts",
    "#7aa396",
    "#d5ad6d",
    "sandals",
    "buttons",
  ],
  ["Surf azul", "long", "shorts", "#397f9d", "#243e68", "sandals", "stripes"],
  ["Garagem rock", "jacket", "pants", "#303038", "#36333c", "boots", "zip"],
  [
    "Jeans sobre jeans",
    "jacket",
    "pants",
    "#6688a2",
    "#3f5a78",
    "sneakers",
    "pockets",
  ],
  [
    "Moletom aconchego",
    "hoodie",
    "pants",
    "#b38b9a",
    "#635766",
    "sneakers",
    "hood",
  ],
  ["Fita cassete", "jacket", "pants", "#a56296", "#2f5965", "high", "blocks"],
  ["Jardineiro", "overall", "pants", "#718371", "#718371", "boots", "straps"],
  [
    "Kilt contemporâneo",
    "shirt",
    "skirt",
    "#ddd0b4",
    "#746448",
    "boots",
    "plaid",
  ],
  ["Festival livre", "crop", "shorts", "#cb8354", "#785e94", "high", "fringe"],
  [
    "Orgulho em cores",
    "tee",
    "pants",
    "#e6dfce",
    "#53596b",
    "sneakers",
    "pride",
  ],
  ["Adão · folha", "leaf", "leaf", "#518345", "#437139", "bare", "leaf"],
];
const women = [
  ["Jeans favorito", "tee", "pants", "#e9d6bc", "#587d99", "sneakers", ""],
  ["Sol de sábado", "crop", "shorts", "#ba6455", "#c5a077", "sneakers", ""],
  ["Linho leve", "shirt", "pants", "#d6c798", "#eee3cb", "sandals", "buttons"],
  [
    "Alfaiataria ameixa",
    "jacket",
    "pants",
    "#80586e",
    "#80586e",
    "formal",
    "lapels",
  ],
  ["Vestido cereja", "tank", "skirt", "#ab4f52", "#ab4f52", "heels", ""],
  ["Vestido longo", "tank", "maxi", "#5d8582", "#5d8582", "sandals", "belt"],
  [
    "Encontro no café",
    "shirt",
    "midi",
    "#e8d5bd",
    "#aa7053",
    "flats",
    "buttons",
  ],
  ["Saia rodada", "tank", "flare", "#f0debd", "#9a6482", "flats", "belt"],
  [
    "Jardineira",
    "overall",
    "pants",
    "#6b87a0",
    "#6b87a0",
    "sneakers",
    "straps",
  ],
  ["Macacão noite", "tank", "pants", "#424b62", "#424b62", "heels", "belt"],
  [
    "Movimento",
    "crop",
    "leggings",
    "#8a6588",
    "#544660",
    "sneakers",
    "stripes",
  ],
  [
    "Basquete da casa",
    "tank",
    "shorts",
    "#578989",
    "#578989",
    "high",
    "number",
  ],
  ["Biquíni coral", "bikini", "brief", "#c96e5c", "#c96e5c", "bare", ""],
  [
    "Onda violeta",
    "long",
    "shorts",
    "#725c91",
    "#4d557e",
    "sandals",
    "stripes",
  ],
  ["Rock de garagem", "jacket", "skirt", "#37353d", "#773f51", "boots", "zip"],
  [
    "Moletom & short",
    "hoodie",
    "shorts",
    "#bf9c83",
    "#806c66",
    "sneakers",
    "hood",
  ],
  ["Baile de 1985", "puff", "flare", "#ab6993", "#ab6993", "heels", "bow"],
  [
    "Festival ao pôr do sol",
    "crop",
    "skirt",
    "#bb8857",
    "#a26663",
    "boots",
    "fringe",
  ],
  [
    "Vestido orgulho",
    "tank",
    "midi",
    "#e8d9bd",
    "#8e6694",
    "sneakers",
    "pride",
  ],
  ["Eva · folhas", "leaf-bikini", "leaf", "#518345", "#437139", "bare", "leaf"],
];
men.push([
  "Equipe de obra",
  "jacket",
  "cargo",
  "#efb92d",
  "#485867",
  "boots",
  "safety",
]);
women.push([
  "Mestre de obras",
  "jacket",
  "cargo",
  "#ef8437",
  "#3d5367",
  "boots",
  "safety",
]);
men.push([
  "Bloco Pop retrô",
  "jacket",
  "pants",
  "#805798",
  "#527895",
  "high",
  "blocks",
]);
women.push([
  "Bloco Pop coral",
  "jacket",
  "pants",
  "#c97560",
  "#4f7492",
  "high",
  "pockets",
]);
export const OUTFITS: Outfit[] = [men, women].flatMap((rows, g) =>
  rows.map((r, i) => ({
    id: `${g ? "f" : "m"}${i + 1}`,
    name: r[0],
    collection: g ? "feminine" : "masculine",
    top: r[1],
    bottom: r[2],
    color: r[3],
    secondary: r[4],
    shoes: r[5],
    detail: r[6],
  })),
);
export type Slot =
  | "head"
  | "face"
  | "ears"
  | "neck"
  | "hands"
  | "feet"
  | "wrist"
  | "badge"
  | "bag";
export type Accessory = {
  id: string;
  name: string;
  collection: Collection;
  slot: Slot;
  shape: string;
  color: string;
};
const maleAccessories = [
  ["Boné de garagem", "head", "cap", "#955a40"],
  ["Gorro canelado", "head", "beanie", "#596b53"],
  ["Bucket de verão", "head", "bucket", "#c2aa7c"],
  ["Chapéu jazz", "head", "fedora", "#51443b"],
  ["Óculos escuros", "face", "dark", "#302d32"],
  ["Óculos redondos", "face", "round", "#a98a54"],
  ["Aviador", "face", "aviator", "#b3a27f"],
  ["Corrente dourada", "neck", "chain", "#c5a25d"],
  ["Gravata clássica", "neck", "tie", "#794558"],
  ["Borboleta", "neck", "bow", "#302c3c"],
  ["Lenço xadrez", "neck", "scarf", "#aa7051"],
  ["Luvas sem dedos", "hands", "short", "#3d3837"],
  ["Luvas esportivas", "hands", "short", "#597a85"],
  ["Tênis branco", "feet", "sneakers", "#eee7d8"],
  ["Tênis cano alto", "feet", "high", "#9f5947"],
  ["Sapato social", "feet", "formal", "#44362f"],
  ["Coturno", "feet", "boots", "#49403a"],
  ["Sandália natural", "feet", "sandals", "#a07851"],
  ["Pulseira Pride", "wrist", "pride", "#e5b04b"],
  ["Pin trans", "badge", "trans", "#73becd"],
];
const femaleAccessories = [
  ["Tiara de veludo", "head", "band", "#8e566e"],
  ["Coroa de folhas", "head", "crown", "#688b47"],
  ["Chapéu de palha", "head", "straw", "#c9ad72"],
  ["Boina francesa", "head", "beret", "#a75547"],
  ["Óculos gatinho", "face", "cat", "#663e59"],
  ["Óculos redondos", "face", "round", "#b08b55"],
  ["Brincos de argola", "ears", "hoops", "#cda85c"],
  ["Brincos estrela", "ears", "stars", "#c8a367"],
  ["Colar de pérolas", "neck", "pearls", "#eee3ca"],
  ["Lenço de seda", "neck", "scarf", "#a5698b"],
  ["Luvas longas", "hands", "long", "#614864"],
  ["Luvas curtinhas", "hands", "short", "#ceb89c"],
  ["Tênis colorido", "feet", "sneakers", "#a07698"],
  ["Sapatilha", "feet", "flats", "#965760"],
  ["Salto baixo", "feet", "heels", "#63414b"],
  ["Bota de passeio", "feet", "boots", "#835a40"],
  ["Sandália dourada", "feet", "sandals", "#bd995d"],
  ["Bolsa transversal", "bag", "bag", "#a6754c"],
  ["Pulseira Pride", "wrist", "pride", "#ddaf59"],
  ["Pin não binário", "badge", "nonbinary", "#c3a155"],
];
maleAccessories.push([
  "Capacete de obra amarelo",
  "head",
  "hardhat",
  "#f2bd28",
]);
femaleAccessories.push([
  "Capacete de obra branco",
  "head",
  "hardhat",
  "#f0eee3",
]);
export const ACCESSORIES: Accessory[] = [
  maleAccessories,
  femaleAccessories,
].flatMap((rows, g) =>
  rows.map((r, i) => ({
    id: `${g ? "af" : "am"}${i + 1}`,
    name: r[0],
    collection: g ? "feminine" : "masculine",
    slot: r[1] as Slot,
    shape: r[2],
    color: r[3],
  })),
);
export function cleanAccessories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const selected = new Map<Slot, string>();
  for (const id of raw.slice(0, 80)) {
    const a = ACCESSORIES.find((a) => a.id === id);
    if (a) selected.set(a.slot, a.id);
  }
  return [...selected.values()].slice(-6);
}
export function toggleAccessory(ids: string[], id: string) {
  return ids.includes(id)
    ? ids.filter((x) => x !== id)
    : cleanAccessories([...ids, id]);
}
