/** Preset palette for job color tags — muted tones that match the app's
 * existing earthy theme (mist/wisteria/glaucous/dusk/deepteal/shamrock in
 * index.css), extended with a couple more distinguishable hues so up to 8
 * concurrent jobs can each get a visually distinct tag. */
export const JOB_COLOR_PALETTE = [
  '#4c9f70', // shamrock
  '#40476d', // dusk
  '#9cafb7', // wisteria
  '#c99a3e', // gold
  '#b5606a', // rose
  '#6a8caf', // steel blue
  '#a97c50', // clay
  '#7d6a9e', // plum
]

/** Deterministic fallback color for a job that has no color set, so shift
 * rows still show a consistent (if generic) dot instead of nothing. */
export function fallbackJobColor(jobId: number): string {
  return JOB_COLOR_PALETTE[jobId % JOB_COLOR_PALETTE.length]
}

/** Picks the next palette color not already used by an existing job, so a
 * newly created job defaults to something visually distinct rather than
 * always defaulting to the same first swatch. */
export function nextUnusedColor(usedColors: (string | null)[]): string {
  const used = new Set(usedColors.filter(Boolean))
  const unused = JOB_COLOR_PALETTE.find((c) => !used.has(c))
  return unused ?? JOB_COLOR_PALETTE[usedColors.length % JOB_COLOR_PALETTE.length]
}
