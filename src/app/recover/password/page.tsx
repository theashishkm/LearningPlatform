import { requireOwner } from "../../../lib/auth/server";
import { updatePassword } from "../actions";

export default async function Password({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireOwner();
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold">Set a new password</h1>
      <form action={updatePassword} className="mt-6 grid gap-4">
        {error && <p role="alert">Password update failed. Check the requirements and try again.</p>}
        <label className="grid gap-1">
          New password
          <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required
            aria-describedby="password-rules" className="rounded-lg border border-slate-400 px-3 py-2" />
        </label>
        <p id="password-rules">Use at least 12 characters.</p>
        <button className="rounded-lg bg-blue-800 px-4 py-3 font-semibold text-white">Update password</button>
      </form>
    </main>
  );
}
