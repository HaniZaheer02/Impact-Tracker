import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const GlobalImpactMap = () => {
    // Example Coordinates
    const center = [20, 0];
    const donorLoc = [43.4643, -80.5204]; // Waterloo, Canada
    const targetLoc = [31.5, 34.4];      // Palestine

    return (
        <MapContainer center={center} zoom={2} style={{ height: '100%', width: '100%', background: '#0B1120' }}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            {/* Line connecting the two */}
            <Polyline positions={[donorLoc, targetLoc]} color="#38BDF8" weight={2} dashArray="5, 10" />

            <Marker position={targetLoc}>
                <Popup>Impact Site: Gaza</Popup>
            </Marker>
        </MapContainer>
    );
};

export default GlobalImpactMap;