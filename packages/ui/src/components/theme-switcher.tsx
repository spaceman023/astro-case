"use client";

import * as React from "react";
import {
  THEMES,
  DENSITIES,
  applyTheme,
  applyDensity,
  DEFAULT_THEME,
  DEFAULT_DENSITY,
  type ThemeId,
  type DensityId,
} from "../theme";
import { cn } from "../lib/utils";

const selectCls =
  "h-[var(--control-h)] rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Small controlled selects for theme + density. Reads the current value from
 *  the <html> attributes on mount so it stays in sync with the no-FOUC script. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<ThemeId>(DEFAULT_THEME);
  const [density, setDensity] = React.useState<DensityId>(DEFAULT_DENSITY);

  React.useEffect(() => {
    const el = document.documentElement;
    setTheme((el.getAttribute("data-theme") as ThemeId) || DEFAULT_THEME);
    setDensity(
      (el.getAttribute("data-density") as DensityId) || DEFAULT_DENSITY,
    );
  }, []);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Theme
        <select
          className={selectCls}
          value={theme}
          onChange={(e) => {
            const next = e.target.value as ThemeId;
            setTheme(next);
            applyTheme(next);
          }}
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Density
        <select
          className={selectCls}
          value={density}
          onChange={(e) => {
            const next = e.target.value as DensityId;
            setDensity(next);
            applyDensity(next);
          }}
        >
          {DENSITIES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
