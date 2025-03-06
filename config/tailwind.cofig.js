/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class", // Enable dark mode using a class strategy
    theme: {
      extend: {
        colors: {
          primary: "#4F46E5", // Vibrant blue
          secondary: "#8B5CF6", // Soft purple
          background: "#1E1E2E", // Dark mode background
          foreground: "#2A2A3A", // Dark mode foreground
          accent: "#FACC15", // Accent yellow
        },
        boxShadow: {
          neu: "5px 5px 10px #1A1A1A, -5px -5px 10px #262626", // Neumorphism effect
        },
        keyframes: {
          fadeIn: {
            "0%": { opacity: 0 },
            "100%": { opacity: 1 },
          },
          slideUp: {
            "0%": { transform: "translateY(20px)", opacity: 0 },
            "100%": { transform: "translateY(0)", opacity: 1 },
          },
        },
        animation: {
          fadeIn: "fadeIn 0.5s ease-in-out",
          slideUp: "slideUp 0.5s ease-out",
        },
      },
    },
    plugins: [],
  };
  
  