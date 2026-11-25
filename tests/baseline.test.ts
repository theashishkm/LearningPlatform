import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { historicalCounts, importHistorical, parseHistoricalSeed, verifyHistoricalCounts } from "../src/db/seed";
import { isOwner } from "../src/lib/auth/owner";
import { bundledQuestionBank, importQuestionBank, validateQuestionBank } from "../src/db/question-bank";

const owner = "6dbf1200-3834-4877-a66e-e724a26b0a71";
const stranger = "6dbf1200-3834-4877-a66e-e724a26b0a72";

describe("owner authorization", () => {
  it("requires a valid configured owner and a matching user", () => {
    expect(isOwner({ id: owner }, owner)).toBe(true);
    expect(isOwner(null, owner)).toBe(false);
    expect(isOwner({ id: stranger }, owner)).toBe(false);
    expect(isOwner({ id: owner }, undefined)).toBe(false);
    expect(isOwner({ id: owner }, "invalid")).toBe(false);
  });
});

describe("historical database baseline", () => {
  const pg = new PGlite();
  const db = drizzle(pg);

  beforeAll(async () => {
    await pg.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      INSERT INTO auth.users VALUES ('${owner}'), ('${stranger}');
    `);
    await migrate(db, { migrationsFolder: "./drizzle" });
  }, 30_000);

  afterAll(() => pg.close());

  it("preserves the expected collections and stable IDs on repeated imports", async () => {
    const importAndVerify = () => db.transaction(async tx => {
      await importHistorical(owner, query => tx.execute(query));
      return verifyHistoricalCounts(owner, async query => {
        const { rows } = await tx.execute<{ count: number }>(query);
        return rows[0].count;
      });
    });

    expect(await importAndVerify()).toEqual(historicalCounts);
    const ids = await pg.query("SELECT id FROM learning.attempts ORDER BY legacy_id");
    await pg.exec("UPDATE learning.topics SET status = 'Reviewing' WHERE legacy_id = 'LA-MATRIX'");
    expect(await importAndVerify()).toEqual(historicalCounts);
    expect((await pg.query("SELECT id FROM learning.attempts ORDER BY legacy_id")).rows).toEqual(ids.rows);
    expect((await pg.query("SELECT status FROM learning.topics WHERE legacy_id = 'LA-MATRIX'")).rows).toEqual([{ status: "Reviewing" }]);
    const score = await pg.query(`
      SELECT correct_count, earned_points::text, max_points::text FROM learning.attempts
      WHERE legacy_id = 'HIST-ATT-ENG-SUNDAY01'
    `);
    expect(score.rows).toEqual([{ correct_count: null, earned_points: "24.5", max_points: "25" }]);
    const flags = await pg.query(`
      SELECT earned_points::int AS points, provenance_notes, recorded_date FROM learning.attempts
      WHERE reconciliation_required ORDER BY legacy_id
    `);
    expect(flags.rows).toEqual([
      { points: 9, provenance_notes: "Assistant-evaluated; raw score 13/15", recorded_date: null },
      { points: 7, provenance_notes: "Assistant-evaluated; raw score 9/15", recorded_date: null },
    ]);
    const la = await pg.query(`
      SELECT correct_count, attempted_count, total_count FROM learning.attempts
      WHERE legacy_id = 'HIST-ATT-LA-MIX2-1018'
    `);
    expect(la.rows).toEqual([{ correct_count: 3, attempted_count: 9, total_count: 10 }]);
    const totals = await pg.query(`
      SELECT sum(earned_points)::text AS earned, sum(max_points)::text AS maximum FROM learning.attempts
    `);
    expect(totals.rows).toEqual([{ earned: "153.5", maximum: "192" }]);
    const verified = await pg.query("SELECT count(*)::int AS count FROM learning.questions WHERE verified_pyq");
    expect(verified.rows).toEqual([{ count: 0 }]);
  }, 30_000);

  it("blocks direct client access and isolates owners under RLS", async () => {
    await pg.exec("SET ROLE anon");
    try {
      await expect(pg.query("SELECT answer_key FROM learning.questions")).rejects.toMatchObject({ code: "42501" });
    } finally {
      await pg.exec("RESET ROLE");
    }
    await pg.exec("SET ROLE authenticated");
    try {
      await expect(pg.query("SELECT answer_key FROM learning.questions")).rejects.toMatchObject({ code: "42501" });
    } finally {
      await pg.exec("RESET ROLE");
    }
    await pg.exec("GRANT USAGE ON SCHEMA learning, auth TO authenticated");
    await pg.exec("GRANT SELECT ON learning.attempts TO authenticated");
    await pg.exec("SET ROLE authenticated");
    try {
      await pg.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [stranger]);
      expect((await pg.query("SELECT id FROM learning.attempts")).rows).toHaveLength(0);
      await pg.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [owner]);
      expect((await pg.query("SELECT id FROM learning.attempts")).rows).toHaveLength(18);
    } finally {
      await pg.exec("RESET ROLE");
    }
  });

  it("fails validation for duplicate IDs before starting an import", () => {
    const seed = parseHistoricalSeed();
    seed.subjects[1].id = seed.subjects[0].id;
    expect(() => parseHistoricalSeed(seed)).toThrow("Duplicate legacy ID");
  });

  it("imports the expanded question bank twice and preserves the historical baseline", async () => {
    const bank = bundledQuestionBank();
    expect(bank).toHaveLength(2406);
    const original = bank.filter(row => row.origin === "original");
    for (const { id } of parseHistoricalSeed().subjects) {
      const rows = original.filter(row => row.subject === id);
      expect(rows).toHaveLength(200);
      expect(new Set(rows.map(row => row.difficulty))).toEqual(new Set(["Easy", "Medium", "Hard"]));
    }
    const internet = { ...original[0], origin: "internet", id: "INTERNET-TEST", prompt: "Imported sample",
      source: "Test publisher", sourceUrl: "https://example.org/question" };
    expect(() => validateQuestionBank([{ ...internet, sourceUrl: undefined }])).toThrow();
    expect(() => validateQuestionBank([{ ...bank.find(row => row.origin === "pyq"), answerKeyUrl: undefined }])).toThrow();

    const importBank = () => db.transaction(async tx => {
      await importQuestionBank(owner, [...bank, internet], query => tx.execute(query));
      await verifyHistoricalCounts(owner, async query => (await tx.execute<{ count: number }>(query)).rows[0].count);
    });
    await importBank();
    await importBank();
    const counts = await pg.query(`
      SELECT origin_type, count(*)::int AS count FROM learning.questions GROUP BY origin_type ORDER BY origin_type
    `);
    expect(counts.rows).toEqual([
      { origin_type: "internet", count: 1 }, { origin_type: "original", count: 2430 }, { origin_type: "pyq", count: 6 },
    ]);
    const subjects = await pg.query(`
      SELECT subject_code, count(*)::int AS count FROM learning.questions GROUP BY subject_code
    `);
    expect(subjects.rows).toHaveLength(12);
    for (const row of subjects.rows as { count: number }[]) expect(row.count).toBeGreaterThanOrEqual(200);
  }, 30_000);
});
