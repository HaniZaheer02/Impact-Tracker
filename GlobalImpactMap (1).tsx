/// <reference types="google.maps" />
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { db } from '../firebase/index';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

// ── YOUR Google Maps API key ──────────────────────────────────
// Replace with your own key from https://console.cloud.google.com
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// ── Region coordinates lookup ──────────────────────────────────
const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  'Palestine':   { lat: 31.5,   lng: 34.47 },
  'Sudan':       { lat: 15.5,   lng: 32.56 },
  'Congo':       { lat: -4.04,  lng: 21.76 },
  'Syria':       { lat: 34.80,  lng: 38.99 },
  'Lebanon':     { lat: 33.85,  lng: 35.86 },
  'Pakistan':    { lat: 30.38,  lng: 69.35 },
  'Afghanistan': { lat: 33.94,  lng: 67.71 },
};

// Simulated donor origin cities
const DONOR_ORIGINS: { lat: number; lng: number }[] = [
  { lat: 43.46, lng: -80.52 },  // Waterloo, Canada
  { lat: 40.71, lng: -74.01 },  // New York, USA
  { lat: 51.51, lng: -0.13  },  // London, UK
  { lat: 48.86, lng: 2.35   },  // Paris, France
  { lat: 35.68, lng: 139.69 },  // Tokyo, Japan
  { lat: 1.35,  lng: 103.82 },  // Singapore
  { lat: -33.87, lng: 151.21 }, // Sydney, Australia
  { lat: 25.20, lng: 55.27  },  // Dubai, UAE
  { lat: 52.52, lng: 13.41  },  // Berlin, Germany
  { lat: 37.77, lng: -122.42 }, // San Francisco, USA
];

// ── Donation arc interface ─────────────────────────────────────
interface DonationArc {
  id: string;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  donorName: string;
  amount: number;
  region: string;
  type: string;
  isNew?: boolean;
}

// ── Generate curved arc between two points ─────────────────────
function generateArc(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints = 50
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const lngDiff = Math.abs(end.lng - start.lng);
  const curvature = Math.min(lngDiff * 0.15, 25);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    const arcOffset = curvature * Math.sin(Math.PI * t);
    points.push({ lat: lat + arcOffset, lng });
  }
  return points;
}

// ── Polylines & Markers drawn on the map ───────────────────────
const MapContent = ({ arcs, impactSites }: {
  arcs: DonationArc[];
  impactSites: Map<string, { coord: { lat: number; lng: number }; total: number; count: number }>;
}) => {
  const map = useMap();
  const coreLib = useMapsLibrary('core');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [dashOffset, setDashOffset] = useState(0);

  // Animate dash offset
  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(prev => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Draw polylines and markers
  useEffect(() => {
    if (!map || !coreLib) return;

    // Clear previous
    polylinesRef.current.forEach(p => p.setMap(null));
    markersRef.current.forEach(m => m.setMap(null));
    polylinesRef.current = [];
    markersRef.current = [];

    // Draw arcs
    arcs.forEach((arc) => {
      const path = generateArc(arc.from, arc.to);
      const color = arc.isNew ? '#00D2FF' : '#38BDF8';
      const weight = arc.isNew ? 3 : 1.5;
      const opacity = arc.isNew ? 0.9 : 0.5;

      // Glow line
      const glow = new google.maps.Polyline({
        path,
        geodesic: false,
        strokeColor: color,
        strokeOpacity: opacity * 0.3,
        strokeWeight: weight + 2,
        map,
      });
      polylinesRef.current.push(glow);

      // Main dashed line
      const line = new google.maps.Polyline({
        path,
        geodesic: false,
        strokeColor: color,
        strokeOpacity: 0,
        strokeWeight: weight,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: opacity,
            strokeColor: color,
            scale: weight,
          },
          offset: `${dashOffset}%`,
          repeat: '20px',
        }],
        map,
      });
      polylinesRef.current.push(line);
    });

    // Donor origin markers (cyan circles)
    const donorPoints = new window.Map<string, { coord: { lat: number; lng: number }; count: number }>();
    arcs.forEach(arc => {
      const key = `${arc.from.lat},${arc.from.lng}`;
      const existing = donorPoints.get(key);
      if (existing) existing.count += 1;
      else donorPoints.set(key, { coord: arc.from, count: 1 });
    });

    donorPoints.forEach(({ coord, count }) => {
      const marker = new google.maps.Marker({
        position: coord,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5 + count,
          fillColor: '#00D2FF',
          fillOpacity: 0.8,
          strokeColor: '#00D2FF',
          strokeWeight: 2,
          strokeOpacity: 0.4,
        },
        title: `Donor Origin (${count} donation${count > 1 ? 's' : ''})`,
      });
      markersRef.current.push(marker);
    });

    // Impact site markers (green circles)
    impactSites.forEach(({ coord, total, count }, region) => {
      const marker = new google.maps.Marker({
        position: coord,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7 + Math.min(total / 100, 10),
          fillColor: '#10B981',
          fillOpacity: 0.8,
          strokeColor: '#10B981',
          strokeWeight: 2,
          strokeOpacity: 0.4,
        },
        title: `📍 ${region} — $${total.toLocaleString()} across ${count} donation${count > 1 ? 's' : ''}`,
      });
      markersRef.current.push(marker);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
      markersRef.current.forEach(m => m.setMap(null));
    };
  }, [map, coreLib, arcs, impactSites, dashOffset]);

  return null;
};

