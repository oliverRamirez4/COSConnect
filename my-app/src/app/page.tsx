"use client";
import React, { useRef, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import AddShelterPage, { AddShelterButton, Shelter } from './addshelter';

function PinSidebar({
  shelters,
  selectedShelter,
  onSelect,
  onBack
}: {
  shelters: Shelter[];
  selectedShelter: Shelter | null;
  onSelect: (shelter: Shelter) => void;
  onBack: () => void;
}) {
  if (selectedShelter) {
    return (
      <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center">
        <button
          className="mb-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2"
          onClick={onBack}
        >
          <span className="text-2xl">←</span> <span>Back to list</span>
        </button>
        <h2 className="text-xl font-bold mb-2">{selectedShelter.title}</h2>
        <p className="text-zinc-700 dark:text-zinc-200 mb-2">{selectedShelter.description}</p>
        <div className="text-base text-zinc-700 dark:text-zinc-200">
          <span className="font-semibold">Total Beds:</span> {selectedShelter.numTotBeds}<br />
          <span className="font-semibold">Beds Occupied:</span> {selectedShelter.numOpenBeds}
        </div>
      </div>
    );
  }
  return (
    <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
      <h2 className="text-lg font-semibold px-6 pt-6 pb-2">Shelters</h2>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {shelters.map((shelter, idx) => (
          <button
            key={idx}
            className="w-full text-left px-4 py-3 mb-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
            onClick={() => onSelect(shelter)}
          >
            <div className="font-bold text-zinc-900 dark:text-zinc-100">{shelter.title}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{shelter.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const markersRef = useRef<any[]>([]);
  const [currentPage, setCurrentPage] = useState<"home" | "add">("home");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [shelters, setShelters] = useState<Shelter[]>([
    {
      coords: [-104.829243, 38.8243225],
      title: "Salvation Army RJ Montgomery Center",
      description: "Emergency shelter for men, women, and families.",
      numTotBeds: 200,
      numOpenBeds: 180,
      address: "709 S Sierra Madre St, Colorado Springs, CO 80903"
    },
    {
      coords: [-104.8197, 38.8366],
      title: "Springs Rescue Mission",
      description: "Large shelter providing food, beds, and support services.",
      numTotBeds: 450,
      numOpenBeds: 410,
      address: "5 W Las Vegas St, Colorado Springs, CO 80903"
    },
    {
      coords: [-104.8221, 38.8337],
      title: "Catholic Charities Marian House",
      description: "Day center with meals, case management, and limited shelter.",
      numTotBeds: 50,
      numOpenBeds: 45,
      address: "14 W Bijou St, Colorado Springs, CO 80903"
    },
    {
      coords: [-104.8233, 38.8321],
      title: "The PLACE (Youth Shelter)",
      description: "Shelter and services for youth ages 15-20.",
      numTotBeds: 20,
      numOpenBeds: 18,
      address: "423 E Cucharras St, Colorado Springs, CO 80903"
    },
    {
      coords: [-104.752089, 38.875789],
      title: "Family Promise of Colorado Springs",
      description: "Shelter and support for families experiencing homelessness.",
      numTotBeds: 30,
      numOpenBeds: 25,
      address: "519 N Tejon St, Colorado Springs, CO 80903"
    },
    {
      coords: [-104.7784691, 38.8457481],
      title: "Salvation Army Transitional Housing",
      description: "Transitional housing for individuals and families.",
      numTotBeds: 60,
      numOpenBeds: 55,
      address: "908 Yuma St, Colorado Springs, CO 80909"
    },
    {
      coords: [-104.7785676, 38.8457504],
      title: "The Salvation Army - Colorado Springs",
      description: "Non-profit organization with various support services.",
      numTotBeds: 40,
      numOpenBeds: 35,
      address: "908 Yuma St, Colorado Springs, CO 80909"
    },
    {
      coords: [-104.8452, 38.8132],
      title: "Greccio Housing",
      description: "Affordable housing and support services.",
      numTotBeds: 100,
      numOpenBeds: 90,
      address: "1015 E Pikes Peak Ave #110, Colorado Springs, CO 80903"
    },
    {
      coords: [-104.80909, 38.875789],
      title: "Partners In Housing",
      description: "Transitional housing and supportive services for families.",
      numTotBeds: 80,
      numOpenBeds: 70,
      address: "455 Gold Pass Heights, Colorado Springs, CO 80906"
    },
    {
      coords: [-104.8233, 38.8321],
      title: "Homeward Pikes Peak",
      description: "Supportive housing and recovery services.",
      numTotBeds: 25,
      numOpenBeds: 20,
      address: "2010 E Bijou St, Colorado Springs, CO 80909"
    }
  ]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (currentPage !== "home") return; // Only initialize when on home page
    if (mapRef.current) return; // Initialize map only once

    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-104.8214, 38.8339], // Colorado Springs
        zoom: 11,
      });
      mapRef.current = map;

      map.on('load', () => {
        setMapLoaded(true);
        
        shelters.forEach((shelter) => {
          const marker = new mapboxgl.default.Marker()
            .setLngLat(shelter.coords as [number, number])
            .addTo(map);

          marker.getElement().addEventListener("click", () => {
            setSelectedShelter(shelter);
          });

          markersRef.current.push(marker);
        });
      });
    });
  }, [currentPage]);

  const handleAddShelter = (newShelter: Shelter) => {
    setShelters([...shelters, newShelter]);
  };

  if (currentPage === "add") {
    return (
      <AddShelterPage
        onBack={() => {
          setCurrentPage("home");
          // Reset map refs so it reinitializes on next render
          mapRef.current = null;
          markersRef.current = [];
          setMapLoaded(false);
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.resize();
            }
          }, 100);
        }}
        onAdd={handleAddShelter}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-black py-8">
      <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 tracking-tight">COS Connect</h1>
      <AddShelterButton onClick={() => setCurrentPage("add")} />
      <div className="flex items-center justify-center w-full">
        <PinSidebar
          shelters={shelters}
          selectedShelter={selectedShelter}
          onSelect={setSelectedShelter}
          onBack={() => setSelectedShelter(null)}
        />
        <div
          ref={mapContainer}
          className="w-full max-w-3xl h-[600px] rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800"
          style={{ minHeight: 400 }}
        />
      </div>
    </div>
  );
}