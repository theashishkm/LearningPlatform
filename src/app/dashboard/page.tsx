import { requireOwner } from "../../lib/auth/server";
import { signOut } from "../login/actions";

export default async function Dashboard() {
  await requireOwner();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Learning Hub</h1>
      <p className="mt-3">Your private workspace is ready for the historical import.</p>
      <form action={signOut} className="mt-6">
        <button className="rounded-lg border border-slate-500 px-4 py-2">Sign out</button>
      </form>
    </main>
  );
}
