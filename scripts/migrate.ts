import { migrate } from "drizzle-orm/postgres-js/migrator";
import { withDatabase } from "./database";

withDatabase(async (db) => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied.");
}).catch(() => {
  console.error("Migration failed. Check DATABASE_URL and the migration role's permissions.");
  process.exitCode = 1;
});
