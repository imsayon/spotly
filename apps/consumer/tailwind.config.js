/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			colors: {
				background: "#0a0a0a",
				surface: "#141414",
				border: "rgba(255, 255, 255, 0.08)",
				brand: {
					50: "#fefce8",
					100: "#fef9c3",
					200: "#fef08a",
					300: "#fde047",
					400: "#facc15",
					500: "#eab308",
					600: "#ca8a04",
					700: "#a16207",
					800: "#854d0e",
					900: "#713f12",
					950: "#422006",
				},
			},
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic":
					"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
				"gradient-brand":
					"linear-gradient(135deg, #facc15 0%, #ff6b35 100%)",
				"gradient-brand-reverse":
					"linear-gradient(135deg, #ff6b35 0%, #facc15 100%)",
			},
			fontFamily: {
				sans: ["var(--font-sans)", "system-ui", "sans-serif"],
			},
			animation: {
				"fade-in": "fadeIn 0.5s ease-out forwards",
				"slide-up": "slideUp 0.5s ease-out forwards",
				"pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				float: "float 6s ease-in-out infinite",
			},
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				slideUp: {
					"0%": { opacity: "0", transform: "translateY(20px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-20px)" },
				},
			},
		},
	},
	plugins: [],
}
