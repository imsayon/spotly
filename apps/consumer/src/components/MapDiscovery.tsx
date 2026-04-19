"use client"

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const fixLeafletIcons = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
}

interface MapDiscoveryProps {
    merchants: any[]
    center?: [number, number]
    zoom?: number
    onSelect: (merchant: any) => void
    userLocation?: [number, number]
}

function MapResizer() {
    const map = useMap()
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100)
    }, [map])
    return null
}

function RecenterMap({ center }: { center?: [number, number] }) {
    const map = useMap()

    useEffect(() => {
        if (center) {
            map.setView(center)
        }
    }, [map, center])

    return null
}

export default function MapDiscovery({ merchants, center = [12.9716, 77.5946], zoom = 13, onSelect, userLocation }: MapDiscoveryProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        fixLeafletIcons()
        setIsMounted(true)
    }, [])

    if (!isMounted) return <div style={{ height: '400px', background: 'rgba(255,255,255,.05)', borderRadius: 18, border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Experience...</div>

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)', position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapResizer />
                <RecenterMap center={center} />
                {userLocation && (
                    <Marker position={userLocation}>
                        <Popup>
                            <div style={{ color: '#000', fontWeight: 700 }}>You are here</div>
                        </Popup>
                    </Marker>
                )}
                {merchants.map((m) => {
                    // Collect all pins (main location + outlets)
                    const pins: any[] = []
                    if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) pins.push({ lat: m.lat, lng: m.lng, label: m.name, isMain: true })
                    if (m.outlets) {
                        m.outlets.forEach((o: any) => {
                            if (Number.isFinite(o.lat) && Number.isFinite(o.lng)) pins.push({ lat: o.lat, lng: o.lng, label: `${m.name} - ${o.name}`, id: o.id })
                        })
                    }

                    return pins.map((p, idx) => (
                        <Marker 
                            key={`${m.id}-${idx}`} 
                            position={[p.lat, p.lng]}
                            eventHandlers={{
                                click: () => onSelect(m)
                            }}
                        >
                            <Popup className="spotly-popup">
                                <div style={{ color: '#000', padding: '4px' }}>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>{p.label}</div>
                                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{m.category}</div>
                                    <button 
                                        style={{ marginTop: 8, background: '#1fd97c', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                                        onClick={() => onSelect(m)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))
                })}
            </MapContainer>
        </div>
    )
}
