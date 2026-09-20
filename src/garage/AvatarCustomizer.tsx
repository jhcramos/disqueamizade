import { AVATAR_PRESETS, presetAppearance } from "./avatarPresets";
import { HAIRSTYLES } from "./avatarHair";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Glasses,
  Scissors,
  Palette,
  RotateCcw,
  Shirt,
  UserRound,
  X,
} from "lucide-react";
import { AvatarPortrait } from "./AvatarPortrait";
import {
  OUTFITS,
  ACCESSORIES,
  toggleAccessory,
  type Collection,
} from "./wardrobe";
import { AVATARS } from "./model";
import {
  INTENTIONS,
  CLOTH_COLORS,
  HAIR_COLORS,
  normalizeAppearance,
  SKIN_COLORS,
  type Appearance,
} from "./avatarStyle";
const LABELS: Record<string, string> = {
  original: "Original",
  violet: "Violeta",
  turquoise: "Turquesa",
  lime: "Lima",
  porcelain: "Clara",
  warm: "Quente",
  golden: "Dourada",
  brown: "Castanha",
  deep: "Escura",
  black: "Preto",
  blonde: "Loiro",
  copper: "Ruivo",
  silver: "Prateado",
  pink: "Rosa",
  clay: "Terracota",
  olive: "Oliva",
  ocean: "Azul",
  plum: "Ameixa",
  cream: "Creme",
  charcoal: "Grafite",
};
type Props = {
  avatar: number;
  appearance: Appearance;
  onApply: (avatar: number, look: Appearance) => void;
  onClose: () => void;
  low?: boolean;
  onLow?: (value: boolean) => void;
};
export function AvatarCustomizer({
  avatar,
  appearance,
  onApply,
  onClose,
  low,
  onLow,
}: Props) {
  const [model, setModel] = useState(avatar),
    [look, setLook] = useState(() => normalizeAppearance(appearance)),
    [tab, setTab] = useState<
      "model" | "colors" | "outfit" | "accessories" | "hair"
    >("outfit"),
    [angle, setAngle] = useState(0);
  const [collection, setCollection] = useState<Collection>("masculine");
  const [page, setPage] = useState(0);
  const root = useRef<HTMLElement>(null);
  const catalogCount = (tab === "outfit" ? OUTFITS : ACCESSORIES).filter(
    (item) => item.collection === collection,
  ).length;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => before?.focus();
  }, []);
  function palette(
    label: string,
    field: "skin" | "hair" | "shirt" | "pants",
    colors: Record<string, string>,
  ) {
    return (
      <fieldset className="avatar-color-field">
        <legend>{label}</legend>
        <div>
          {Object.entries(colors).map(([key, color]) => (
            <button
              key={key}
              type="button"
              aria-label={`${label}: ${LABELS[key]}`}
              title={LABELS[key]}
              aria-pressed={look[field] === key}
              className="avatar-swatch"
              style={{
                background:
                  color || "linear-gradient(135deg,#efdbc0 50%,#8b7060 50%)",
              }}
              onClick={() => setLook({ ...look, [field]: key })}
            >
              {look[field] === key && <Check size={16} />}
            </button>
          ))}
        </div>
        <small>{LABELS[look[field]]}</small>
      </fieldset>
    );
  }
  return (
    <div className="avatar-editor-backdrop">
      <section
        ref={root}
        className="garage-settings avatar-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
          if (e.key === "Tab") {
            const items = Array.from(
                root.current?.querySelectorAll<HTMLElement>("button,input") ||
                  [],
              ).filter((el) => !(el as HTMLButtonElement).disabled),
              first = items[0],
              last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <div>
            <span className="eyebrow">BLOCO POP · SEU AVATAR</span>
            <h2 id="avatar-title">Seu jeito de chegar.</h2>
          </div>
          <button aria-label="Fechar personalizador" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="avatar-editor-layout">
          <div className="avatar-mirror">
            <span className="avatar-preview-label">
              PRÉVIA · MODELO {String(model + 1).padStart(2, "0")}
            </span>
            <div
              className="avatar-preview-model"
              aria-label="Prévia do avatar personalizado"
            >
              <AvatarPortrait
                index={model}
                appearance={look}
                rotation={(angle * Math.PI) / 2 + 0.12}
              />
            </div>
            <div className="avatar-turn">
              <button
                aria-label="Girar avatar para a esquerda"
                onClick={() => setAngle((angle + 3) % 4)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>{["Frente", "Perfil", "Costas", "Perfil"][angle]}</span>
              <button
                aria-label="Girar avatar para a direita"
                onClick={() => setAngle((angle + 1) % 4)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <p>
              {look.outfit === "base"
                ? "Sua base · crie seu visual."
                : OUTFITS.find((o) => o.id === look.outfit)?.name ||
                  "Jardim · folhas"}
            </p>
          </div>
          <div className="avatar-editor-options">
            <nav aria-label="Opções do personalizador">
              {(
                [
                  ["model", "Modelo", UserRound],
                  ["hair", "Cabelos", Scissors],
                  ["colors", "Cores", Palette],
                  ["outfit", "Roupas", Shirt],
                  ["accessories", "Acessórios", Glasses],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  aria-pressed={tab === id}
                  onClick={() => {
                    setTab(id);
                    setPage(0);
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
            {tab === "model" && (
              <>
                <h3>Escolha sua base.</h3>
                <p>
                  Cinco modelos masculinos e cinco femininos. Todas as peças
                  combinam com qualquer modelo.
                </p>
                <div className="avatar-collections" aria-label="Silhueta">
                  {(
                    [
                      ["auto", "Do modelo"],
                      ["masculine", "Reta"],
                      ["feminine", "Curvilínea"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={look.body === id}
                      onClick={() => setLook({ ...look, body: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="avatar-picker editor-model-picker">
                  {AVATARS.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Modelo ${i + 1}`}
                      aria-pressed={model === i}
                      className={model === i ? "selected" : ""}
                      onClick={() => {
                        setModel(i);
                        setLook({
                          ...presetAppearance(i),
                          intention: look.intention,
                        });
                      }}
                    >
                      <AvatarPortrait index={i} />
                      <span>{AVATAR_PRESETS[i].name}</span>
                      {model === i && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === "hair" && (
              <>
                <h3>Um corte com a sua cara.</h3>
                <p>
                  Escolha o comprimento e o estilo, sem trocar seu personagem.
                </p>
                <div className="avatar-hair-catalog">
                  {Object.entries(HAIRSTYLES).map(([id, label]) => (
                    <button
                      key={id}
                      aria-label={`Corte: ${label}`}
                      aria-pressed={look.hairstyle === id}
                      onClick={() =>
                        setLook({
                          ...look,
                          hairstyle: id as Appearance["hairstyle"],
                        })
                      }
                    >
                      <div>
                        <AvatarPortrait
                          index={model}
                          appearance={{
                            ...look,
                            hairstyle: id as Appearance["hairstyle"],
                            accessories: look.accessories.filter(
                              (x) =>
                                ACCESSORIES.find((a) => a.id === x)?.slot !==
                                "head",
                            ),
                          }}
                        />
                      </div>
                      <span>{label}</span>
                      {look.hairstyle === id && <Check size={13} />}
                    </button>
                  ))}
                </div>
                {palette("Cabelo", "hair", HAIR_COLORS)}
                <p className="avatar-hair-note">
                  As miniaturas mostram o corte sem chapéu. Seu acessório
                  continua guardado.
                </p>
              </>
            )}
            {tab === "colors" && (
              <>
                <h3>Encontre suas cores.</h3>
                <div className="avatar-palettes">
                  {palette("Pele", "skin", SKIN_COLORS)}
                  {palette("Cabelo", "hair", HAIR_COLORS)}
                  {palette("Parte de cima", "shirt", CLOTH_COLORS)}
                  {palette("Parte de baixo", "pants", CLOTH_COLORS)}
                </div>
              </>
            )}
            {(tab === "outfit" || tab === "accessories") && (
              <>
                <div className="avatar-catalog-heading">
                  <h3>
                    {tab === "outfit"
                      ? "Vista sua personalidade."
                      : "Os detalhes são seus."}
                  </h3>
                  <span>{catalogCount} por coleção</span>
                </div>
                <p>
                  {tab === "outfit"
                    ? "Escolha um look e ajuste as cores. Sem regras de gênero."
                    : "Combine até 6 acessórios. Uma peça por posição."}
                </p>
                <div className="avatar-collections" aria-label="Coleção">
                  {(
                    [
                      ["masculine", "Masculina"],
                      ["feminine", "Feminina"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={collection === id}
                      onClick={() => {
                        setCollection(id);
                        setPage(0);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setLook(
                        tab === "outfit"
                          ? { ...look, outfit: "base", costume: "casual" }
                          : { ...look, accessories: [], accessory: "none" },
                      )
                    }
                  >
                    {tab === "outfit"
                      ? "Usar roupa básica"
                      : "Remover acessórios"}
                  </button>
                </div>
                <div className="avatar-catalog">
                  {tab === "outfit"
                    ? OUTFITS.filter((o) => o.collection === collection)
                        .slice(page * 10, page * 10 + 10)
                        .map((o) => (
                          <button
                            key={o.id}
                            aria-pressed={look.outfit === o.id}
                            onClick={() =>
                              setLook({
                                ...look,
                                outfit: o.id,
                                costume: "casual",
                                shirt: "original",
                                pants: "original",
                              })
                            }
                          >
                            <AvatarPortrait
                              index={model}
                              appearance={{
                                ...look,
                                outfit: o.id,
                                accessories: [],
                                shirt: "original",
                                pants: "original",
                              }}
                            />
                            <span>{o.name}</span>
                            {look.outfit === o.id && <Check size={14} />}
                          </button>
                        ))
                    : ACCESSORIES.filter((a) => a.collection === collection)
                        .slice(page * 10, page * 10 + 10)
                        .map((a) => (
                          <button
                            key={a.id}
                            aria-pressed={look.accessories.includes(a.id)}
                            onClick={() =>
                              setLook({
                                ...look,
                                accessories: toggleAccessory(
                                  look.accessories,
                                  a.id,
                                ),
                              })
                            }
                          >
                            <AvatarPortrait
                              index={model}
                              appearance={{ ...look, accessories: [a.id] }}
                            />
                            <span>{a.name}</span>
                            {look.accessories.includes(a.id) && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}
                </div>
                <div className="avatar-catalog-pages">
                  <button
                    disabled={page === 0}
                    aria-label="Página anterior de peças"
                    onClick={() => setPage(Math.max(0, page - 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span>
                    {page * 10 + 1}–{Math.min(page * 10 + 10, catalogCount)} de{" "}
                    {catalogCount}
                  </span>
                  <button
                    disabled={(page + 1) * 10 >= catalogCount}
                    aria-label="Próxima página de peças"
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                {tab === "accessories" && (
                  <div className="avatar-selected-accessories">
                    {look.accessories.length ? (
                      look.accessories.map((id) => (
                        <button
                          key={id}
                          aria-label={`Remover ${ACCESSORIES.find((a) => a.id === id)?.name}`}
                          onClick={() =>
                            setLook({
                              ...look,
                              accessories: look.accessories.filter(
                                (x) => x !== id,
                              ),
                            })
                          }
                        >
                          {ACCESSORIES.find((a) => a.id === id)?.name}
                          <X size={12} />
                        </button>
                      ))
                    ) : (
                      <small>Nenhum acessório ainda.</small>
                    )}
                  </div>
                )}
              </>
            )}
            <fieldset className="avatar-intentions">
              <legend>
                O que você procura hoje? <small>Opcional</small>
              </legend>
              <div>
                {Object.entries(INTENTIONS).map(([id, item]) => (
                  <button
                    key={id}
                    aria-pressed={look.intention === id}
                    onClick={() =>
                      setLook({
                        ...look,
                        intention: id as Appearance["intention"],
                      })
                    }
                  >
                    <span aria-hidden="true">{item.symbol || "—"}</span>
                    {item.label}
                  </button>
                ))}
              </div>
              <p>
                Aparece junto ao seu nome. Você pode mudar ou esconder quando
                quiser.
              </p>
            </fieldset>
            <button
              className="avatar-reset"
              onClick={() => {
                setLook(presetAppearance(model));
                setAngle(0);
              }}
            >
              <RotateCcw size={14} />
              Restaurar visual
            </button>
          </div>
        </div>
        <footer className="avatar-editor-footer">
          {onLow && (
            <label>
              <input
                type="checkbox"
                checked={low}
                onChange={(e) => onLow(e.target.checked)}
              />{" "}
              Modo gráfico leve
            </label>
          )}
          <div>
            <button className="garage-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="garage-primary"
              onClick={() => onApply(model, look)}
            >
              Usar este avatar <Check size={17} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
