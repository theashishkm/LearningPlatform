"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authClient } from "../../lib/auth/server";
import { isOwner } from "../../lib/auth/owner";

const credentials = z.object({ email: z.email(), password: z.string().min(1).max(1024) });

export async function signIn(form: FormData) {
  const values = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  const client = await authClient();
  if (!values.success || !client) redirect("/login?error=1");

  const { data, error } = await client.auth.signInWithPassword(values.data);
  if (error || !isOwner(data.user, process.env.LEARNING_HUB_OWNER_ID)) {
    if (data.session) await client.auth.signOut({ scope: "local" });
    redirect("/login?error=1");
  }
  redirect("/dashboard");
}

export async function signOut() {
  const client = await authClient();
  await client?.auth.signOut({ scope: "local" });
  redirect("/login");
}
