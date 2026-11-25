"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authClient, requireOwner } from "../../lib/auth/server";

export async function requestRecovery(form: FormData) {
  const email = z.email().safeParse(form.get("email"));
  const appUrl = process.env.APP_URL;
  const client = await authClient();
  if (!email.success || !client || !appUrl) redirect("/recover?error=1");
  const { error } = await client.auth.resetPasswordForEmail(email.data, {
    redirectTo: new URL("/recover/confirm", appUrl).toString(),
  });
  if (error?.status && error.status >= 500) redirect("/recover?error=1");
  redirect("/recover?sent=1");
}

export async function updatePassword(form: FormData) {
  await requireOwner();
  const password = z.string().min(12).max(72).safeParse(form.get("password"));
  if (!password.success) redirect("/recover/password?error=1");
  const client = await authClient();
  if (!client) redirect("/login");
  const { error } = await client.auth.updateUser({ password: password.data });
  if (error) redirect("/recover/password?error=1");
  await client.auth.signOut({ scope: "local" });
  redirect("/login");
}
