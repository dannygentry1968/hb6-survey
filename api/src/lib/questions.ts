/**
 * Mirror of the question bank used by the frontend — kept here so the API
 * can validate incoming submissions against the same source of truth.
 *
 * Keep this file in sync with /web/src/lib/questions.ts. The two files are
 * intentionally separate to allow independent deployment, but the structure
 * and IDs must match.
 */

export type Option = { value: string; label: string };
export type Question =
  | { id: string; type: "single";    label: string; required?: boolean; options: Option[] }
  | { id: string; type: "multi";     label: string; required?: boolean; options: Option[]; max?: number }
  | { id: string; type: "likert5";   label: string; required?: boolean; scale: "agree" | "frequency" | "direction" | "safety" }
  | { id: string; type: "text";      label: string; required?: boolean; maxLength?: number }
  | { id: string; type: "textarea";  label: string; required?: boolean; maxLength?: number }
  | { id: string; type: "email";     label: string; required?: boolean };

export type Section = { id: string; title: string; questions: Question[] };
export type SurveyDef = { role: "teacher" | "administrator"; title: string; intro: string; sections: Section[] };

const regionOptions: Option[] = Array.from({ length: 20 }, (_, i) => ({
  value: `region-${i + 1}`,
  label: `TEA Region ${i + 1}`,
})).concat([{ value: "unknown", label: "Prefer not to say" }]);

export const teacherSurvey: SurveyDef = {
  role: "teacher",
  title: "HB 6 — Texas Teacher Survey",
  intro: "",
  sections: [
    {
      id: "demographics",
      title: "About you",
      questions: [
        { id: "grade_band", type: "single", required: true, label: "", options: [
          { value: "prek-2", label: "" }, { value: "3-5", label: "" },
          { value: "6-8", label: "" },    { value: "9-12", label: "" },
          { value: "mixed", label: "" },
        ]},
        { id: "school_type", type: "single", required: true, label: "", options: [
          { value: "public", label: "" }, { value: "charter", label: "" },
          { value: "private", label: "" }, { value: "other", label: "" },
        ]},
        { id: "region", type: "single", required: true, label: "", options: regionOptions },
        { id: "urbanicity", type: "single", required: true, label: "", options: [
          { value: "urban", label: "" }, { value: "suburban", label: "" }, { value: "rural", label: "" },
        ]},
        { id: "years", type: "single", required: true, label: "", options: [
          { value: "0-2", label: "" }, { value: "3-5", label: "" },
          { value: "6-15", label: "" }, { value: "16+", label: "" },
        ]},
      ],
    },
    {
      id: "awareness",
      title: "Awareness & training",
      questions: [
        { id: "aware_hb6", type: "single", required: true, label: "", options: [
          { value: "fully", label: "" }, { value: "somewhat", label: "" }, { value: "no", label: "" },
        ]},
        { id: "training", type: "single", required: true, label: "", options: [
          { value: "full", label: "" }, { value: "brief", label: "" },
          { value: "none", label: "" }, { value: "unsure", label: "" },
        ]},
      ],
    },
    {
      id: "classroom",
      title: "Your classroom this year",
      questions: [
        { id: "behavior_trend", type: "likert5", required: true, scale: "direction", label: "" },
        { id: "safety_trend",   type: "likert5", required: true, scale: "agree",     label: "" },
        { id: "incidents", type: "multi", required: false, label: "", options: [
          { value: "assault", label: "" }, { value: "threat", label: "" },
          { value: "verbal", label: "" },  { value: "witnessed", label: "" },
        ]},
      ],
    },
    {
      id: "using_hb6",
      title: "Using HB 6",
      questions: [
        { id: "removal_used", type: "single", required: true, label: "", options: [
          { value: "yes_multi", label: "" }, { value: "yes_once", label: "" },
          { value: "no", label: "" }, { value: "unsure", label: "" },
        ]},
        { id: "admin_support", type: "likert5", required: true, scale: "frequency", label: "" },
        { id: "retaliation",   type: "likert5", required: true, scale: "agree",     label: "" },
        { id: "did_not_remove", type: "single", required: true, label: "", options: [
          { value: "yes", label: "" }, { value: "no", label: "" }, { value: "unsure", label: "" },
        ]},
        { id: "did_not_remove_why", type: "multi", required: false, label: "", options: [
          { value: "admin_pushback", label: "" }, { value: "paperwork", label: "" },
          { value: "fear", label: "" }, { value: "unaware", label: "" },
          { value: "escalation", label: "" }, { value: "other", label: "" },
        ]},
      ],
    },
    {
      id: "overall",
      title: "Overall impact",
      questions: [
        { id: "classroom_safety", type: "likert5", required: true, scale: "agree", label: "" },
        { id: "learning_env",     type: "likert5", required: true, scale: "agree", label: "" },
        { id: "recommend", type: "single", required: true, label: "", options: [
          { value: "yes", label: "" }, { value: "maybe", label: "" }, { value: "no", label: "" },
        ]},
        { id: "right",   type: "textarea", required: false, maxLength: 800, label: "" },
        { id: "improve", type: "textarea", required: false, maxLength: 800, label: "" },
      ],
    },
  ],
};

