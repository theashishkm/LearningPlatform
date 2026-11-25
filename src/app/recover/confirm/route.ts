import { redirect } from "next/navigation";
import { z } from "zod";
import { authClient } from "../../../lib/auth/server";
import { isOwner } from "../../../lib/auth/owner";

export async function GET(request: Request) {
  const token = z.string().min(1).max(512).safeParse(new URL(request.url).searchParams.get("token_hash"));
  const client = await authClient();
  if (!token.success || !client) redirect("/recover?error=1");
  const { data, error } = await client.auth.verifyOtp({ token_hash: token.data, type: "recovery" });
  if (error || !isOwner(data.user, process.env.LEARNING_HUB_OWNER_ID)) {
    if (data.session) await client.auth.signOut({ scope: "local" });
    redirect("/recover?error=1");
  }
  redirect("/recover/password");
}
