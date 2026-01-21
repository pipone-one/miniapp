import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#06070a",
          900: "#0c0f14",
          800: "#141922",
          700: "#1c2230"
        },
        neon: {
          blue: "#44d4ff",
          purple: "#9a63ff",
          green: "#39ff9c",
          amber: "#ff9b3d"
        }
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 25px rgba(68, 212, 255, 0.25)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")]
} satisfies Config;
