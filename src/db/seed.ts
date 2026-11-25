import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import raw from "../../data/seed-data.json";

const text = z.string();
const id = text.min(1);
const date = z.union([z.literal(""), z.iso.date()]);
const topicStatus = z.enum(["Not started", "Learning", "Practicing", "Reviewing", "Confident"]);
const mistakeStatus = z.enum(["Open", "Reviewing", "Resolved"]);
const category = z.enum(["", "Conceptual", "Application", "Calculation", "Interpretation", "Speed", "Careless"]);
const count = z.number().int().nonnegative();

const schema = z.object({
  subjects: z.array(z.object({ id, name: id, track: z.enum(["GATE DA / CMI", "GATE DA", "English"]) })).length(12),
  topics: z.array(z.object({ id, subject: id, unit: text, name: id, status: topicStatus, notes: text, confidence: z.literal("") })).length(17),
  questions: z.array(z.object({
    id, subject: id, topic: text, type: z.enum(["MCQ", "MSQ", "NAT"]), text: id,
    options: z.array(text), correct: id, explanation: text, source: z.literal("Original starter practice"),
    difficulty: id, verified: z.literal("Yes"),
  })).length(30),
  tests: z.array(z.object({ id, date, subject: id, title: id, count: count.positive(), origin: text, status: z.literal("Completed") })).length(18),
  attempts: z.array(z.object({
    id, testId: id, date, correct: z.number().nonnegative(), total: count.positive(), attempted: count, notes: text,
  })).length(18),
  answers: z.array(z.object({ attemptId: id, questionId: id, selected: text, correct: text, isCorrect: z.boolean(), reflection: text })).length(26),
  mistakes: z.array(z.object({
    id, date, subject: id, topic: text, questionId: id, type: category, why: text, approach: text, status: mistakeStatus,
  })).length(26),
  study: z.tuple([]),
  vocabulary: z.tuple([]),
  mode: z.literal("preview"),
});

const trackCodes = {
  "GATE DA / CMI": ["GATE_DA_2027", "CMI_MSC_DS"],
  "GATE DA": ["GATE_DA_2027"],
  English: ["ENGLISH"],
};

const conflicts = new Set(["HIST-ATT-APT-DIAG1", "HIST-ATT-APT-DIAG2"]);
const blankToNull = (value: string) => value === "" ? null : value;
const json = (value: unknown) => sql`${JSON.stringify(value)}::jsonb`;
const unchanged = sql`ON CONFLICT (owner_id, legacy_id) DO NOTHING`;

export function parseHistoricalSeed(input: unknown = raw) {
  const seed = schema.parse(input);
  const subjects = new Set(seed.subjects.map(row => row.id));
  const topics = new Map(seed.topics.map(row => [row.id, row.subject]));
  const tests = new Map(seed.tests.map(row => [row.id, row]));
  const attempts = new Set(seed.attempts.map(row => row.id));
  for (const rows of [seed.subjects, seed.topics, seed.questions, seed.tests, seed.attempts, seed.mistakes]) {
    if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error("Duplicate legacy ID");
  }

  for (const row of [...seed.topics, ...seed.questions, ...seed.tests, ...seed.mistakes]) {
    if (!subjects.has(row.subject)) throw new Error(`Unknown subject for ${row.id}`);
  }
  for (const row of [...seed.questions, ...seed.mistakes]) {
    if (row.topic && topics.get(row.topic) !== row.subject) throw new Error(`Invalid topic for ${row.id}`);
  }
  for (const row of seed.questions) {
    const options = row.options.filter(Boolean);
    const keys = [...row.correct];
    const valid = row.type === "NAT"
      ? options.length === 0 && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(row.correct) && Number.isFinite(Number(row.correct))
      : options.length === row.options.length && new Set(keys).size === keys.length
        && keys.every(key => /^[A-Z]$/.test(key) && key.charCodeAt(0) - 65 < options.length)
        && (row.type === "MSQ" || keys.length === 1);
    if (!valid) throw new Error(`Invalid answer key for ${row.id}`);
  }
  for (const row of seed.attempts) {
    if (tests.get(row.testId)?.count !== row.total || row.correct > row.attempted || row.attempted > row.total) {
      throw new Error(`Invalid historical score for ${row.id}`);
    }
  }

  const answerIds = new Set<string>();
  const questionRefs = new Set<string>();
  for (const row of seed.answers) {
    const key = answerLegacyId(row);
    if (!attempts.has(row.attemptId) || answerIds.has(key)) throw new Error(`Invalid answer reference ${key}`);
    answerIds.add(key);
    questionRefs.add(row.questionId);
  }
  for (const row of seed.mistakes) {
    if (!questionRefs.has(row.questionId)) throw new Error(`Unknown mistake reference for ${row.id}`);
  }
  return seed;
}

function answerLegacyId(row: { attemptId: string; questionId: string }) {
  return JSON.stringify([row.attemptId, row.questionId]);
}

