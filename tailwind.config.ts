import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        "custom-yellow": "#e4f96b",
        "custom-green": "#5cd47d",
        "flow-blue": "#60a5fa",
        "charcoal-gray": "#121212",
        "soft-black": "#333333",
        "blueish-black": "#2C2C2C",
      },
    },
  },
  plugins: [],
} satisfies Config;
