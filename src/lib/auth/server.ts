import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isOwner } from "./owner";

export async function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(updates) {
        try {
          for (const { name, value, options } of updates) jar.set(name, value, options);
        } catch {
          // Server Components rely on the proxy to persist refreshed cookies.
        }
      },
    },
  });
}

export async function requireOwner() {
  await connection();
  const client = await authClient();
  if (!client) redirect("/login");
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !isOwner(user, process.env.LEARNING_HUB_OWNER_ID)) redirect("/login");
  return user;
}
