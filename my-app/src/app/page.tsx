"use client";
import React, { useRef, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import AddShelterPage, { AddShelterButton, Shelter } from './addshelter';

function PinSidebar({ shelter }: { shelter: Shelter | null }) {
  return (
    <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center">
      {shelter ? (
        <>
          <h2 className="text-xl font-bold mb-2">{shelter.title}</h2>
          <p className="text-zinc-700 dark:text-zinc-200 mb-4">{shelter.description}</p>
          <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Total Beds:</span>
              <span>{shelter.numTotBeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Open Beds:</span>
              <span className="text-green-600 dark:text-green-400">{shelter.numOpenBeds}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-zinc-400 dark:text-zinc-500">Click a pin to see details</p>
      )}
    </div>
  );
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [currentPage, setCurrentPage] = useState<"home" | "add">("home");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [shelters, setShelters] = useState<Shelter[]>([
    {
      coords: [-104.8214, 38.8339],
      title: "Downtown Colorado Springs Shelter",
      description: "The heart of Colorado Springs.",
      numTotBeds: 50,
      numOpenBeds: 12
    },
    {
      coords: [-104.8717, 38.8895],
      title: "Garden of the Gods Shelter",
      description: "Near the public park known for its stunning red rock formations.",
      numTotBeds: 30,
      numOpenBeds: 8
    },
    {
      coords: [-104.8584, 38.8462],
      title: "Old Colorado City Shelter",
      description: "Historic district with shops and restaurants.",
      numTotBeds: 40,
      numOpenBeds: 15
    }
  ]);

  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return; // Prevent re-initialization

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
  }, []);

  const handleAddShelter = (newShelter: Shelter) => {
    const updatedShelters = [...shelters, newShelter];
    setShelters(updatedShelters);
    
    if (mapRef.current && mapLoaded) {
      import("mapbox-gl").then((mapboxgl) => {
        const marker = new mapboxgl.default.Marker()
          .setLngLat(newShelter.coords as [number, number])
          .addTo(mapRef.current);

        marker.getElement().addEventListener("click", () => {
          setSelectedShelter(newShelter);
        });

        markersRef.current.push(marker);
        
        // Trigger a resize to ensure map renders correctly
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        }, 100);
      });
    }
  };

  return (
    <>
      <div style={{ display: currentPage === "add" ? 'none' : 'flex' }} className="flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-black py-8">
        <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-zinc-100 tracking-tight">COS Connect</h1>
        <AddShelterButton onClick={() => setCurrentPage("add")} />
        <div className="flex items-center justify-center w-full">
          <PinSidebar shelter={selectedShelter} />
          <div
            ref={mapContainer}
            className="w-full max-w-3xl h-[600px] rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800"
            style={{ minHeight: 400, position: 'relative' }}
          />
        </div>
      </div>
      
      {currentPage === "add" && (
        <AddShelterPage 
          onBack={() => {
            setCurrentPage("home");
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.resize();
              }
            }, 100);
          }}
          onAdd={handleAddShelter}
        />
      )}
    </>
  );
}