import { z } from "zod";
import { importHistorical, verifyHistoricalCounts } from "../src/db/seed";
import { withDatabase } from "./database";

withDatabase(async (db) => {
  const ownerId = z.uuid().parse(process.env.LEARNING_HUB_OWNER_ID);
  const counts = await db.transaction(async (tx) => {
    await importHistorical(ownerId, query => tx.execute(query));
    return verifyHistoricalCounts(ownerId, async query => {
      const [row] = await tx.execute<{ count: number }>(query);
      return row.count;
    });
  });
  console.table(counts);
}).catch(() => {
  console.error("Import failed. Check the baseline migration, the configured owner UUID and the database connection.");
  process.exitCode = 1;
});
