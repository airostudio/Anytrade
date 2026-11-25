import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy token names, remapped onto the "Modern Australian Heritage & Craft"
        // palette so every inner page picks up the new look without per-page edits.
        // ink = charcoal, canvas = alabaster, safety = terracotta (CTAs), oxide =
        // terracotta-deep (4.9:1 under white), navy = warm slate, bottle = eucalyptus.
        ink: {
          DEFAULT: "#18181B",
          soft: "#3F3F46",
          mute: "#52525B",
        },
        canvas: {
          DEFAULT: "#FAF9F6",
          deep: "#F2EFE8",
          dark: "#E4E0D6",
        },
        manila: {
          DEFAULT: "#F2EFE8",
          dark: "#E4E0D6",
        },
        navy: {
          DEFAULT: "#2B3036",
          deep: "#1F2429",
          light: "#3C434A",
        },
        oxide: {
          DEFAULT: "#B8431F",
          deep: "#8F3317",
          light: "#C9552F",
        },
        safety: {
          DEFAULT: "#D95D39",
          soft: "#F4B09A",
          deep: "#B8431F",
          light: "#E3694A",
        },
        mustard: {
          DEFAULT: "#F3E3C3",
          deep: "#8A5A12",
        },
        bottle: {
          DEFAULT: "#15803D",
          deep: "#106A31",
        },
        khaki: "#847754",
        steel: "#7B8A96",

        // "Modern Australian Heritage & Craft" — the homepage system.
        // Contrast-checked: charcoal on terracotta is 4.7:1, terracotta-deep
        // on white 5.4:1, verified on white 5.0:1.
        charcoal: {
          DEFAULT: "#18181B",
          soft: "#3F3F46",
          mute: "#52525B",
        },
        alabaster: {
          DEFAULT: "#FAF9F6",
          deep: "#F2EFE8",
        },
        terracotta: {
          DEFAULT: "#D95D39",
          hover: "#E3694A",
          deep: "#B8431F",
          tint: "#FBEDE7",
        },
        verified: {
          DEFAULT: "#15803D",
          deep: "#106A31",
          tint: "#E8F3EC",
        },
        hairline: "#E4E0D6",

        // The Homegirls Network page: warm botanical slate, cream, sage and copper.
        // Copper is #C96A42; its button text is near-black (4.9:1), because white
        // on that copper is only 3.7:1. Sage text always uses sage-deep (7:1 on white).
        hg: {
          ink: "#1F2429",
          slate: "#2B3036",
          cream: "#F6F3EE",
          paper: "#FAF8F5",
          sage: "#687864",
          "sage-deep": "#4E5D4B",
          "sage-tint": "#E9EEE6",
          "sage-light": "#B9C4B5",
          copper: "#C96A42",
          "copper-hover": "#D4784F",
          "copper-deep": "#A9532E",
          "on-copper": "#14181B",
          line: "#E3DED5",
        },
      },
      fontFamily: {
        // Legacy family names now resolve to the new pairing.
        display: ["'Fraunces Variable'", "Georgia", "'Times New Roman'", "serif"],
        sign: ["'Figtree Variable'", "system-ui", "-apple-system", "'Segoe UI'", "Roboto", "sans-serif"],
        body: ["'Figtree Variable'", "system-ui", "-apple-system", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        // Self-hosted via @fontsource-variable, imported in app/layout.tsx
        heritage: ["'Fraunces Variable'", "Georgia", "'Times New Roman'", "serif"],
        ui: ["'Figtree Variable'", "system-ui", "-apple-system", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      boxShadow: {
        // Legacy "hard" shadow names are now soft elevation.
        hard: "0 1px 2px rgba(24,24,27,.05), 0 10px 28px -14px rgba(24,24,27,.16)",
        "hard-sm": "0 1px 2px rgba(24,24,27,.06), 0 4px 12px -6px rgba(24,24,27,.14)",
        "hard-lg": "0 2px 4px rgba(24,24,27,.06), 0 18px 40px -16px rgba(24,24,27,.24)",
        "hard-navy": "0 1px 2px rgba(24,24,27,.05), 0 10px 28px -14px rgba(24,24,27,.16)",
        "hard-oxide": "0 1px 2px rgba(24,24,27,.05), 0 10px 28px -14px rgba(24,24,27,.16)",
        card: "0 1px 2px rgba(24,24,27,.05), 0 10px 28px -14px rgba(24,24,27,.16)",
        lift: "0 2px 4px rgba(24,24,27,.06), 0 18px 40px -16px rgba(24,24,27,.24)",
        enamel: "inset 0 0 0 3px #FBF4E6, inset 0 0 0 6px currentColor",
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E\")",
        "diag-stripe":
          "repeating-linear-gradient(45deg, #E8730C 0 14px, #1B1714 14px 28px)",
      },
      keyframes: {
        swing: {
          "0%, 100%": { transform: "rotate(-1.6deg)" },
          "50%": { transform: "rotate(1.6deg)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "drawer-in": {
          from: { transform: "translateX(24px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        swing: "swing 5s ease-in-out infinite",
        "slide-up": "slide-up .35s ease-out both",
        "fade-in": "fade-in .2s ease-out both",
        "drawer-in": "drawer-in .25s ease-out both",
      },
    },
  },
  plugins: [],
}
export default config
