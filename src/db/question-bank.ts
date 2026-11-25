import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { buildOriginalBank } from "./original-questions";
import { verifiedQuestions } from "./pyq-questions";

const text = z.string().trim().min(1);
const url = z.url({ protocol: /^https?$/ });
const common = z.object({
  id: text,
  subject: z.enum(["LA", "PROB", "CALC", "APT", "PYDSA", "DBMS", "ML", "AI", "ENG-G", "ENG-V", "ENG-R", "ENG-W"]),
  kind: z.enum(["MCQ", "MSQ", "NAT"]),
  prompt: text,
  options: z.array(text),
  answer: z.union([text, z.array(text).min(1)]),
  explanation: text,
  source: text,
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
});

const entry = z.discriminatedUnion("origin", [
  common.extend({ origin: z.literal("original") }),
  common.extend({ origin: z.literal("internet"), sourceUrl: url }),
  common.extend({
    origin: z.literal("pyq"), sourceUrl: url, sourceYear: z.number().int().min(1900).max(2100),
    sourceQuestionRef: text, answerKeyUrl: url,
  }),
]).refine(row => {
  if (row.kind === "NAT") {
    return row.options.length === 0 && typeof row.answer === "string"
      && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(row.answer) && Number.isFinite(Number(row.answer));
  }
  if (row.options.length < 2 || row.options.length > 4 || new Set(row.options).size !== row.options.length) return false;
  const keys = typeof row.answer === "string" ? [row.answer] : row.answer;
  return (row.kind === "MCQ" ? typeof row.answer === "string" : Array.isArray(row.answer))
    && new Set(keys).size === keys.length
    && keys.every(key => /^[A-D]$/.test(key) && key.charCodeAt(0) - 65 < row.options.length);
}, "Invalid options or answer");

export function validateQuestionBank(input: unknown) {
  const bank = z.array(entry).min(1).parse(input);
  const ids = new Set(bank.map(row => row.id));
  const prompts = new Set(bank.map(row => row.prompt.toLowerCase().replace(/\s+/g, " ")));
  if (ids.size !== bank.length || prompts.size !== bank.length) throw new Error("Duplicate question ID or prompt");
  if (bank.some(row => row.id.startsWith("Q-START-"))) throw new Error("Starter question IDs are reserved");
  return bank;
}

export function bundledQuestionBank() {
  return validateQuestionBank([...buildOriginalBank(), ...verifiedQuestions]);
}

export async function importQuestionBank(
  ownerId: string, input: unknown, execute: (query: SQL) => Promise<unknown>,
) {
  const owner = z.uuid().parse(ownerId);
  const bank = validateQuestionBank(input);
  // Batch inserts keep the expanded bank fast to load over remote PostgreSQL connections.
  for (let offset = 0; offset < bank.length; offset += 200) {
    const rows = bank.slice(offset, offset + 200).map(row => sql`(
      ${owner}, ${row.id}, ${row.subject}, ${row.kind}, ${row.prompt}, ${JSON.stringify(row.options)}::jsonb,
      ${JSON.stringify(row.answer)}::jsonb, ${row.explanation}, ${row.source}, ${row.difficulty}, ${row.origin === "pyq"},
      ${row.origin}, ${row.origin === "original" ? null : row.sourceUrl}, ${row.origin === "pyq" ? row.sourceYear : null},
      ${row.origin === "pyq" ? row.sourceQuestionRef : null}, ${row.origin === "pyq" ? row.answerKeyUrl : null}
    )`);
    await execute(sql`INSERT INTO learning.questions (
      owner_id, legacy_id, subject_code, kind, prompt, options, answer_key, explanation, source, difficulty,
      verified_pyq, origin_type, source_url, source_year, source_question_ref, answer_key_url
    ) VALUES ${sql.join(rows, sql`, `)} ON CONFLICT (owner_id, legacy_id) DO NOTHING`);
  }
}
