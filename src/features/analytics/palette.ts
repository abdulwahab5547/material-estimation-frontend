/**
 * Shared chart palette — keeps all Recharts surfaces on-brand.
 * Colors match the Tailwind/CSS custom props so charts look native to the
 * rest of the app regardless of theme.
 */

export const CHART_PRIMARY = "#F59E0B"; // amber accent
export const CHART_SECONDARY = "#0EA5E9"; // sky / cyan
export const CHART_SUCCESS = "#10B981";
export const CHART_WARN = "#EF4444";

export const GRID_LINE = "rgba(148, 163, 184, 0.15)";
export const AXIS_TICK = "rgba(148, 163, 184, 0.8)";

/** Ordered category palette for donuts and stacked bars. */
export const CATEGORY_COLORS = [
  "#F59E0B", // amber
  "#0EA5E9", // sky
  "#10B981", // emerald
  "#A78BFA", // violet
  "#EF4444", // red
  "#64748B", // slate
];

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  background: "rgba(11, 18, 34, 0.95)",
  border: "1px solid rgba(30, 41, 59, 0.8)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  color: "rgb(226, 232, 240)",
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
};

export const TOOLTIP_ITEM_STYLE: React.CSSProperties = {
  color: "rgb(226, 232, 240)",
  fontSize: 12,
};

export const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: "rgb(148, 163, 184)",
  fontSize: 11,
  marginBottom: 4,
};
