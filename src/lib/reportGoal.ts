export type ReportGoal = "sales" | "leads" | "growth" | "awareness" | "website_traffic";
export type ReportGoalFamily = "ecommerce" | "lead_gen" | "growth";

const REPORT_GOAL_META = /^\s*<!--\s*report_goal:([a-z_]+)\s*-->\s*/i;
const VALID_GOALS: ReportGoal[] = ["sales", "leads", "growth", "awareness", "website_traffic"];

// Legacy values that may still be persisted in brand_notes meta or elsewhere
const LEGACY_GOAL_MAP: Record<string, ReportGoal> = {
  ecommerce: "sales",
  lead_gen: "leads",
};

const normalizeGoal = (raw?: string | null): ReportGoal | null => {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if ((VALID_GOALS as string[]).includes(v)) return v as ReportGoal;
  if (LEGACY_GOAL_MAP[v]) return LEGACY_GOAL_MAP[v];
  return null;
};

export const getDefaultReportGoal = (businessType?: string): ReportGoal => {
  switch (businessType) {
    case "ecommerce":
      return "sales";
    case "lead_gen":
    case "local_services":
      return "leads";
    case "saas":
      return "growth";
    default:
      return "leads";
  }
};

export const getClientReportGoal = (brandNotes?: string | null, businessType?: string): ReportGoal => {
  const match = brandNotes?.match(REPORT_GOAL_META);
  const parsed = normalizeGoal(match?.[1]);
  if (parsed) return parsed;
  return getDefaultReportGoal(businessType);
};

export const getVisibleBrandNotes = (brandNotes?: string | null) =>
  (brandNotes || "").replace(REPORT_GOAL_META, "").trim();

export const withReportGoalMeta = (brandNotes: string, reportGoal: ReportGoal) => {
  const cleanNotes = getVisibleBrandNotes(brandNotes);
  return `<!-- report_goal:${reportGoal} -->\n${cleanNotes}`.trim();
};

export const getBusinessTypeLabel = (businessType?: string | null) => {
  switch (businessType) {
    case "ecommerce":
      return "Ecommerce";
    case "lead_gen":
      return "Lead gen";
    case "local_services":
      return "Local services";
    case "saas":
      return "SaaS";
    default:
      return "—";
  }
};

export const getReportGoalLabel = (reportGoal: ReportGoal) => {
  switch (reportGoal) {
    case "sales":
      return "Sales";
    case "leads":
      return "Leads";
    case "growth":
      return "Growth";
    case "awareness":
      return "Awareness";
    case "website_traffic":
      return "Website traffic";
  }
};

// Maps the user-facing reporting goal to the internal "family" used by the
// report rendering logic (which currently branches on ecommerce / lead_gen / growth).
export const getReportGoalFamily = (reportGoal: ReportGoal): ReportGoalFamily => {
  switch (reportGoal) {
    case "sales":
      return "ecommerce";
    case "leads":
      return "lead_gen";
    case "growth":
    case "awareness":
    case "website_traffic":
      return "growth";
  }
};
