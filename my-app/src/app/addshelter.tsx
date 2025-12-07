import React, { useState } from "react";

export type Shelter = {
  coords: [number, number];
  title: string;
  description: string;
  numTotBeds: number;
  numOpenBeds: number;
  address: string;
};

interface AddShelterPageProps {
  onBack: () => void;
  onAdd: (shelter: Shelter) => void;
}

function AddShelterPage({ onBack, onAdd }: AddShelterPageProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    numTotBeds: "",
    numOpenBeds: "",
    address: "",
    coords: null as [number, number] | null
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=US&proximity=-104.8214,38.8339&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error("Error searching address:", error);
    }
    setIsSearching(false);
  };

  const handleAddressChange = (value: string) => {
    setFormData({...formData, address: value});
    searchAddress(value);
  };

  const selectAddress = (feature: any) => {
    setFormData({
      ...formData,
      address: feature.place_name,
      coords: feature.geometry.coordinates as [number, number]
    });
    setSuggestions([]);
  };

  const handleSubmit = () => {
    if (!formData.coords) {
      alert("Please select an address from the search results");
      return;
    }

    const newShelter: Shelter = {
      coords: formData.coords,
      title: formData.title,
      description: formData.description,
      numTotBeds: parseInt(formData.numTotBeds),
      numOpenBeds: parseInt(formData.numOpenBeds),
      address: formData.address
    };
    onAdd(newShelter);
    onBack();
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 w-full max-w-2xl mx-4 border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Add New Shelter</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              Shelter Name
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              placeholder="Enter shelter name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              rows={3}
              placeholder="Enter shelter description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                Total Beds
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.numTotBeds}
                onChange={(e) => setFormData({...formData, numTotBeds: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                Open Beds
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.numOpenBeds}
                onChange={(e) => setFormData({...formData, numOpenBeds: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="0"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              placeholder="Search for address..."
            />
            {formData.coords && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                ✓ Location found: {formData.coords[1].toFixed(4)}, {formData.coords[0].toFixed(4)}
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectAddress(suggestion)}
                    className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer border-b border-zinc-200 dark:border-zinc-700 last:border-b-0"
                  >
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">
                      {suggestion.place_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isSearching && (
              <div className="mt-2 text-sm text-zinc-500">Searching...</div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-all"
            >
              Add Shelter
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium py-3 px-6 rounded-lg shadow-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AddShelterButtonProps {
  onClick: () => void;
}

export function AddShelterButton({ onClick }: AddShelterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all"
    >
      + Add New Shelter
    </button>
  );
}

export default AddShelterPage;