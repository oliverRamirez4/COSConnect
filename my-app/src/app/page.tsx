
"use client";
import React, { useRef, useEffect } from "react";

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    console.log("Mapbox Token:", process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
    if (!mapContainer.current) return;
    if (mapRef.current) return; // Prevent re-initialization

    // Dynamically import mapbox-gl to avoid SSR issues
    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      mapRef.current = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-104.8214, 38.8339], // Colorado Springs
        zoom: 11,
      });
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div
        ref={mapContainer}
        className="w-full max-w-3xl h-[600px] rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}
