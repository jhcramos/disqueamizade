import { supabase } from "@/services/supabase/client";
import { normalizeAppearance, type Appearance } from "@/garage/avatarStyle";
export type SocialProfile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  interests: string[];
  accepts_requests: boolean;
};
export type SavedLook = { avatar: number; appearance: Appearance };
export type Friendship = {
  id: string;
  requester: string;
  recipient: string;
  status: "pending" | "accepted";
};
export const socialConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);
export function socialError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "23505")
    return "Este identificador ou pedido já existe. Confira e tente novamente.";
  if (code === "42P01" || code === "PGRST205")
    return "Os perfis ainda estão sendo preparados. Seu avatar continua salvo neste aparelho.";
  if (code === "42501")
    return "Essa ação não está disponível. Confira sua conta e as permissões do perfil.";
  return "Não foi possível concluir. Confira sua conexão e tente novamente.";
}
export const socialService = {
  async load(id: string) {
    const [p, a, f, b] = await Promise.all([
      supabase.from("garage_profiles").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("garage_avatars")
        .select("avatar,appearance")
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("garage_friendships")
        .select("id,requester,recipient,status")
        .or(`requester.eq.${id},recipient.eq.${id}`),
      supabase.from("garage_blocks").select("target").eq("owner", id),
    ]);
    for (const r of [p, a, f, b]) if (r.error) throw r.error;
    const friends = (f.data || []) as Friendship[];
    const ids = [
      ...new Set(
        friends.map((x) => (x.requester === id ? x.recipient : x.requester)),
      ),
    ];
    const names = ids.length
      ? await supabase.from("garage_profiles").select("*").in("id", ids)
      : { data: [], error: null };
    if (names.error) throw names.error;
    return {
      profile: p.data as SocialProfile | null,
      look: a.data
        ? {
            avatar: a.data.avatar,
            appearance: normalizeAppearance(a.data.appearance),
          }
        : null,
      friends,
      profiles: (names.data || []) as SocialProfile[],
      blocks: (b.data || []) as { target: string }[],
    };
  },
  async save(profile: SocialProfile, look: SavedLook) {
    const p = await supabase.from("garage_profiles").upsert(profile);
    if (p.error) throw p.error;
    const a = await supabase.from("garage_avatars").upsert({
      user_id: profile.id,
      avatar: look.avatar,
      appearance: normalizeAppearance(look.appearance),
    });
    if (a.error) throw a.error;
  },
  async find(handle: string) {
    const r = await supabase
      .from("garage_profiles")
      .select("*")
      .eq("handle", handle.toLowerCase().replace(/^@/, "").trim())
      .maybeSingle();
    if (r.error) throw r.error;
    return r.data as SocialProfile | null;
  },
  async request(from: string, to: string) {
    const r = await supabase
      .from("garage_friendships")
      .insert({ requester: from, recipient: to });
    if (r.error) throw r.error;
  },
  async accept(id: string) {
    const r = await supabase
      .from("garage_friendships")
      .update({ status: "accepted" })
      .eq("id", id)
      .select("id");
    if (r.error) throw r.error;
    if (!r.data?.length) throw Error("Request unavailable");
  },
  async remove(id: string) {
    const r = await supabase.from("garage_friendships").delete().eq("id", id);
    if (r.error) throw r.error;
  },
  async block(owner: string, target: string) {
    const r = await supabase.from("garage_blocks").insert({ owner, target });
    if (r.error) throw r.error;
  },
  async unblock(owner: string, target: string) {
    const r = await supabase
      .from("garage_blocks")
      .delete()
      .eq("owner", owner)
      .eq("target", target);
    if (r.error) throw r.error;
  },
};
