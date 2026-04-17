/**
 * HB 6 survey question bank (teacher + administrator).
 *
 * Each question is perception-focused and can be answered without looking up
 * data. The API at /submit validates incoming responses against this same
 * schema structure.
 */

export type Option = { value: string; label: string };
export type Question =
  | { id: string; type: "single";    label: string; hint?: string; required?: boolean; options: Option[] }
  | { id: string; type: "multi";     label: string; hint?: string; required?: boolean; options: Option[]; max?: number }
  | { id: string; type: "likert5";   label: string; hint?: string; required?: boolean; scale: "agree" | "frequency" | "direction" | "safety" }
  | { id: string; type: "text";      label: string; hint?: string; required?: boolean; maxLength?: number }
  | { id: string; type: "textarea";  label: string; hint?: string; required?: boolean; maxLength?: number }
  | { id: string; type: "email";     label: string; hint?: string; required?: boolean };

export type Section = { id: string; title: string; questions: Question[] };
export type SurveyDef = { role: "teacher" | "administrator"; title: string; intro: string; sections: Section[] };

const likertAgree = {
  id: "placeholder",
  type: "likert5" as const,
  label: "",
  scale: "agree" as const,
};

const regionOptions: Option[] = Array.from({ length: 20 }, (_, i) => ({
  value: `region-${i + 1}`,
  label: `TEA Region ${i + 1}`,
})).concat([{ value: "unknown", label: "Prefer not to say" }]);

const demographicTeacher: Section = {
  id: "demographics",
  title: "About you",
  questions: [
    {
      id: "grade_band",
      type: "single",
      required: true,
      label: "What grade band do you primarily teach?",
      options: [
        { value: "prek-2", label: "PreK–2" },
        { value: "3-5",    label: "3–5" },
        { value: "6-8",    label: "6–8" },
        { value: "9-12",   label: "9–12" },
        { value: "mixed",  label: "Mixed / other" },
      ],
    },
    {
      id: "school_type",
      type: "single",
      required: true,
      label: "What type of school do you work in?",
      options: [
        { value: "public",  label: "Traditional public ISD" },
        { value: "charter", label: "Open-enrollment charter" },
        { value: "private", label: "Private" },
        { value: "other",   label: "Other" },
      ],
    },
    {
      id: "region",
      type: "single",
      required: true,
      label: "Which TEA Education Service Center region?",
      hint: "See tea.texas.gov/esc-map if you're unsure.",
      options: regionOptions,
    },
    {
      id: "urbanicity",
      type: "single",
      required: true,
      label: "How would you describe your campus?",
      options: [
        { value: "urban",    label: "Urban" },
        { value: "suburban", label: "Suburban" },
        { value: "rural",    label: "Rural" },
      ],
    },
    {
      id: "years",
      type: "single",
      required: true,
      label: "Years you have been teaching",
      options: [
        { value: "0-2",  label: "0–2"  },
        { value: "3-5",  label: "3–5"  },
        { value: "6-15", label: "6–15" },
        { value: "16+",  label: "16+"  },
      ],
    },
  ],
};

const demographicAdmin: Section = {
  id: "demographics",
  title: "About you",
  questions: [
    {
      id: "admin_role",
      type: "single",
      required: true,
      label: "Which of these best describes your role?",
      options: [
        { value: "principal",     label: "Principal" },
        { value: "asst_principal", label: "Assistant Principal" },
        { value: "cbc",           label: "Campus Behavior Coordinator / Dean" },
        { value: "district",      label: "District-level administrator" },
        { value: "superintendent", label: "Superintendent" },
        { value: "other",         label: "Other" },
      ],
    },
    {
      id: "district_size",
      type: "single",
      required: true,
      label: "Approximate size of your district",
      options: [
        { value: "small",  label: "Small (fewer than 1,000 students)" },
        { value: "medium", label: "Medium (1,000–10,000)" },
        { value: "large",  label: "Large (10,000+)" },
      ],
    },
    {
      id: "school_type",
      type: "single",
      required: true,
      label: "Type of school/district",
      options: [
        { value: "public",  label: "Traditional public ISD" },
        { value: "charter", label: "Open-enrollment charter" },
        { value: "other",   label: "Other" },
      ],
    },
    {
      id: "region",
      type: "single",
      required: true,
      label: "TEA Education Service Center region",
      options: regionOptions,
    },
    {
      id: "urbanicity",
      type: "single",
      required: true,
      label: "How would you describe your campus/district?",
      options: [
        { value: "urban",    label: "Urban" },
        { value: "suburban", label: "Suburban" },
        { value: "rural",    label: "Rural" },
      ],
    },
    {
      id: "years",
      type: "single",
      required: true,
      label: "Years in your current role",
      options: [
        { value: "0-2",  label: "0–2"  },
        { value: "3-5",  label: "3–5"  },
        { value: "6-15", label: "6–15" },
        { value: "16+",  label: "16+"  },
      ],
    },
  ],
};

