import Link from "next/link";
import { requestRecovery } from "./actions";

export default async function Recover({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      {sent ? <p role="status" className="my-6">If the email belongs to an account, check its inbox for a recovery link.</p> : (
        <form action={requestRecovery} className="my-6 grid gap-4">
          {error && <p role="alert">Recovery is temporarily unavailable. Try again later.</p>}
          <label className="grid gap-1">
            Email
            <input name="email" type="email" autoComplete="email" required className="rounded-lg border border-slate-400 px-3 py-2" />
          </label>
          <button className="rounded-lg bg-blue-800 px-4 py-3 font-semibold text-white">Send recovery link</button>
        </form>
      )}
      <Link href="/login" className="text-blue-800 underline">Back to sign-in</Link>
    </main>
  );
}
