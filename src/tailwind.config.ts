
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7B68EE",
          50: "#F3F1FF",
          100: "#E8E3FF",
          200: "#D1C7FF",
          300: "#BAABFF",
          400: "#A390FF",
          500: "#7B68EE",
          600: "#5B47D9",
          700: "#4532B8",
          800: "#2F2297",
          900: "#1F177B",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#6495ED",
          50: "#F0F5FF",
          100: "#E1EBFF",
          200: "#C3D7FF",
          300: "#A5C3FF",
          400: "#87AFFF",
          500: "#6495ED",
          600: "#3975E8",
          700: "#1E5AC8",
          800: "#1343A1",
          900: "#0D2F7A",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "#87CEFA",
          50: "#F7FCFF",
          100: "#EFF9FF",
          200: "#DFF3FF",
          300: "#CFEDFF",
          400: "#BFE7FF",
          500: "#87CEFA",
          600: "#4FB8F0",
          700: "#2AA1E0",
          800: "#1D7DB5",
          900: "#155D8A",
          foreground: "hsl(var(--accent-foreground))",
        },
        school: {
          light: "#87CEFA",
          steel: "#6495ED", 
          primary: "#7B68EE",
          sky: "#4B9CD3",
          background: "linear-gradient(135deg, #7B68EE 0%, #4B9CD3 100%)"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        'school-gradient': 'linear-gradient(135deg, #7B68EE 0%, #6495ED 25%, #87CEFA 75%, #4B9CD3 100%)',
        'school-gradient-light': 'linear-gradient(135deg, rgba(123, 104, 238, 0.08) 0%, rgba(100, 149, 237, 0.08) 25%, rgba(135, 206, 250, 0.08) 75%, rgba(75, 156, 211, 0.08) 100%)',
        'school-gradient-card': 'linear-gradient(135deg, rgba(123, 104, 238, 0.05) 0%, rgba(135, 206, 250, 0.05) 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