// ── Main Map Component ─────────────────────────────────────────
const GlobalImpactMap = () => {
  const [arcs, setArcs] = useState<DonationArc[]>([]);
  const [impactSites, setImpactSites] = useState<Map<string, { coord: { lat: number; lng: number }; total: number; count: number }>>(new window.Map());

  useEffect(() => {
    const q = query(
      collection(db, 'donations'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newArcs: DonationArc[] = [];
      const sites = new window.Map<string, { coord: { lat: number; lng: number }; total: number; count: number }>();

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const region = data.region || 'Palestine';
        const targetCoord = REGION_COORDS[region] || REGION_COORDS['Palestine'];
        const originIndex = index % DONOR_ORIGINS.length;
        const fromCoord = DONOR_ORIGINS[originIndex];

        newArcs.push({
          id: doc.id,
          from: fromCoord,
          to: targetCoord,
          donorName: data.anonymous ? 'Anonymous' : (data.donorName || 'Donor'),
          amount: data.amount || 0,
          region,
          type: data.type || 'General',
          isNew: index < 3,
        });

        const existing = sites.get(region);
        if (existing) {
          existing.total += data.amount || 0;
          existing.count += 1;
        } else {
          sites.set(region, { coord: targetCoord, total: data.amount || 0, count: 1 });
        }
      });

      setArcs(newArcs);
      setImpactSites(sites);
    }, (error) => {
      console.error('Map data error:', error);
      // Demo fallback
      setArcs([
        { id: 'demo-1', from: DONOR_ORIGINS[0], to: REGION_COORDS['Palestine'], donorName: 'Demo Donor', amount: 100, region: 'Palestine', type: 'Food Aid', isNew: true },
        { id: 'demo-2', from: DONOR_ORIGINS[2], to: REGION_COORDS['Sudan'], donorName: 'Anonymous', amount: 250, region: 'Sudan', type: 'Medical Supplies', isNew: false },
        { id: 'demo-3', from: DONOR_ORIGINS[1], to: REGION_COORDS['Syria'], donorName: 'Generous Soul', amount: 500, region: 'Syria', type: 'Shelter', isNew: false },
      ]);

      const demoSites = new window.Map<string, { coord: { lat: number; lng: number }; total: number; count: number }>();
      demoSites.set('Palestine', { coord: REGION_COORDS['Palestine'], total: 100, count: 1 });
      demoSites.set('Sudan', { coord: REGION_COORDS['Sudan'], total: 250, count: 1 });
      demoSites.set('Syria', { coord: REGION_COORDS['Syria'], total: 500, count: 1 });
      setImpactSites(demoSites);
    });

    return () => unsubscribe();
  }, []);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={{ lat: 20, lng: 10 }}
        defaultZoom={2}
        minZoom={2}
        maxZoom={8}
        mapId="donation-impact-map"
        style={{ width: '100%', height: '100%' }}
        backgroundColor="#0B1120"
        disableDefaultUI={true}
        styles={[
          { elementType: 'geometry', stylers: [{ color: '#0B1120' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8B9DC3' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0B1120' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0f1e' }] },
          { featureType: 'road', stylers: [{ visibility: 'off' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
          { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111827' }] },
        ]}
      >
        <MapContent arcs={arcs} impactSites={impactSites} />
      </Map>
    </APIProvider>
  );
};

export default GlobalImpactMap;
