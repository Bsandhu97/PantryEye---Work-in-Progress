// src/utils/theme.js
export const colors = {
  bg:        "#0a0a0f",
  surface:   "#0f172a",
  border:    "#1e293b",
  text:      "#e2e8f0",
  muted:     "#64748b",
  accent:    "#6366f1",
  accentSoft:"#6366f120",
  success:   "#22c55e",
  warning:   "#f59e0b",
  danger:    "#ef4444",
};

export const CATEGORY_COLORS = {
  "Produce":       "#166534",
  "Meat & Seafood":"#7f1d1d",
  "Dairy":         "#713f12",
  "Pantry":        "#7c2d12",
  "Beverages":     "#1e3a5f",
  "Bakery":        "#78350f",
  "Frozen":        "#164e63",
  "Herbs & Spices":"#3f6212",
  "Other":         "#374151",
};

export const CATEGORY_ICONS = {
  "Produce":       "🥦",
  "Meat & Seafood":"🥩",
  "Dairy":         "🧀",
  "Pantry":        "🥫",
  "Beverages":     "🧃",
  "Bakery":        "🍞",
  "Frozen":        "🧊",
  "Herbs & Spices":"🌿",
  "Other":         "📦",
};

export const spacing = { xs:4, sm:8, md:16, lg:24, xl:32 };

export const radius = { sm:8, md:12, lg:16, full:999 };

export const font = {
  size: { xs:11, sm:13, md:15, lg:18, xl:24, xxl:32 },
  weight: { normal:"400", medium:"500", bold:"700", black:"900" },
};
