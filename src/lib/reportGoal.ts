export type ReportGoal = "ecommerce" | "lead_gen" | "growth";

const REPORT_GOAL_META = /^\s*<!--\s*report_goal:(ecommerce|lead_gen|growth)\s*-->\s*/i;

export const getDefaultReportGoal = (businessType?: string): ReportGoal =>
  businessType === "ecommerce" ? "ecommerce" : "lead_gen";

export const getClientReportGoal = (brandNotes?: string | null, businessType?: string): ReportGoal => {
  const match = brandNotes?.match(REPORT_GOAL_META);
  if (match?.[1]) return match[1].toLowerCase() as ReportGoal;
  return getDefaultReportGoal(businessType);
};

export const getVisibleBrandNotes = (brandNotes?: string | null) =>
  (brandNotes || "").replace(REPORT_GOAL_META, "").trim();

export const withReportGoalMeta = (brandNotes: string, reportGoal: ReportGoal) => {
  const cleanNotes = getVisibleBrandNotes(brandNotes);
  return `<!-- report_goal:${reportGoal} -->\n${cleanNotes}`.trim();
};

export const getReportGoalLabel = (reportGoal: ReportGoal) => {
  switch (reportGoal) {
    case "ecommerce":
      return "Ecommerce";
    case "lead_gen":
      return "Lead gen";
    case "growth":
      return "Growth";
  }
};
