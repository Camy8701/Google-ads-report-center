type Urgency = "urgent" | "medium" | "good" | "info" | "summary";
type ReportStatus = "draft" | "in_review" | "approved" | "exported";
type ReportingStatus = "on_track" | "due_soon" | "overdue" | "paused";

const urgencyMap: Record<Urgency, { color: string; label: string }> = {
  urgent: { color: "bg-status-urgent/15 text-status-urgent border-status-urgent/30", label: "Urgent" },
  medium: { color: "bg-status-medium/15 text-status-medium border-status-medium/30", label: "Medium" },
  good: { color: "bg-status-good/15 text-status-good border-status-good/30", label: "Good" },
  info: { color: "bg-muted text-muted-foreground border-border", label: "Info" },
  summary: { color: "bg-primary/15 text-primary border-primary/30", label: "Summary" },
};

const reportStatusMap: Record<ReportStatus, { color: string; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground border-border", label: "Draft" },
  in_review: { color: "bg-status-medium/15 text-status-medium border-status-medium/30", label: "In review" },
  approved: { color: "bg-status-good/15 text-status-good border-status-good/30", label: "Approved" },
  exported: { color: "bg-primary/15 text-primary border-primary/30", label: "Exported" },
};

const reportingStatusMap: Record<ReportingStatus, { color: string; label: string }> = {
  on_track: { color: "bg-status-good/15 text-status-good border-status-good/30", label: "On track" },
  due_soon: { color: "bg-status-medium/15 text-status-medium border-status-medium/30", label: "Due soon" },
  overdue: { color: "bg-status-urgent/15 text-status-urgent border-status-urgent/30", label: "Overdue" },
  paused: { color: "bg-muted text-muted-foreground border-border", label: "Paused" },
};

type Variant = "urgency" | "report" | "reporting";

export const StatusBadge = ({ value, variant = "urgency", className = "" }: { value: string; variant?: Variant; className?: string }) => {
  const map: any = variant === "report" ? reportStatusMap : variant === "reporting" ? reportingStatusMap : urgencyMap;
  const cfg = map[value] ?? { color: "bg-muted text-muted-foreground border-border", label: value };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium tracking-wide uppercase ${cfg.color} ${className}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
};
