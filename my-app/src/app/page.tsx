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
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    families: false,
    single_women: false,
    single_men: false,
    domestic_violence: false,
    pet_friendly: false,
    wheelchair_accessible: false,
    age_min: "",
    age_max: "",
    beds_available_only: false,
  });
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
          {/* Top row: buttons */}
          <div className="w-full max-w-5xl px-4 mb-4">
            <div className="flex gap-4 justify-center items-center">
              <AddShelterButton
                onClick={() => setCurrentPage("add")}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium px-6 rounded-lg shadow-lg transition-all h-11 flex items-center"
              />
              <button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium px-6 rounded-lg shadow-lg transition-all h-11 flex items-center"
                onClick={() => window.location.href = '/admin'}
              >
                Shelter Admin
              </button>
            </div>
          </div>
      <div className="flex items-center justify-center w-full gap-6 px-4 flex-col md:flex-row">
        {/* Map first on mobile */}
        <div
          ref={mapContainer}
          className="w-full md:max-w-3xl h-[400px] sm:h-[500px] md:h-[600px] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 order-1 md:order-none"
          style={{ minHeight: 320 }}
        />
        {/* Sidebar below map on small screens */}
        <ShelterSidebar
          shelters={shelters}
          selectedShelter={selectedShelter}
          onSelect={setSelectedShelter}
          onBack={() => setSelectedShelter(null)}
          userLocation={userLocation}
          filters={{
            searchText,
            families: filters.families,
            single_women: filters.single_women,
            single_men: filters.single_men,
            domestic_violence: filters.domestic_violence,
            pet_friendly: filters.pet_friendly,
            wheelchair_accessible: filters.wheelchair_accessible,
            age_min: filters.age_min,
            age_max: filters.age_max,
            beds_available_only: filters.beds_available_only,
          }}
        />
      </div>
      {/* Filters moved below map and sidebar */}
      <div className="w-full max-w-5xl px-4 mt-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Search input spans full width */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search by name or address"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            {/* Checkboxes */}
            <div className="flex flex-wrap gap-2 lg:gap-3 items-center">
              <label className="flex items-center gap-2 text-xs md:text-sm"><input type="checkbox" checked={filters.families} onChange={(e)=>setFilters(f=>({...f, families:e.target.checked}))} /> Families</label>
              <label className="flex items-center gap-2 text-xs md:text-sm"><input type="checkbox" checked={filters.single_women} onChange={(e)=>setFilters(f=>({...f, single_women:e.target.checked}))} /> Single Women</label>
              <label className="flex items-center gap-2 text-xs md:text-sm"><input type="checkbox" checked={filters.single_men} onChange={(e)=>setFilters(f=>({...f, single_men:e.target.checked}))} /> Single Men</label>
              <label className="flex items-center gap-2 text-xs md:text-sm"><input type="checkbox" checked={filters.domestic_violence} onChange={(e)=>setFilters(f=>({...f, domestic_violence:e.target.checked}))} /> DV Support</label>
              <label className="flex items-center gap-2 text-xs md:text-sm"><input type="checkbox" checked={filters.pet_friendly} onChange={(e)=>setFilters(f=>({...f, pet_friendly:e.target.checked}))} /> Pet Friendly</label>
              <label className="flex items-center gap-2 text-xs md:text-sm"><input type="checkbox" checked={filters.wheelchair_accessible} onChange={(e)=>setFilters(f=>({...f, wheelchair_accessible:e.target.checked}))} /> Wheelchair Accessible</label>
              <label className="flex items-center gap-2 text-xs md:text-sm"><input type="checkbox" checked={filters.beds_available_only} onChange={(e)=>setFilters(f=>({...f, beds_available_only:e.target.checked}))} /> Beds Available Only</label>
            </div>
            {/* Age inputs */}
            <div className="flex flex-wrap gap-2 items-center lg:justify-end">
              <span className="text-xs md:text-sm">Age Min</span>
              <input type="number" min={0} value={filters.age_min} onChange={(e)=>setFilters(f=>({...f, age_min:e.target.value}))} className="w-24 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-800 px-2 py-1 text-sm" />
              <span className="text-xs md:text-sm">Age Max</span>
              <input type="number" min={0} value={filters.age_max} onChange={(e)=>setFilters(f=>({...f, age_max:e.target.value}))} className="w-24 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-800 px-2 py-1 text-sm" />
            </div>
          </div>
        </div>
      </div>
      {loading && <div>Loading shelters...</div>}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}