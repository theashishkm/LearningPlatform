import { z } from "zod";

export function isOwner(user: { id: string } | null, configuredOwner: unknown): boolean {
  const owner = z.uuid().safeParse(configuredOwner);
  return owner.success && user?.id.toLowerCase() === owner.data.toLowerCase();
}
