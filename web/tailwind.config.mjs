/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        // VFSA brand palette — placeholder values.
        // Swap via CSS variables in src/styles/global.css; these hex values
        // are the fallback when the variables are missing.
        brand: {
          navy: "#0f2c4a",     // primary deep navy
          blue: "#1d4d8c",     // secondary blue
          red:  "#b91c1c",     // accent red (urgency)
          gold: "#d4a017",     // accent gold
          bg:   "#f7f9fc",     // page background
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI",
          "Roboto", "Helvetica Neue", "Arial", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
