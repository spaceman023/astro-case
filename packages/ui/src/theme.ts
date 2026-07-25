/**
 * Theme + density registry and helpers for the Unified Justice Suite.
 * The theme engine itself lives in ./styles/globals.css — this module is the
 * small runtime that reads/writes `data-theme` / `data-density` on <html> and
 * persists the choice. Dark-first: the default theme is "graphite".
 */

export type ThemeId =
  | "graphite" // default dark
  | "light"
  | "midnight"
  | "nord"
  | "amber"
  | "high-contrast"
  | "system";

export type DensityId = "compact" | "default" | "comfortable";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  scheme: "dark" | "light" | "system";
}

export const THEMES: ThemeMeta[] = [
  { id: "graphite", label: "Graphite", scheme: "dark" },
  { id: "midnight", label: "Midnight", scheme: "dark" },
  { id: "nord", label: "Nord", scheme: "dark" },
  { id: "amber", label: "Amber", scheme: "dark" },
  { id: "high-contrast", label: "High Contrast", scheme: "dark" },
  { id: "light", label: "Light", scheme: "light" },
  { id: "system", label: "System", scheme: "system" },
];

export const DENSITIES: { id: DensityId; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "default", label: "Default" },
  { id: "comfortable", label: "Comfortable" },
];

export const DEFAULT_THEME: ThemeId = "graphite";
export const DEFAULT_DENSITY: DensityId = "default";

const THEME_KEY = "js.theme";
const DENSITY_KEY = "js.density";

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

export function applyDensity(density: DensityId): void {
  const el = document.documentElement;
  // "default" is the base scale — represented by the absence of the attribute.
  if (density === "default") el.removeAttribute("data-density");
  else el.setAttribute("data-density", density);
  try {
    localStorage.setItem(DENSITY_KEY, density);
  } catch {
    /* ignore */
  }
}

/**
 * Inline this string in a <script> in <head> (before first paint) to apply the
 * persisted theme/density and avoid a flash of the default theme (FOUC).
 * SSR renders the default (graphite); this reconciles to the stored preference.
 */
export const themeInitScript = `(function(){try{
  var t=localStorage.getItem("${THEME_KEY}")||"${DEFAULT_THEME}";
  var d=localStorage.getItem("${DENSITY_KEY}")||"${DEFAULT_DENSITY}";
  document.documentElement.setAttribute("data-theme",t);
  if(d&&d!=="default")document.documentElement.setAttribute("data-density",d);
}catch(e){}})();`;
