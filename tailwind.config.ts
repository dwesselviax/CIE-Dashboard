import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        viax: {
          bg: "#F8F7F6",
          green: "#90E9B8",
          "green-dark": "#5CC98A",
          dark: "#2A2A2A",
          copy: "#1E1E1E",
          muted: "#71717A",
          border: "#E4E4E7",
          card: "#FFFFFF",
          danger: "#EF4444",
          "danger-bg": "#FEF2F2",
          warning: "#F59E0B",
          "warning-bg": "#FFFBEB",
          success: "#10B981",
          "success-bg": "#ECFDF5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
