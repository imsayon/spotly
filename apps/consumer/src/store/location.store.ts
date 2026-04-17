import { create } from 'zustand'

interface LocationState {
	coords: { lat: number; lon: number } | null
	permissionGranted: boolean
	isLoading: boolean
	error: string | null
	setCoords: (coords: { lat: number; lon: number }) => void
	setPermission: (granted: boolean) => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	requestLocation: () => Promise<void>
	initFromSession: () => void
}

export const useLocationStore = create<LocationState>((set, get) => ({
	coords: null,
	permissionGranted: false,
	isLoading: false,
	error: null,
	setCoords: (coords) => {
		set({ coords, error: null })
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('spotly_coords', JSON.stringify(coords))
		}
	},
	setPermission: (granted) => {
		set({ permissionGranted: granted })
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('spotly_perm', granted.toString())
		}
	},
	setLoading: (loading) => set({ isLoading: loading }),
	setError: (error) => set({ error }),
	initFromSession: () => {
		if (typeof window === 'undefined') return
		const savedCoords = sessionStorage.getItem('spotly_coords')
		const savedPerm = sessionStorage.getItem('spotly_perm')
		if (savedCoords) {
			set({ coords: JSON.parse(savedCoords), permissionGranted: savedPerm === 'true' })
		}
	},
	requestLocation: async () => {
		set({ isLoading: true, error: null })
		try {
			if (!navigator.geolocation) {
				set({ error: 'Geolocation is not supported', isLoading: false })
				return
			}
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const coords = {
						lat: position.coords.latitude,
						lon: position.coords.longitude,
					}
					set({
						coords,
						permissionGranted: true,
						isLoading: false,
					})
					sessionStorage.setItem('spotly_coords', JSON.stringify(coords))
					sessionStorage.setItem('spotly_perm', 'true')
				},
				(error) => {
					let errorMsg = 'Failed to get location'
					if (error.code === error.PERMISSION_DENIED) {
						errorMsg = 'Location permission denied'
					} else if (error.code === error.POSITION_UNAVAILABLE) {
						errorMsg = 'Position unavailable'
					} else if (error.code === error.TIMEOUT) {
						errorMsg = 'Location request timed out'
					}
					set({ error: errorMsg, isLoading: false })
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
			)
		} catch (err) {
			set({ error: 'Failed to request location', isLoading: false })
		}
	},
}))
