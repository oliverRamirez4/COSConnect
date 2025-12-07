"use client";
import React, { useRef, useState, useEffect, useMemo } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import AddShelterPage, { AddShelterButton} from './addshelter';
import { useShelters } from './hooks/useShelters';
import ShelterSidebar from "./ShelterSidebar";
import { Shelter } from "./types";


export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const markersRef = useRef<any[]>([]);
  const [currentPage, setCurrentPage] = useState<"home" | "add">("home");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
        }
      );
    }
  }, []);

  const { shelters, loading, error } = useShelters();

  useEffect(() => {
    if (!mapContainer.current || !shelters.length) return;
    if (currentPage !== "home") return;
    if (mapRef.current) return;

    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: userLocation ? [userLocation.lng, userLocation.lat] : [-104.8214, 38.8339],
        zoom: 11,
      });
      mapRef.current = map;

      map.on('load', () => {
        setMapLoaded(true);

        // Add shelter markers
        shelters.forEach((shelter) => {
          const marker = new mapboxgl.default.Marker()
            .setLngLat([shelter.longitude, shelter.latitude])
            .addTo(map);

          marker.getElement().addEventListener("click", () => {
            setSelectedShelter(shelter);
          });

          markersRef.current.push(marker);
        });

        // Add user location dot
        if (userLocation) {
          const el = document.createElement('div');
          el.style.width = '14px';
          el.style.height = '14px';
          el.style.background = '#2563eb';
          el.style.border = '2px solid white';
          el.style.borderRadius = '50%';
          el.style.boxShadow = '0 0 4px #2563eb88';
          el.title = 'Your Location';
          new mapboxgl.default.Marker({ element: el })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(map);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, shelters, userLocation]);

  const handleAddShelter = (newShelter: Shelter) => {
    // Optionally, POST to your API to persist the new shelter
    // For now, just update local state
    // setShelters([...shelters, newShelter]);
    setCurrentPage("home");
  };

  if (currentPage === "add") {
    return (
      <AddShelterPage
        onBack={() => setCurrentPage("home")}
        onAdd={handleAddShelter}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-tight">COS Shelter Connect</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm tracking-wide">Homeless Shelter Resource Guide</p>
          <div className="flex gap-4 mb-4">
            <AddShelterButton onClick={() => setCurrentPage("add")} />
            <button
              className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all"
              style={{ height: 44 }}
              onClick={() => window.location.href = '/admin'}
            >
              Shelter Admin
            </button>
          </div>
      <div className="flex items-center justify-center w-full gap-6 px-4">
        <ShelterSidebar
          shelters={shelters}
          selectedShelter={selectedShelter}
          onSelect={setSelectedShelter}
          onBack={() => setSelectedShelter(null)}
          userLocation={userLocation}
        />
        <div
          ref={mapContainer}
          className="w-full max-w-3xl h-[600px] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700"
          style={{ minHeight: 400 }}
        />
      </div>
      {loading && <div>Loading shelters...</div>}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}