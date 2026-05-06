export const fmtNum = (n: number | null | undefined, digits = 0) => {
  if (n == null || isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
};
export const fmtMoney = (n: number | null | undefined, currency = "EUR") => {
  if (n == null || isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { style: "currency", currency, maximumFractionDigits: 0 });
};
export const fmtPct = (n: number | null | undefined, digits = 2) => {
  if (n == null || isNaN(Number(n))) return "—";
  return `${Number(n).toFixed(digits)}%`;
};
export const fmtMonth = (d: string | Date, locale?: string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(locale ?? undefined, { month: "long", year: "numeric" });
};
export const fmtMonthShort = (d: string | Date, locale?: string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(locale ?? undefined, { month: "short", year: "numeric" });
};
export const fmtDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
export const delta = (now: number, prior: number) => {
  if (!prior) return { pct: 0, dir: "flat" as const };
  const pct = ((now - prior) / prior) * 100;
  return { pct, dir: pct > 0.5 ? "up" : pct < -0.5 ? "down" : ("flat" as const) };
};