// The caller supplies a transaction. Source records and normalized fields are committed together.
export async function importHistorical(ownerId: string, execute: (query: SQL) => Promise<unknown>) {
  const owner = z.uuid().parse(ownerId);
  const seed = parseHistoricalSeed();
  const topicId = (legacyId: string) => sql`(SELECT id FROM learning.topics WHERE owner_id = ${owner} AND legacy_id = ${legacyId})`;

  for (const row of seed.subjects) {
    await execute(sql`INSERT INTO learning.subjects (owner_id, legacy_id, name, source_record)
      VALUES (${owner}, ${row.id}, ${row.name}, ${json(row)}) ${unchanged}`);
    for (const track of trackCodes[row.track]) {
      await execute(sql`INSERT INTO learning.track_subjects VALUES (${owner}, ${row.id}, ${track}) ON CONFLICT DO NOTHING`);
    }
  }
  for (const row of seed.topics) {
    await execute(sql`INSERT INTO learning.topics
      (owner_id, legacy_id, subject_code, unit, name, status, notes, source_record)
      VALUES (${owner}, ${row.id}, ${row.subject}, ${row.unit}, ${row.name}, ${row.status}, ${row.notes}, ${json(row)}) ${unchanged}`);
  }
  for (const row of seed.questions) {
    const answer = row.type === "MSQ" ? [...row.correct] : row.correct;
    await execute(sql`INSERT INTO learning.questions
      (owner_id, legacy_id, subject_code, topic_id, kind, prompt, options, answer_key, explanation, source, difficulty, source_record)
      VALUES (${owner}, ${row.id}, ${row.subject}, ${topicId(row.topic)}, ${row.type}, ${row.text},
      ${json(row.type === "NAT" ? [] : row.options)}, ${json(answer)}, ${row.explanation},
      ${row.source}, ${row.difficulty}, ${json(row)}) ${unchanged}`);
  }
  for (const row of seed.tests) {
    await execute(sql`INSERT INTO learning.tests
      (owner_id, legacy_id, subject_code, title, question_count, recorded_date, origin, source_record)
      VALUES (${owner}, ${row.id}, ${row.subject}, ${row.title}, ${row.count}, ${blankToNull(row.date)}, ${row.origin}, ${json(row)}) ${unchanged}`);
  }
  for (const row of seed.attempts) {
    const testId = sql`(SELECT id FROM learning.tests WHERE owner_id = ${owner} AND legacy_id = ${row.testId})`;
    const correctCount = Number.isInteger(row.correct) ? row.correct : null;
    await execute(sql`INSERT INTO learning.attempts
      (owner_id, legacy_id, test_id, recorded_date, correct_count, total_count, attempted_count,
        earned_points, max_points, provenance_notes, reconciliation_required, source_record)
      VALUES (${owner}, ${row.id}, ${testId}, ${blankToNull(row.date)}, ${correctCount}, ${row.total},
        ${row.attempted}, ${row.correct}, ${row.total}, ${row.notes}, ${conflicts.has(row.id)}, ${json(row)}) ${unchanged}`);
  }
  for (const row of seed.answers) {
    const attemptId = sql`(SELECT id FROM learning.attempts WHERE owner_id = ${owner} AND legacy_id = ${row.attemptId})`;
    await execute(sql`INSERT INTO learning.answers
      (owner_id, legacy_id, attempt_id, legacy_question_ref, selected, recorded_correct, is_correct, reflection, source_record)
      VALUES (${owner}, ${answerLegacyId(row)}, ${attemptId}, ${row.questionId}, ${blankToNull(row.selected)},
        ${blankToNull(row.correct)}, ${row.isCorrect}, ${row.reflection}, ${json(row)}) ${unchanged}`);
  }
  for (const row of seed.mistakes) {
    const answerId = sql`(SELECT (array_agg(id))[1] FROM learning.answers
      WHERE owner_id = ${owner} AND legacy_question_ref = ${row.questionId} HAVING count(*) = 1)`;
    await execute(sql`INSERT INTO learning.mistakes
      (owner_id, legacy_id, subject_code, topic_id, answer_id, recorded_date, legacy_question_ref,
        category, status, description, correct_approach, source_record)
      VALUES (${owner}, ${row.id}, ${row.subject}, ${topicId(row.topic)}, ${answerId},
        ${blankToNull(row.date)}, ${row.questionId}, ${blankToNull(row.type)}, ${row.status},
        ${row.why}, ${blankToNull(row.approach)}, ${json(row)}) ${unchanged}`);
  }
}

export const historicalCounts = {
  subjects: 12, topics: 17, questions: 30, tests: 18, attempts: 18, answers: 26, mistakes: 26,
};

export async function verifyHistoricalCounts(ownerId: string, countRows: (query: SQL) => Promise<number>) {
  for (const [table, expected] of Object.entries(historicalCounts)) {
    const legacyScope = table === "questions" ? sql`AND legacy_id LIKE 'Q-START-%'` : sql``;
    const actual = await countRows(sql`SELECT count(*)::int AS count FROM learning.${sql.identifier(table)}
      WHERE owner_id = ${ownerId} AND legacy_id IS NOT NULL ${legacyScope}`);
    if (actual !== expected) throw new Error(`${table}: expected ${expected}, found ${actual}`);
  }
  return historicalCounts;
}
