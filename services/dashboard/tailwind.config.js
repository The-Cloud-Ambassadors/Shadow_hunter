/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "sh-dark": "#0f172a",
        "sh-panel": "#1e293b",
        "sh-accent": "#38bdf8",
        "sh-alert": "#ef4444",
      },
    },
  },
  plugins: [],
};
