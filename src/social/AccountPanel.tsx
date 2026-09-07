import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, UserPlus, X } from "lucide-react";
import { supabase } from "@/services/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { AvatarPortrait } from "@/garage/AvatarPortrait";
import { readSavedAvatar, saveAvatar } from "@/garage/avatarStyle";
import {
  socialService,
  socialConfigured,
  socialError,
  type SavedLook,
  type SocialProfile,
} from "./service";
import "./social.css";
type Props = {
  look?: SavedLook;
  nickname?: string;
  onRestore?: (look: SavedLook) => void;
  onClose?: () => void;
};
export function AccountContent({
  look: provided,
  nickname = "",
  onRestore,
  onClose,
}: Props) {
  const [localLook] = useState(readSavedAvatar),
    look = provided || localLook;
  const user = useAuthStore((s) => s.user),
    registered = !!user && !user.is_anonymous;
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [data, setData] = useState<Awaited<
    ReturnType<typeof socialService.load>
  > | null>(null);
  const [display, setDisplay] = useState(nickname),
    [handle, setHandle] = useState(""),
    [bio, setBio] = useState(""),
    [interests, setInterests] = useState(""),
    [accepts, setAccepts] = useState(true);
  const [query, setQuery] = useState(""),
    [found, setFound] = useState<SocialProfile | null>(null);
  const activeId = useRef(user?.id);
  activeId.current = user?.id;
  async function refresh(hydrate = false) {
    if (!user || user.is_anonymous) return;
    const id = user.id;
    const next = await socialService.load(id);
    if (activeId.current !== id) return;
    setData(next);
    if (hydrate && next.profile) {
      setDisplay(next.profile.display_name);
      setHandle(next.profile.handle);
      setBio(next.profile.bio);
      setInterests(next.profile.interests.join(", "));
      setAccepts(next.profile.accepts_requests);
    }
  }
  useEffect(() => {
    setData(null);
    setFound(null);
    setError("");
    setNotice("");
    setDisplay(nickname);
    setHandle("");
    setBio("");
    setInterests("");
    setAccepts(true);
    if (!registered) return;
    void refresh(true).catch((e) => setError(socialError(e)));
    const timer = window.setInterval(() => {
      void refresh().catch(() => {});
    }, 30000);
    return () => window.clearInterval(timer);
  }, [user?.id, registered]);
  async function act(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (e) {
      setError(socialError(e));
    } finally {
      setBusy(false);
    }
  }
  async function authenticate() {
    await act(async () => {
      saveAvatar(look.avatar, look.appearance);
      const redirect = `${window.location.origin}/minha-conta`;
      const r = user?.is_anonymous
        ? await supabase.auth.updateUser(
            { email: email.trim() },
            { emailRedirectTo: redirect },
          )
        : await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { emailRedirectTo: redirect, shouldCreateUser: true },
          });
      if (r.error) throw r.error;
      setNotice(
        "Confira seu e-mail e abra o link para continuar. Seu avatar permanece neste aparelho. Depois, clique em Salvar perfil e avatar.",
      );
    });
  }
  return (
    <div className="social-content">
      <header className="social-header">
        <div>
          <p className="social-kicker">SEU LUGAR NA CASA</p>
          <h1>
            {registered ? "Meu perfil e amigos" : "Leve essa amizade com você."}
          </h1>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Fechar perfil">
            <X />
          </button>
        )}
      </header>
      {!registered ? (
        <>
          <div className="social-welcome">
            <div className="social-avatar">
              <AvatarPortrait
                index={look.avatar}
                appearance={look.appearance}
              />
            </div>
            <div>
              <h2>Esse personagem é seu.</h2>
              <p>
                Crie uma conta gratuita para guardar seu avatar e reencontrar
                quem você conheceu aqui.
              </p>
              <p>Você pode continuar explorando sem cadastro.</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void authenticate();
            }}
          >
            <label>
              Seu e-mail{" "}
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </label>
            <p className="social-muted">
              Um link para entrar ou criar sua conta. Seu e-mail não aparece no
              perfil.
            </p>
            <button
              className="social-primary"
              disabled={busy || !socialConfigured}
            >
              {busy ? "Enviando…" : "Receber link por e-mail"}
            </button>
          </form>
          {!socialConfigured && (
            <p role="status">
              O cadastro ainda não está conectado nesta prévia. Você pode
              explorar a casa normalmente.
            </p>
          )}
          <p className="social-muted">
            Ao continuar, você concorda com os <Link to="/termos">Termos</Link>{" "}
            e a <Link to="/privacidade">Privacidade</Link>.
          </p>
        </>
      ) : (
        <>
          <div className="social-welcome">
            <div className="social-avatar">
              <AvatarPortrait
                index={look.avatar}
                appearance={look.appearance}
              />
            </div>
            <div>
              <h2>Seu jeito de chegar.</h2>
              <p>
                Apelido e interesses são visíveis para outras contas. Não é
                preciso usar seu nome ou foto real.
              </p>
              {data?.look && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (data.look) {
                      saveAvatar(data.look.avatar, data.look.appearance);
                      onRestore?.(data.look);
                      setNotice("Avatar da conta restaurado neste aparelho.");
                    }
                  }}
                >
                  Usar avatar salvo na conta
                </button>
              )}
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                if (!user) return;
                await socialService.save(
                  {
                    id: user.id,
                    display_name: display.trim(),
                    handle: handle.toLowerCase(),
                    bio: bio.trim(),
                    interests: interests
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean)
                      .slice(0, 5),
                    accepts_requests: accepts,
                  },
                  look,
                );
                saveAvatar(look.avatar, look.appearance);
                await refresh();
                setNotice("Perfil e avatar salvos na sua conta.");
              });
            }}
          >
            <div className="social-fields">
              <label>
                Apelido
                <input
                  required
                  maxLength={24}
                  value={display}
                  onChange={(e) => setDisplay(e.target.value)}
                />
              </label>
              <label>
                Seu @identificador
                <input
                  required
                  pattern="[a-z0-9_]{3,24}"
                  minLength={3}
                  maxLength={24}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  placeholder="bia_vinil"
                />
                <small>3–24 letras sem acentos, números ou _.</small>
              </label>
            </div>
            <label>
              Uma frase sobre você <span>(opcional)</span>
              <textarea
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Sempre aceito uma boa conversa sobre música."
              />
            </label>
            <label>
              Até cinco interesses, separados por vírgula{" "}
              <span>(opcional)</span>
              <input
                maxLength={145}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Música, cinema, viagens"
              />
            </label>
            <label className="social-check">
              <input
                type="checkbox"
                checked={accepts}
                onChange={(e) => setAccepts(e.target.checked)}
              />
              Aceitar pedidos de amizade
            </label>
            <button className="social-primary" disabled={busy}>
              <Save size={18} />
              {busy ? "Salvando…" : "Salvar perfil e avatar"}
            </button>
          </form>
          <section className="social-friends">
            <h2>Gente para reencontrar.</h2>
            <p>
              Amizade só começa depois do aceite. Sua localização na casa não
              aparece aqui.
            </p>
            {!data?.profile ? (
              <p>Salve seu perfil para começar a adicionar amigos.</p>
            ) : (
              <>
                <form
                  className="social-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(async () => {
                      setFound(null);
                      const p = await socialService.find(query);
                      if (p && p.id !== user?.id) setFound(p);
                      else
                        setNotice(
                          "Perfil não encontrado. Confira o identificador.",
                        );
                    });
                  }}
                >
                  <label>
                    Buscar pelo @identificador
                    <input
                      required
                      value={query}
                      maxLength={25}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="@bia_vinil"
                    />
                  </label>
                  <button disabled={busy}>Buscar</button>
                </form>
                {found && (
                  <div className="social-person">
                    <div>
                      <strong>{found.display_name}</strong>
                      <small>@{found.handle}</small>
                      <p>{found.bio}</p>
                    </div>
                    <button
                      disabled={
                        busy ||
                        !found.accepts_requests ||
                        data.friends.some(
                          (f) =>
                            f.requester === found.id ||
                            f.recipient === found.id,
                        )
                      }
                      onClick={() =>
                        void act(async () => {
                          await socialService.request(user!.id, found.id);
                          await refresh();
                          setFound(null);
                          setNotice(
                            "Pedido enviado. A amizade depende do aceite.",
                          );
                        })
                      }
                    >
                      <UserPlus size={16} />
                      Adicionar
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          await socialService.block(user!.id, found.id);
                          setFound(null);
                          await refresh();
                          setNotice("Perfil bloqueado.");
                        })
                      }
                    >
                      Bloquear
                    </button>
                  </div>
                )}
                {!data.friends.length && (
                  <p className="social-muted">
                    Ainda não há pedidos ou amizades. Peça o @ de alguém na
                    sala.
                  </p>
                )}
                {data.friends.map((f) => {
                  const peer =
                    f.requester === user!.id ? f.recipient : f.requester;
                  const p = data.profiles.find((x) => x.id === peer);
                  return (
                    <div className="social-person" key={f.id}>
                      <div>
                        <strong>{p?.display_name || "Perfil"}</strong>
                        <small>
                          {p ? "@" + p.handle : ""} ·{" "}
                          {f.status === "accepted"
                            ? "Amigos"
                            : f.recipient === user!.id
                              ? "Quer ser seu amigo"
                              : "Aguardando aceite"}
                        </small>
                      </div>
                      {f.status === "pending" && f.recipient === user!.id && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void act(async () => {
                              await socialService.accept(f.id);
                              await refresh();
                            })
                          }
                        >
                          Aceitar
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await socialService.remove(f.id);
                            await refresh();
                          })
                        }
                      >
                        {f.status === "accepted"
                          ? "Remover"
                          : f.recipient === user!.id
                            ? "Recusar"
                            : "Cancelar pedido"}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await socialService.block(user!.id, peer);
                            await refresh();
                          })
                        }
                      >
                        Bloquear
                      </button>
                    </div>
                  );
                })}
                {!!data.blocks.length && (
                  <details>
                    <summary>Perfis bloqueados ({data.blocks.length})</summary>
                    {data.blocks.map((b, i) => (
                      <div className="social-person" key={b.target}>
                        <span>Perfil bloqueado {i + 1}</span>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void act(async () => {
                              await socialService.unblock(user!.id, b.target);
                              await refresh();
                              setNotice(
                                "Desbloqueado. A amizade não foi restaurada.",
                              );
                            })
                          }
                        >
                          Desbloquear
                        </button>
                      </div>
                    ))}
                  </details>
                )}
              </>
            )}
          </section>
        </>
      )}
      {registered && !onClose && (
        <button
          disabled={busy}
          onClick={() =>
            void act(async () => {
              const result = await supabase.auth.signOut();
              if (result.error) throw result.error;
              useAuthStore.setState({
                user: null,
                profile: null,
                isGuest: false,
              });
            })
          }
        >
          Sair da conta
        </button>
      )}
      {notice && (
        <p className="social-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="social-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function AccountModal(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="social-dialog" onCancel={props.onClose}>
      <AccountContent {...props} />
    </dialog>
  );
}
export default function AccountPage() {
  const [look, setLook] = useState(readSavedAvatar);
  return (
    <main className="social-page">
      <Link className="social-back" to="/garagem">
        <ArrowLeft size={18} />
        Voltar para a casa
      </Link>
      <AccountContent look={look} onRestore={setLook} />
    </main>
  );
}
