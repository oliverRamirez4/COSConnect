

"use client";
import React, { useRef, useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type Pin = {
  coords: [number, number];
  title: string;
  description: string;
  totalBeds: number;
  bedsOccupied: number;
};

function PinSidebar({
  pins,
  selectedPin,
  onSelect,
  onBack
}: {
  pins: Pin[];
  selectedPin: Pin | null;
  onSelect: (pin: Pin) => void;
  onBack: () => void;
}) {
  if (selectedPin) {
    return (
      <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center">
        <button
          className="mb-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2"
          onClick={onBack}
        >
          <span className="text-2xl">←</span> <span>Back to list</span>
        </button>
        <h2 className="text-xl font-bold mb-2">{selectedPin.title}</h2>
        <p className="text-zinc-700 dark:text-zinc-200 mb-2">{selectedPin.description}</p>
        <div className="text-base text-zinc-700 dark:text-zinc-200">
          <span className="font-semibold">Total Beds:</span> {selectedPin.totalBeds}<br />
          <span className="font-semibold">Beds Occupied:</span> {selectedPin.bedsOccupied}
        </div>
      </div>
    );
  }
  return (
    <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
      <h2 className="text-lg font-semibold px-6 pt-6 pb-2">Shelters</h2>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {pins.map((pin, idx) => (
          <button
            key={idx}
            className="w-full text-left px-4 py-3 mb-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
            onClick={() => onSelect(pin)}
          >
            <div className="font-bold text-zinc-900 dark:text-zinc-100">{pin.title}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{pin.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [pins] = useState<Pin[]>([
    {
      coords: [-104.829243, 38.8243225],
      title: "Salvation Army RJ Montgomery Center",
      description: "709 S Sierra Madre St, Colorado Springs, CO 80903. Emergency shelter for men, women, and families.",
      totalBeds: 200,
      bedsOccupied: 180
    },
    {
      coords: [-104.8197, 38.8366],
      title: "Springs Rescue Mission",
      description: "5 W Las Vegas St, Colorado Springs, CO 80903. Large shelter providing food, beds, and support services.",
      totalBeds: 450,
      bedsOccupied: 410
    },
    {
      coords: [-104.8221, 38.8337],
      title: "Catholic Charities Marian House",
      description: "14 W Bijou St, Colorado Springs, CO 80903. Day center with meals, case management, and limited shelter.",
      totalBeds: 50,
      bedsOccupied: 45
    },
    {
      coords: [-104.8233, 38.8321],
      title: "The PLACE (Youth Shelter)",
      description: "423 E Cucharras St, Colorado Springs, CO 80903. Shelter and services for youth ages 15-20.",
      totalBeds: 20,
      bedsOccupied: 18
    },
    {
      coords: [-104.752089, 38.875789],
      title: "Family Promise of Colorado Springs",
      description: "519 N Tejon St, Colorado Springs, CO 80903. Shelter and support for families experiencing homelessness.",
      totalBeds: 30,
      bedsOccupied: 25
    },
    {
      coords: [-104.7784691, 38.8457481],
      title: "Salvation Army Transitional Housing",
      description: "908 Yuma St, Colorado Springs, CO 80909. Transitional housing for individuals and families.",
      totalBeds: 60,
      bedsOccupied: 55
    },
    {
      coords: [-104.7785676, 38.8457504],
      title: "The Salvation Army - Colorado Springs",
      description: "908 Yuma St, Colorado Springs, CO 80909. Non-profit organization with various support services.",
      totalBeds: 40,
      bedsOccupied: 35
    },
    {
      coords: [-104.8452, 38.8132],
      title: "Greccio Housing",
      description: "1015 E Pikes Peak Ave #110, Colorado Springs, CO 80903. Affordable housing and support services.",
      totalBeds: 100,
      bedsOccupied: 90
    },
    {
      coords: [-104.80909, 38.875789],
      title: "Partners In Housing",
      description: "455 Gold Pass Heights, Colorado Springs, CO 80906. Transitional housing and supportive services for families.",
      totalBeds: 80,
      bedsOccupied: 70
    },
    {
      coords: [-104.8233, 38.8321],
      title: "Homeward Pikes Peak",
      description: "2010 E Bijou St, Colorado Springs, CO 80909. Supportive housing and recovery services.",
      totalBeds: 25,
      bedsOccupied: 20
    }
  ]);

  useEffect(() => {
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
  }, [pins]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-black py-8">
      <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 tracking-tight">COS Connect</h1>
      <div className="flex items-center justify-center w-full">
        <PinSidebar
          pins={pins}
          selectedPin={selectedPin}
          onSelect={setSelectedPin}
          onBack={() => setSelectedPin(null)}
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
