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
  const [authMode, setAuthMode] = useState<"create" | "login">("create");
  const [sentTo, setSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [tab, setTab] = useState<"profile" | "friends">("profile");
  const [friendFilter, setFriendFilter] = useState<
    "accepted" | "received" | "sent"
  >("accepted");
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
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
      const r =
        user?.is_anonymous && authMode === "create"
          ? await supabase.auth.updateUser(
              { email: email.trim() },
              { emailRedirectTo: redirect },
            )
          : await supabase.auth.signInWithOtp({
              email: email.trim(),
              options: {
                emailRedirectTo: redirect,
                shouldCreateUser: authMode === "create",
              },
            });
      if (r.error) throw r.error;
      setSentTo(email.trim());
      setCooldown(60);
    });
  }
  return (
    <div className={`social-content ${registered ? "is-member" : "is-signin"}`}>
      <header className="social-header">
        <div>
          <p className="social-kicker">SEU LUGAR NA CASA</p>
          <h1>
            {registered
              ? "Seu canto na casa."
              : authMode === "login"
                ? "Bom ter você de volta."
                : "Seu avatar. Sua turma."}
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
          <div className="social-auth-layout">
            <div className="social-auth-art">
              <div className="social-avatar">
                <AvatarPortrait
                  index={look.avatar}
                  appearance={look.appearance}
                />
              </div>
              <h2>
                Guarde seu jeito.
                <br />
                Reencontre sua turma.
              </h2>
              <ul>
                <li>Seu avatar salvo na conta</li>
                <li>Um @ para ser encontrado</li>
                <li>Amigos que ficam depois do papo</li>
              </ul>
              <small>Você pode continuar explorando sem cadastro.</small>
            </div>
            <div className="social-auth-form">
              <nav className="social-tabs" aria-label="Acesso à conta">
                <button
                  type="button"
                  aria-pressed={authMode === "create"}
                  onClick={() => {
                    setAuthMode("create");
                    setSentTo("");
                    setError("");
                  }}
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  aria-pressed={authMode === "login"}
                  onClick={() => {
                    setAuthMode("login");
                    setSentTo("");
                    setError("");
                  }}
                >
                  Já tenho conta
                </button>
              </nav>
              {sentTo ? (
                <div className="social-email-sent" role="status">
                  <span aria-hidden="true">✉</span>
                  <h2>Confira seu e-mail.</h2>
                  <p>
                    Enviamos um link para <strong>{sentTo}</strong>. Abra o link
                    para{" "}
                    {authMode === "create" ? "confirmar sua conta" : "entrar"}.
                  </p>
                  <p className="social-muted">
                    Confira também a pasta de spam. Seu avatar continua salvo
                    neste aparelho.
                  </p>
                  <button
                    type="button"
                    disabled={busy || cooldown > 0}
                    onClick={() => void authenticate()}
                  >
                    {cooldown ? `Reenviar em ${cooldown}s` : "Reenviar link"}
                  </button>
                  <button type="button" onClick={() => setSentTo("")}>
                    Corrigir e-mail
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void authenticate();
                  }}
                >
                  <h2>
                    {authMode === "create"
                      ? "Comece pelo seu e-mail."
                      : "Entre com seu e-mail."}
                  </h2>
                  <p className="social-muted">
                    Sem senha para lembrar. Você recebe um link seguro para
                    continuar.
                  </p>
                  <label>
                    Seu e-mail
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      disabled={busy}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                    />
                  </label>
                  <button
                    className="social-primary"
                    disabled={busy || !socialConfigured || cooldown > 0}
                  >
                    {busy
                      ? "Enviando…"
                      : cooldown
                        ? `Aguarde ${cooldown}s`
                        : authMode === "create"
                          ? "Criar conta gratuita"
                          : "Receber link para entrar"}
                  </button>
                  <small>Seu e-mail nunca aparece no perfil.</small>
                </form>
              )}
            </div>
          </div>
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
          <nav className="social-tabs" aria-label="Minha conta">
            <button
              aria-pressed={tab === "profile"}
              onClick={() => setTab("profile")}
            >
              Meu perfil
            </button>
            <button
              aria-pressed={tab === "friends"}
              onClick={() => setTab("friends")}
            >
              Amigos{" "}
              <span>
                {data?.friends.filter((f) => f.status === "accepted").length ||
                  0}
              </span>
            </button>
          </nav>
          {data?.profile && (
            <div className="social-handle-strip">
              <span>@{data.profile.handle}</span>
              <button
                onClick={() =>
                  void act(async () => {
                    await navigator.clipboard.writeText(
                      `@${data.profile!.handle}`,
                    );
                    setNotice(
                      "Seu @ foi copiado. Compartilhe para receber pedidos de amizade.",
                    );
                  })
                }
              >
                Copiar meu @
              </button>
            </div>
          )}
          <div hidden={tab !== "profile"}>
            {!data?.profile && (
              <p className="social-onboarding">
                Falta só seu perfil: escolha um apelido e um @. O restante é
                opcional.
              </p>
            )}
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
          </div>
          <section className="social-friends" hidden={tab !== "friends"}>
            <h2>Sua turma, por perto.</h2>
            <p>
              Amizade só começa depois do aceite. Sua localização na casa não
              aparece aqui.
            </p>
            {!data?.profile ? (
              <div>
                <p>Crie seu @ para encontrar amigos e receber pedidos.</p>
                <button onClick={() => setTab("profile")}>
                  Completar meu perfil
                </button>
              </div>
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
                <nav
                  className="social-tabs social-friend-tabs"
                  aria-label="Listas de amizade"
                >
                  {(["accepted", "received", "sent"] as const).map((filter) => (
                    <button
                      key={filter}
                      aria-pressed={friendFilter === filter}
                      onClick={() => setFriendFilter(filter)}
                    >
                      {filter === "accepted"
                        ? "Amigos"
                        : filter === "received"
                          ? "Recebidos"
                          : "Enviados"}{" "}
                      (
                      {
                        data.friends.filter((f) =>
                          filter === "accepted"
                            ? f.status === "accepted"
                            : f.status === "pending" &&
                              (filter === "received"
                                ? f.recipient === user!.id
                                : f.requester === user!.id),
                        ).length
                      }
                      )
                    </button>
                  ))}
                </nav>
                {data.friends
                  .filter((f) =>
                    friendFilter === "accepted"
                      ? f.status === "accepted"
                      : f.status === "pending" &&
                        (friendFilter === "received"
                          ? f.recipient === user!.id
                          : f.requester === user!.id),
                  )
                  .map((f) => {
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
      {registered && (
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
    <dialog
      ref={dialog}
      className="social-dialog"
      onCancel={props.onClose}
      aria-label="Conta e amigos"
    >
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
