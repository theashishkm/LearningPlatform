import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { bundledQuestionBank, importQuestionBank } from "../src/db/question-bank";
import { withDatabase } from "./database";

withDatabase(async db => {
  const owner = z.uuid().parse(process.env.LEARNING_HUB_OWNER_ID);
  const path = process.argv[2];
  const bank: unknown = path ? JSON.parse(await readFile(path, "utf8")) : bundledQuestionBank();
  await db.transaction(async tx => {
    await importQuestionBank(owner, bank, query => tx.execute(query));
    const totals = await tx.execute(sql`
      SELECT subject_code, origin_type, difficulty, count(*)::int AS questions
      FROM learning.questions WHERE owner_id = ${owner}
      GROUP BY subject_code, origin_type, difficulty
      ORDER BY subject_code, origin_type, difficulty
    `);
    console.table([...totals]);
  });
}).catch(error => {
  const message = error instanceof z.ZodError ? "Some entries have invalid content or provenance." : "Check the input, database migration and owner.";
  console.error(`Question-bank import failed. ${message}`);
  process.exitCode = 1;
});
