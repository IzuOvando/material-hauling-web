import type { CSSProperties } from "react";
import type { WhiteLabelConfig } from "#/white-label.config";

/**
 * Converts a "#rrggbb" hex color to the "r g b" space-separated channel format
 * Tailwind's `rgb(var(--x) / <alpha-value>)` opacity syntax requires (see
 */

function hexToRgbChannels(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Maps the white-label config's theme (hex, the single source of truth) to the
 * CSS custom properties consumed by Tailwind (`--primary-color`/`--secondary-color`/
 * `--accent-color`, see tailwind.config.ts).
 */

export function getThemeCssVars(config: WhiteLabelConfig): CSSProperties {
  return {
    "--primary-color": hexToRgbChannels(config.theme.primary),
    "--secondary-color": hexToRgbChannels(config.theme.secondary),
    "--accent-color": hexToRgbChannels(config.theme.accent),
  } as CSSProperties;
}
