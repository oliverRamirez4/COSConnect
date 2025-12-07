import React from "react";
import { Shelter } from "./types";

interface ShelterSidebarProps {
  shelters: Shelter[];
  selectedShelter: Shelter | null;
  onSelect: (shelter: Shelter) => void;
  onBack: () => void;
  userLocation?: { lat: number; lng: number } | null;
  filters?: {
    searchText?: string;
    families?: boolean;
    single_women?: boolean;
    single_men?: boolean;
    domestic_violence?: boolean;
    pet_friendly?: boolean;
    wheelchair_accessible?: boolean;
    age_min?: string | number;
    age_max?: string | number;
    beds_available_only?: boolean;
  };
}

export default function ShelterSidebar({ shelters, selectedShelter, onSelect, onBack, userLocation, filters }: ShelterSidebarProps) {
  // Determine match status per shelter (do not remove non-matches)
  const shelterWithMatch = React.useMemo(() => {
    const f = filters || {};
    const search = (f.searchText || "").trim().toLowerCase();
    const minAge = f.age_min === "" || f.age_min === undefined ? undefined : Number(f.age_min);
    const maxAge = f.age_max === "" || f.age_max === undefined ? undefined : Number(f.age_max);
    const matches = (s: Shelter) => {
      // text search on title or address
      if (search) {
        const hay = `${s.title} ${s.address}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      // boolean filters: if true, require shelter to support
      if (f.families && !s.families) return false;
      if (f.single_women && !s.single_women) return false;
      if (f.single_men && !s.single_men) return false;
      if (f.domestic_violence && !s.domestic_violence) return false;
      if (f.pet_friendly && !s.pet_friendly) return false;
      if (f.wheelchair_accessible && !s.wheelchair_accessible) return false;
      // age range: match if shelter age range intersects user provided range
      if (minAge !== undefined) {
        if (s.age_min !== undefined && minAge < s.age_min) return false;
        if (s.age_max !== undefined && minAge > s.age_max) return false;
      }
      if (maxAge !== undefined) {
        if (s.age_min !== undefined && maxAge < s.age_min) return false;
        if (s.age_max !== undefined && maxAge > s.age_max) return false;
      }
      if (f.beds_available_only && (s.numopenbeds ?? 0) <= 0) return false;
      return true;
    };
    return shelters.map((s) => ({ shelter: s, matches: matches(s) }));
  }, [shelters, filters]);
  // Sort shelters by proximity if userLocation is available
  const sortedShelters = React.useMemo(() => {
    // Order: matching first, then non-matching; within each, sort by distance (or keep order if no location)
    let list = shelterWithMatch.slice();
    if (userLocation) {
      function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        // Haversine formula
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }
      list.sort((A, B) => {
        // matches first
        if (A.matches !== B.matches) return A.matches ? -1 : 1;
        const a = A.shelter;
        const b = B.shelter;
        const da = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const db = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return da - db;
      });
    } else {
      // Without location, still put matches first, preserve original order otherwise
      list.sort((A, B) => (A.matches === B.matches ? 0 : A.matches ? -1 : 1));
    }
    return list;
  }, [shelterWithMatch, userLocation]);
  if (selectedShelter) {
    return (
      <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-0 flex flex-col overflow-hidden">
        {/* Header with back button and title */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
          <button
            className="text-white hover:bg-emerald-700 p-2 rounded transition"
            onClick={onBack}
            title="Back to list"
          >
            <span className="text-2xl">←</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">{selectedShelter.title}</h2>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <p className="text-zinc-700 dark:text-zinc-200 mb-2">{selectedShelter.description}</p>
            {/* Bed info box moved below description */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-300">Total Beds:</span>
                <span className="text-emerald-900 dark:text-emerald-300 font-bold">{selectedShelter.numtotbeds ?? 0}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-300">Beds Available:</span>
                <span className="text-emerald-900 dark:text-emerald-300 font-bold">{selectedShelter.numopenbeds ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-900 dark:text-emerald-300">Occupancy:</span>
                <span className="text-emerald-900 dark:text-emerald-300 font-bold">
                  {selectedShelter.numtotbeds && selectedShelter.numtotbeds > 0
                    ? Math.round(((selectedShelter.numtotbeds - selectedShelter.numopenbeds) / selectedShelter.numtotbeds) * 100)
                    : 0}%
                </span>
              </div>
            </div>
            {selectedShelter.website && (
              <div className="mb-1">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Website: </span>
                <a href={selectedShelter.website} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 underline break-all">{selectedShelter.website}</a>
              </div>
            )}
            {selectedShelter.phone && (
              <div className="mb-1">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Phone: </span>
                <a href={`tel:${selectedShelter.phone}`} className="text-emerald-700 dark:text-emerald-300 underline">{selectedShelter.phone}</a>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">Address:</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedShelter.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-300 underline text-sm break-words text-left flex-1"
                  title={selectedShelter.address}
                  style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                >
                  {selectedShelter.address}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Age Range:</span>
                <span className="text-zinc-700 dark:text-zinc-300 text-right text-sm">
                  {selectedShelter.age_min !== undefined ? selectedShelter.age_min : 'Any'} - {selectedShelter.age_max !== undefined ? selectedShelter.age_max : 'Any'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedShelter.families ? '👨‍👩‍👧‍👦' : '❌'}</span>
                  <span className="text-xs">Families</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedShelter.single_women ? '♀️' : '❌'}</span>
                  <span className="text-xs">Single Women</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedShelter.single_men ? '♂️' : '❌'}</span>
                  <span className="text-xs">Single Men</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedShelter.domestic_violence ? '🛡️' : '❌'}</span>
                  <span className="text-xs">DV Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedShelter.pet_friendly ? '🐾' : '❌'}</span>
                  <span className="text-xs">Pet Friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedShelter.wheelchair_accessible ? '♿' : '❌'}</span>
                  <span className="text-xs">Wheelchair</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-80 max-w-xs h-[600px] mr-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
      <h2 className="text-lg font-semibold px-6 pt-6 pb-2">Shelters</h2>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sortedShelters.map(({ shelter, matches }, idx) => {
          let distanceStr = null;
          if (userLocation) {
            const R = 3958.8; // miles
            const dLat = (shelter.latitude - userLocation.lat) * Math.PI / 180;
            const dLon = (shelter.longitude - userLocation.lng) * Math.PI / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(shelter.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;
            distanceStr = `${d < 0.1 ? (d * 5280).toFixed(0) + ' ft' : d.toFixed(2) + ' mi'}`;
          }
          return (
            <button
              key={idx}
              className={`w-full text-left px-4 py-3 mb-2 rounded-lg transition border ${
                matches
                  ? "hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                  : "bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700"
              }`}
              onClick={() => onSelect(shelter)}
            >
              <div className="font-bold text-zinc-900 dark:text-zinc-100">{shelter.title}</div>
              <div className="flex gap-2 items-center mt-1">
                {userLocation && (
                  <span title="Distance to shelter" className="inline-block bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {distanceStr}
                  </span>
                )}
                <span title="Beds available" className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${matches ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"}`}>
                  Beds: {shelter.numopenbeds ?? 0}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