export const adminSurvey: SurveyDef = {
  role: "administrator",
  title: "HB 6 — Texas Administrator Survey",
  intro: "",
  sections: [
    {
      id: "demographics",
      title: "About you",
      questions: [
        { id: "admin_role", type: "single", required: true, label: "", options: [
          { value: "principal", label: "" }, { value: "asst_principal", label: "" },
          { value: "cbc", label: "" }, { value: "district", label: "" },
          { value: "superintendent", label: "" }, { value: "other", label: "" },
        ]},
        { id: "district_size", type: "single", required: true, label: "", options: [
          { value: "small", label: "" }, { value: "medium", label: "" }, { value: "large", label: "" },
        ]},
        { id: "school_type", type: "single", required: true, label: "", options: [
          { value: "public", label: "" }, { value: "charter", label: "" }, { value: "other", label: "" },
        ]},
        { id: "region", type: "single", required: true, label: "", options: regionOptions },
        { id: "urbanicity", type: "single", required: true, label: "", options: [
          { value: "urban", label: "" }, { value: "suburban", label: "" }, { value: "rural", label: "" },
        ]},
        { id: "years", type: "single", required: true, label: "", options: [
          { value: "0-2", label: "" }, { value: "3-5", label: "" },
          { value: "6-15", label: "" }, { value: "16+", label: "" },
        ]},
      ],
    },
    {
      id: "implementation",
      title: "Implementation",
      questions: [
        { id: "compliance_plan", type: "single", required: true, label: "", options: [
          { value: "yes", label: "" }, { value: "in_progress", label: "" },
          { value: "no", label: "" }, { value: "unsure", label: "" },
        ]},
        { id: "teacher_training", type: "single", required: true, label: "", options: [
          { value: "full", label: "" }, { value: "brief", label: "" },
          { value: "no", label: "" }, { value: "unsure", label: "" },
        ]},
        { id: "threat_team", type: "single", required: true, label: "", options: [
          { value: "yes_multi", label: "" }, { value: "yes_once", label: "" },
          { value: "no", label: "" }, { value: "unsure", label: "" },
        ]},
        { id: "judicial_removal", type: "single", required: true, label: "", options: [
          { value: "yes", label: "" }, { value: "no", label: "" }, { value: "unsure", label: "" },
        ]},
      ],
    },
    {
      id: "trends",
      title: "Trends",
      questions: [
        { id: "removals_trend",   type: "likert5", required: true, scale: "direction", label: "" },
        { id: "assaults_trend",   type: "likert5", required: true, scale: "direction", label: "" },
        { id: "daep_trend",       type: "likert5", required: true, scale: "direction", label: "" },
        { id: "expulsions_trend", type: "likert5", required: true, scale: "direction", label: "" },
      ],
    },
    {
      id: "judgment",
      title: "Your judgment",
      questions: [
        { id: "teachers_supported",  type: "likert5", required: true, scale: "agree", label: "" },
        { id: "resources",           type: "likert5", required: true, scale: "agree", label: "" },
        { id: "reducing_violence",   type: "likert5", required: true, scale: "agree", label: "" },
        { id: "harming_vulnerable",  type: "likert5", required: true, scale: "agree", label: "" },
      ],
    },
    {
      id: "challenges",
      title: "Biggest challenges",
      questions: [
        { id: "top_challenges", type: "multi", required: true, max: 3, label: "", options: [
          { value: "staffing", label: "" }, { value: "funding", label: "" },
          { value: "teacher_pushback", label: "" }, { value: "parent_pushback", label: "" },
          { value: "legal", label: "" }, { value: "mental_health", label: "" },
          { value: "due_process", label: "" }, { value: "reporting", label: "" },
          { value: "training", label: "" }, { value: "other", label: "" },
        ]},
      ],
    },
    {
      id: "overall",
      title: "Overall impact",
      questions: [
        { id: "staff_safety",     type: "likert5", required: true, scale: "agree", label: "" },
        { id: "student_outcomes", type: "likert5", required: true, scale: "agree", label: "" },
        { id: "recommend", type: "single", required: true, label: "", options: [
          { value: "yes", label: "" }, { value: "maybe", label: "" }, { value: "no", label: "" },
        ]},
        { id: "biggest_fix", type: "textarea", required: false, maxLength: 800, label: "" },
      ],
    },
  ],
};

export const surveys = { teacher: teacherSurvey, administrator: adminSurvey } as const;

export function flattenQuestions(def: SurveyDef): Question[] {
  return def.sections.flatMap((s) => s.questions);
}
