import { signIn } from "./actions";
import Link from "next/link";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    && process.env.LEARNING_HUB_OWNER_ID;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Learning Hub</h1>
        <p className="mt-2 text-slate-600">Sign in to your private study workspace.</p>
        {!configured ? (
          <p className="mt-6 rounded-lg bg-slate-100 p-3">Sign-in requires Supabase Auth configuration.</p>
        ) : (
          <form action={signIn} className="mt-6 grid gap-4">
            {error && <p role="alert" className="text-red-800">Sign-in failed. Check your email and password.</p>}
            <label className="grid gap-1 font-medium">
              Email
              <input name="email" type="email" autoComplete="username" required className="rounded-lg border border-slate-400 px-3 py-2" />
            </label>
            <label className="grid gap-1 font-medium">
              Password
              <input name="password" type="password" autoComplete="current-password" required className="rounded-lg border border-slate-400 px-3 py-2" />
            </label>
            <button className="rounded-lg bg-blue-800 px-4 py-3 font-semibold text-white">Sign in</button>
            <Link href="/recover" className="text-blue-800 underline">Reset password</Link>
          </form>
        )}
      </section>
    </main>
  );
}
