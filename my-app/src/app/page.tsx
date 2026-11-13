"use client";
import React, { useRef, useState, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import AddShelterPage, { AddShelterButton} from './addshelter';
import { useShelters } from './hooks/useShelters';
import ShelterSidebar from "./ShelterSidebar";
import { Shelter } from "./types";
import { withBase } from "../lib/paths";

const SHELTER_AREA: [number, number] = [-104.8214, 38.8339];

const SERVICE_FILTERS = [
  ["families", "Families"],
  ["single_women", "Single women"],
  ["single_men", "Single men"],
  ["domestic_violence", "DV support"],
  ["pet_friendly", "Pets"],
  ["wheelchair_accessible", "Wheelchair"],
  ["beds_available_only", "Open beds"],
] as const;

function shelterBounds(shelters: Shelter[]): [[number, number], [number, number]] | null {
  const points = shelters.filter(
    (shelter) => Number.isFinite(shelter.longitude) && Number.isFinite(shelter.latitude),
  );
  if (points.length === 0) return null;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  for (const shelter of points) {
    minLng = Math.min(minLng, shelter.longitude);
    maxLng = Math.max(maxLng, shelter.longitude);
    minLat = Math.min(minLat, shelter.latitude);
    maxLat = Math.max(maxLat, shelter.latitude);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

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

  const { shelters, loading, error, refetch } = useShelters();

  useEffect(() => {
    if (!mapContainer.current || !shelters.length) return;
    if (currentPage !== "home") return;
    if (mapRef.current) return;

    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: SHELTER_AREA,
        zoom: 11,
      });
      mapRef.current = map;

      map.on("load", () => {
        setMapLoaded(true);

        shelters.forEach((shelter) => {
          if (!Number.isFinite(shelter.longitude) || !Number.isFinite(shelter.latitude)) return;
          const marker = new mapboxgl.default.Marker({ color: "#047857" })
            .setLngLat([shelter.longitude, shelter.latitude])
            .addTo(map);

          marker.getElement().addEventListener("click", () => {
            setSelectedShelter(shelter);
          });

          markersRef.current.push(marker);
        });

        const bounds = shelterBounds(shelters);
        if (bounds) {
          map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 0 });
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, shelters]);

  // Clean up map instance when leaving the Home page to prevent detached container rendering issues
  useEffect(() => {
    if (currentPage !== "home" && mapRef.current) {
      try {
        // Remove any existing markers
        markersRef.current.forEach((m) => {
          try { m.remove(); } catch {}
        });
        markersRef.current = [];
        // Remove the map instance
        mapRef.current.remove();
      } catch (e) {
        console.warn("Error removing map:", e);
      } finally {
        mapRef.current = null;
        setMapLoaded(false);
      }
    }
  }, [currentPage]);

  // Ensure map resizes correctly when returning to Home and the container becomes visible
  useEffect(() => {
    if (currentPage === "home" && mapRef.current && mapLoaded) {
      // Give the layout a tick to settle before resizing
      const id = requestAnimationFrame(() => {
        try { mapRef.current.resize(); } catch {}
      });
      return () => cancelAnimationFrame(id);
    }
  }, [currentPage, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !userLocation) return;
    let marker: { remove: () => void } | null = null;
    let cancelled = false;
    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !mapRef.current) return;
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.background = "#1d4ed8";
      el.style.border = "2px solid white";
      el.style.borderRadius = "50%";
      el.title = "Your location";
      marker = new mapboxgl.default.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current);
    });
    return () => {
      cancelled = true;
      try {
        marker?.remove();
      } catch {}
    };
  }, [userLocation, mapLoaded]);

  const handleAddShelter = async (newShelter: Shelter) => {
    // After successful POST handled in AddShelterPage, refresh list
    await refetch();
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
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">COS Shelter Connect</h1>
            <p className="text-sm text-stone-500">Colorado Springs shelter guide</p>
          </div>
          <div className="flex gap-2">
            <AddShelterButton
              onClick={() => setCurrentPage("add")}
              className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900"
            />
            <a
              href={withBase("/admin")}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Shelter admin
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <label className="block text-sm font-medium text-stone-700">
            Search
            <input
              type="text"
              placeholder="Name or address"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <fieldset>
              <legend className="text-sm font-medium text-stone-700">Who they serve</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SERVICE_FILTERS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-md border border-stone-200 px-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={filters[key]}
                      onChange={(e) => setFilters((current) => ({ ...current, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium text-stone-700">Age</legend>
              <div className="mt-2 flex gap-2">
                <label className="text-sm text-stone-600">
                  Min
                  <input
                    type="number"
                    min={0}
                    value={filters.age_min}
                    onChange={(e) => setFilters((current) => ({ ...current, age_min: e.target.value }))}
                    className="mt-1 block w-20 rounded-md border border-stone-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-sm text-stone-600">
                  Max
                  <input
                    type="number"
                    min={0}
                    value={filters.age_max}
                    onChange={(e) => setFilters((current) => ({ ...current, age_max: e.target.value }))}
                    className="mt-1 block w-20 rounded-md border border-stone-300 px-2 py-1 text-sm"
                  />
                </label>
              </div>
            </fieldset>
          </div>
        </section>
        {loading && <p className="text-sm text-stone-500">Loading shelters...</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <div
            ref={mapContainer}
            className="h-[28rem] w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-200 md:h-[36rem] md:min-w-0 md:flex-1"
          />
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
      </main>
    </div>
  );
}