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
}

export const useLocationStore = create<LocationState>((set, get) => ({
	coords: null,
	permissionGranted: false,
	isLoading: false,
	error: null,
	setCoords: (coords) => set({ coords, error: null }),
	setPermission: (granted) => set({ permissionGranted: granted }),
	setLoading: (loading) => set({ isLoading: loading }),
	setError: (error) => set({ error }),
	requestLocation: async () => {
		set({ isLoading: true, error: null })
		try {
			if (!navigator.geolocation) {
				set({ error: 'Geolocation is not supported', isLoading: false })
				return
			}
			navigator.geolocation.getCurrentPosition(
				(position) => {
					set({
						coords: {
							lat: position.coords.latitude,
							lon: position.coords.longitude,
						},
						permissionGranted: true,
						isLoading: false,
					})
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
