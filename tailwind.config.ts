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
        // Old-school worksite palette: enamel signs, oxide primer, manila dockets
        ink: {
          DEFAULT: "#1B1714",
          soft: "#3A322B",
          mute: "#6B5F53",
        },
        canvas: {
          DEFAULT: "#FBF4E6",
          deep: "#F3E7CE",
          dark: "#E7D7B6",
        },
        manila: {
          DEFAULT: "#EBD9B4",
          dark: "#D8C296",
        },
        navy: {
          DEFAULT: "#1E3A5C",
          deep: "#152B45",
          light: "#2E5583",
        },
        oxide: {
          DEFAULT: "#A6371F",
          deep: "#7E2715",
          light: "#C4573C",
        },
        safety: {
          DEFAULT: "#E8730C",
          deep: "#C25A05",
          light: "#F7A03F",
        },
        mustard: {
          DEFAULT: "#DFA425",
          deep: "#B8831A",
        },
        bottle: {
          DEFAULT: "#2C5449",
          deep: "#1E3B33",
        },
        khaki: "#847754",
        steel: "#7B8A96",
      },
      fontFamily: {
        display: ["'Alfa Slab One'", "Rockwell", "'Courier Bold'", "Georgia", "serif"],
        sign: ["Oswald", "'Arial Narrow'", "Impact", "sans-serif"],
        body: ["Barlow", "'Helvetica Neue'", "Arial", "sans-serif"],
        mono: ["'Courier Prime'", "'Courier New'", "monospace"],
      },
      boxShadow: {
        hard: "4px 4px 0 0 #1B1714",
        "hard-sm": "2px 2px 0 0 #1B1714",
        "hard-lg": "7px 7px 0 0 #1B1714",
        "hard-navy": "4px 4px 0 0 #1E3A5C",
        "hard-oxide": "4px 4px 0 0 #A6371F",
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
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        swing: "swing 5s ease-in-out infinite",
        "slide-up": "slide-up .35s ease-out both",
      },
    },
  },
  plugins: [],
}
export default config
