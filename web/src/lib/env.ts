/**
 * Public environment variables used by the Astro frontend at build time.
 * Set these in Netlify's environment variables (Site settings → Env vars).
 */

export const API_URL = (import.meta.env.PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
export const DONATE_URL =
  import.meta.env.PUBLIC_DONATE_URL ??
  "https://www.gofundme.com/f/help-vfsa-make-schools-violencefree-zones";
