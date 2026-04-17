import { z } from "zod";
import { flattenQuestions, surveys, type SurveyDef } from "./questions.js";

/**
 * Build a Zod schema from a SurveyDef so we can validate the payload
 * without writing a bespoke schema per survey.
 */
export function buildSchema(def: SurveyDef) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const q of flattenQuestions(def)) {
    let schema: z.ZodTypeAny;
    switch (q.type) {
      case "single": {
        const values = q.options.map((o) => o.value);
        schema = z.enum(values as [string, ...string[]]);
        break;
      }
      case "multi": {
        const values = q.options.map((o) => o.value);
        const enumSchema = z.enum(values as [string, ...string[]]);
        let arr: z.ZodArray<any> = z.array(enumSchema);
        if (q.max) arr = arr.max(q.max);
        if (q.required) arr = arr.min(1);
        schema = arr;
        break;
      }
      case "likert5":
        // Frontend sends "1".."5" as strings; accept either string or number.
        schema = z.union([
          z.enum(["1", "2", "3", "4", "5"]),
          z.number().int().min(1).max(5),
        ]);
        break;
      case "text":
      case "textarea":
        schema = z.string().max(q.maxLength ?? 800);
        break;
      case "email":
        schema = z.string().email().max(200);
        break;
    }
    if (!q.required) {
      if (q.type === "multi") {
        // Missing multi → empty array is fine.
        schema = schema.optional().default([]);
      } else {
        // Empty string is treated as "not answered" for optional text fields.
        schema = z.preprocess(
          (v) => (v === "" ? undefined : v),
          schema.optional()
        );
      }
    }
    shape[q.id] = schema;
  }

  return z
    .object({
      role: z.enum(["teacher", "administrator"]),
      answers: z.object(shape).passthrough(),
    })
    .transform((payload) => {
      // Normalize likert answers to numbers.
      for (const q of flattenQuestions(def)) {
        if (q.type === "likert5") {
          const v = (payload.answers as any)[q.id];
          if (typeof v === "string") (payload.answers as any)[q.id] = parseInt(v, 10);
        }
      }
      return payload;
    });
}

export function getSurveyDef(role: string): SurveyDef | null {
  if (role === "teacher") return surveys.teacher;
  if (role === "administrator") return surveys.administrator;
  return null;
}

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
});
