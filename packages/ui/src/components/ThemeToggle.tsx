"use client"

import { useEffect, useState } from "react"

type ThemeMode = "system" | "light" | "dark"

export function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("system")

	useEffect(() => {
		const stored = window.localStorage.getItem("spotly-theme") as ThemeMode | null
		const next = stored === "light" || stored === "dark" ? stored : "system"
		setMode(next)
		applyTheme(next)
	}, [])

	const change = (next: ThemeMode) => {
		setMode(next)
		window.localStorage.setItem("spotly-theme", next)
		applyTheme(next)
	}

	return (
		<label className="theme-toggle">
			<span className="sr-only">Color theme</span>
			<select aria-label="Color theme" value={mode} onChange={(event) => change(event.target.value as ThemeMode)}>
				<option value="system">System</option>
				<option value="light">Light</option>
				<option value="dark">Dark</option>
			</select>
		</label>
	)
}

function applyTheme(mode: ThemeMode) {
	const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
	document.documentElement.dataset.theme = dark ? "dark" : "light"
}
