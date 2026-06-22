import { getServerSupabase } from "@/lib/supabase/server";

export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = (process.env.OWNER_EMAIL ?? "").toLowerCase();
  return !!email && !!owner && email.toLowerCase() === owner;
}

export async function requireOwner() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Response("Unauthorized", { status: 401 });
  if (!isOwnerEmail(user.email)) throw new Response("Forbidden", { status: 403 });
  return { supabase, userId: user.id };
}
