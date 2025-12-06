

"use client";
import React, { useRef, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type Pin = {
  coords: [number, number];
  title: string;
  description: string;
};

function PinSidebar({ pin }: { pin: Pin | null }) {
  return (
    <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center">
      {pin ? (
        <>
          <h2 className="text-xl font-bold mb-2">{pin.title}</h2>
          <p className="text-zinc-700 dark:text-zinc-200">{pin.description}</p>
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
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return; // Prevent re-initialization

    const pins: Pin[] = [
      {
        coords: [-104.8214, 38.8339],
        title: "Downtown Colorado Springs",
        description: "The heart of Colorado Springs."
      },
      {
        coords: [-104.8717, 38.8895],
        title: "Garden of the Gods",
        description: "A public park known for its stunning red rock formations."
      },
      {
        coords: [-104.8584, 38.8462],
        title: "Old Colorado City",
        description: "Historic district with shops and restaurants."
      }
    ];

    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-104.8214, 38.8339], // Colorado Springs
        zoom: 11,
      });
      mapRef.current = map;

      pins.forEach((pin) => {
        const marker = new mapboxgl.default.Marker()
          .setLngLat(pin.coords as [number, number])
          .addTo(map);

        marker.getElement().addEventListener("click", () => {
          setSelectedPin(pin);
        });
      });
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-black py-8">
      <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 tracking-tight">COS Connect</h1>
      <div className="flex items-center justify-center w-full">
        <PinSidebar pin={selectedPin} />
        <div
          ref={mapContainer}
          className="w-full max-w-3xl h-[600px] rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800"
          style={{ minHeight: 400 }}
        />
      </div>
    </div>
  );
}