export const teacherSurvey: SurveyDef = {
  role: "teacher",
  title: "HB 6 — Texas Teacher Survey",
  intro:
    "This survey asks Texas teachers how House Bill 6 (89th Legislature, 2025) is playing out in real classrooms. Responses are anonymous. It should take 3–5 minutes.",
  sections: [
    demographicTeacher,
    {
      id: "awareness",
      title: "Awareness & training",
      questions: [
        {
          id: "aware_hb6",
          type: "single",
          required: true,
          label: "Are you aware that HB 6 expanded your authority to remove disruptive students?",
          options: [
            { value: "fully",    label: "Yes, I know the details" },
            { value: "somewhat", label: "Somewhat — I've heard about it" },
            { value: "no",       label: "No, first I'm hearing of it" },
          ],
        },
        {
          id: "training",
          type: "single",
          required: true,
          label: "Has your district provided training on HB 6?",
          options: [
            { value: "full",   label: "Yes — substantive training" },
            { value: "brief",  label: "Brief overview only" },
            { value: "none",   label: "No training" },
            { value: "unsure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      id: "classroom",
      title: "Your classroom this year",
      questions: [
        {
          id: "behavior_trend",
          type: "likert5",
          scale: "direction",
          required: true,
          label: "Compared to last school year, student behavior in my classroom is:",
        },
        {
          id: "safety_trend",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "I feel physically safer in my classroom this year than last year.",
        },
        {
          id: "incidents",
          type: "multi",
          required: false,
          label: "Since August 2025, have any of these happened to you at school? (Select all that apply.)",
          hint: "Leave blank if none.",
          options: [
            { value: "assault",   label: "I was physically assaulted by a student" },
            { value: "threat",    label: "I was threatened by a student" },
            { value: "verbal",    label: "I was verbally abused by a student" },
            { value: "witnessed", label: "I witnessed one of the above happen to a colleague" },
          ],
        },
      ],
    },
    {
      id: "using_hb6",
      title: "Using HB 6",
      questions: [
        {
          id: "removal_used",
          type: "single",
          required: true,
          label: "Since August 2025, have you formally removed a student from your classroom?",
          options: [
            { value: "yes_multi",  label: "Yes, more than once" },
            { value: "yes_once",   label: "Yes, once" },
            { value: "no",         label: "No" },
            { value: "unsure",     label: "Not sure" },
          ],
        },
        {
          id: "admin_support",
          type: "likert5",
          scale: "frequency",
          required: true,
          label: "When I need administrative support on discipline, I receive it:",
        },
        {
          id: "retaliation",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "I feel protected from retaliation when enforcing discipline under HB 6.",
        },
        {
          id: "did_not_remove",
          type: "single",
          required: true,
          label: "Have you ever chosen NOT to use HB 6 removal authority when you could have?",
          options: [
            { value: "yes",    label: "Yes" },
            { value: "no",     label: "No" },
            { value: "unsure", label: "Not sure" },
          ],
        },
        {
          id: "did_not_remove_why",
          type: "multi",
          required: false,
          label: "If yes, why? (Select any that apply — skip if the previous answer was No.)",
          options: [
            { value: "admin_pushback", label: "Administrator wouldn't support me" },
            { value: "paperwork",      label: "Paperwork / process too burdensome" },
            { value: "fear",           label: "Fear of retaliation or pushback" },
            { value: "unaware",        label: "I didn't know I could" },
            { value: "escalation",     label: "I didn't want to escalate" },
            { value: "other",          label: "Other" },
          ],
        },
      ],
    },
    {
      id: "overall",
      title: "Overall impact",
      questions: [
        {
          id: "classroom_safety",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "Overall, HB 6 has improved safety in my classroom.",
        },
        {
          id: "learning_env",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "Overall, HB 6 has improved the learning environment for non-disruptive students.",
        },
        {
          id: "recommend",
          type: "single",
          required: true,
          label: "Would you recommend similar legislation to teachers in other states?",
          options: [
            { value: "yes",   label: "Yes" },
            { value: "maybe", label: "Maybe / needs changes" },
            { value: "no",    label: "No" },
          ],
        },
        {
          id: "right",
          type: "textarea",
          required: false,
          maxLength: 800,
          label: "One thing HB 6 has gotten right — optional",
          hint: "Keep it to a sentence or two.",
        },
        {
          id: "improve",
          type: "textarea",
          required: false,
          maxLength: 800,
          label: "One thing HB 6 needs to improve — optional",
        },
      ],
    },
  ],
};

export const adminSurvey: SurveyDef = {
  role: "administrator",
  title: "HB 6 — Texas Administrator Survey",
  intro:
    "This survey asks Texas school and district administrators about implementing House Bill 6 (89th Legislature, 2025). Responses are anonymous. It should take 3–5 minutes.",
  sections: [
    demographicAdmin,
    {
      id: "implementation",
      title: "Implementation",
      questions: [
        {
          id: "compliance_plan",
          type: "single",
          required: true,
          label: "Has your district adopted a written HB 6 compliance plan?",
          options: [
            { value: "yes",         label: "Yes — adopted" },
            { value: "in_progress", label: "In progress" },
            { value: "no",          label: "No" },
            { value: "unsure",      label: "Not sure" },
          ],
        },
        {
          id: "teacher_training",
          type: "single",
          required: true,
          label: "Have you provided HB 6 training to teachers?",
          options: [
            { value: "full",   label: "Yes — substantive training" },
            { value: "brief",  label: "Brief overview" },
            { value: "no",     label: "No training yet" },
            { value: "unsure", label: "Not sure" },
          ],
        },
        {
          id: "threat_team",
          type: "single",
          required: true,
          label: "Has your threat assessment team met this school year?",
          options: [
            { value: "yes_multi", label: "Yes, multiple times" },
            { value: "yes_once",  label: "Yes, once" },
            { value: "no",        label: "No" },
            { value: "unsure",    label: "Not sure" },
          ],
        },
        {
          id: "judicial_removal",
          type: "single",
          required: true,
          label: "Has your district petitioned for judicial removal under HB 6?",
          options: [
            { value: "yes",    label: "Yes" },
            { value: "no",     label: "No" },
            { value: "unsure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      id: "trends",
      title: "Trends vs. last school year",
      questions: [
        {
          id: "removals_trend",
          type: "likert5",
          scale: "direction",
          required: true,
          label: "Compared to last year, teacher-initiated student removals on your campus are:",
        },
        {
          id: "assaults_trend",
          type: "likert5",
          scale: "direction",
          required: true,
          label: "Compared to last year, staff assaults on your campus are:",
        },
        {
          id: "daep_trend",
          type: "likert5",
          scale: "direction",
          required: true,
          label: "Compared to last year, DAEP placements are:",
        },
        {
          id: "expulsions_trend",
          type: "likert5",
          scale: "direction",
          required: true,
          label: "Compared to last year, expulsions are:",
        },
      ],
    },
    {
      id: "judgment",
      title: "Your judgment",
      questions: [
        {
          id: "teachers_supported",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "Teachers on my campus feel supported when they initiate HB 6 removals.",
        },
        {
          id: "resources",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "My district has adequate funding and staffing to implement HB 6.",
        },
        {
          id: "reducing_violence",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "HB 6 is reducing violence on my campus.",
        },
        {
          id: "harming_vulnerable",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "HB 6 is harming students with disabilities or students experiencing homelessness.",
        },
      ],
    },
    {
      id: "challenges",
      title: "Biggest challenges",
      questions: [
        {
          id: "top_challenges",
          type: "multi",
          required: true,
          max: 3,
          label: "Pick up to three biggest implementation challenges.",
          options: [
            { value: "staffing",       label: "Staffing (CBC, threat team, VEP)" },
            { value: "funding",        label: "Funding" },
            { value: "teacher_pushback", label: "Teacher pushback" },
            { value: "parent_pushback",  label: "Parent/community pushback" },
            { value: "legal",          label: "Legal / compliance burden" },
            { value: "mental_health",  label: "Student mental health needs" },
            { value: "due_process",    label: "Due process concerns" },
            { value: "reporting",      label: "Reporting / data burden" },
            { value: "training",       label: "Staff training" },
            { value: "other",          label: "Other" },
          ],
        },
      ],
    },
    {
      id: "overall",
      title: "Overall impact",
      questions: [
        {
          id: "staff_safety",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "Overall, HB 6 has improved staff safety on my campus.",
        },
        {
          id: "student_outcomes",
          type: "likert5",
          scale: "agree",
          required: true,
          label: "Overall, HB 6 has improved outcomes for non-disruptive students.",
        },
        {
          id: "recommend",
          type: "single",
          required: true,
          label: "Would you recommend HB 6 as a model for other states?",
          options: [
            { value: "yes",   label: "Yes" },
            { value: "maybe", label: "Maybe / needs changes" },
            { value: "no",    label: "No" },
          ],
        },
        {
          id: "biggest_fix",
          type: "textarea",
          required: false,
          maxLength: 800,
          label: "What's the single biggest change that would make HB 6 work better? — optional",
        },
      ],
    },
  ],
};

export const surveys = {
  teacher: teacherSurvey,
  administrator: adminSurvey,
} as const;

export const likertLabels = {
  agree:     ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  frequency: ["Never", "Rarely", "Sometimes", "Usually", "Always"],
  direction: ["Much worse", "Worse", "About the same", "Better", "Much better"],
  safety:    ["Much less safe", "Less safe", "About the same", "Safer", "Much safer"],
} as const;

/** Flatten all question IDs and types for server-side validation. */
export function flattenQuestions(def: SurveyDef): Question[] {
  return def.sections.flatMap((s) => s.questions);
}
