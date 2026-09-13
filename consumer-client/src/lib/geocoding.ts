import api from "./api"

export const FALLBACK_LABEL = "Location unavailable"

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
	try {
		const response = await api.get("/location/reverse", { params: { lat: latitude, lng: longitude } })
		return response.data.data?.label || FALLBACK_LABEL
	} catch {
		return FALLBACK_LABEL
	}
}
