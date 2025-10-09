/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",  // your main button color
        secondary: "#6366f1", // optional
        danger: "#dc2626",    // for error buttons/alerts
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#4f46e5",
          secondary: "#6366f1",
          accent: "#fbbf24",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          info: "#3b82f6",
          success: "#16a34a",
          warning: "#f59e0b",
          error: "#dc2626",
        },
      },
      "dark", // you can keep the default dark theme as well
    ],
    darkTheme: "dark",
  },
};
