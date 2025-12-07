"use client";
import React from "react";
import { useShelters } from "../hooks/useShelters";
import { Shelter } from "../types";

export default function ShelterAdminPage() {
  const { shelters, loading, error } = useShelters();
  const [localShelters, setLocalShelters] = React.useState<Shelter[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [formState, setFormState] = React.useState<Partial<Shelter> | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setLocalShelters(shelters);
  }, [shelters]);

  const selectedShelter = React.useMemo(
    () => localShelters.find((shelter) => shelter.id === selectedId) ?? null,
    [localShelters, selectedId],
  );

  React.useEffect(() => {
    setFormState(selectedShelter ? { ...selectedShelter } : null);
  }, [selectedShelter]);

  const setField = React.useCallback(
    (name: keyof Shelter, value: Shelter[keyof Shelter] | null) => {
      setFormState((prev) => (prev ? { ...prev, [name]: value ?? null } : prev));
    },
    []
  );

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setField(name as keyof Shelter, value);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setField(name as keyof Shelter, value === "" ? null : Number(value));
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setField(name as keyof Shelter, checked);
  };

  const handleSave = async () => {
    if (!formState?.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/shelters/${formState.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? `Request failed (${response.status})`);
      }

      const updatedShelter: Shelter = await response.json();
      setLocalShelters((prev) =>
        prev.map((shelter) => (shelter.id === updatedShelter.id ? updatedShelter : shelter))
      );
      setFormState(updatedShelter);
      alert("Shelter details saved!");
    } catch (error: any) {
      alert(`Error saving shelter: ${error.message ?? error}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-8 dark:from-slate-950 dark:to-slate-900">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
        Shelter Admin Portal
      </h1>
      <p className="mb-8 text-base tracking-wide text-slate-600 dark:text-slate-400">
        Manage your shelter, track beds, and occupants here.
      </p>

      <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        {loading && <div>Loading shelters...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <>
            <label className="mb-4 block">
              <span className="font-semibold">Select Shelter:</span>
              <select
                className="mt-1 block w-full rounded border p-2"
                value={selectedId ?? ""}
                onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="" disabled>
                  Select a shelter...
                </option>
                {localShelters.map((shelter) => (
                  <option key={shelter.id} value={shelter.id}>
                    {shelter.title}
                  </option>
                ))}
              </select>
            </label>

            {formState && (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSave();
                }}
              >
                <Field
                  label="Shelter Name"
                  name="title"
                  value={formState.title ?? ""}
                  onChange={handleTextChange}
                  required
                />
                <Field
                  label="Address"
                  name="address"
                  value={formState.address ?? ""}
                  onChange={handleTextChange}
                  required
                />
                <Field
                  label="Longitude"
                  name="longitude"
                  type="number"
                  value={formState.longitude ?? ""}
                  onChange={handleNumberChange}
                  required
                />
                <Field
                  label="Latitude"
                  name="latitude"
                  type="number"
                  value={formState.latitude ?? ""}
                  onChange={handleNumberChange}
                  required
                />
                <Field label="Phone" name="phone" value={formState.phone ?? ""} onChange={handleTextChange} />
                <Field
                  label="Website"
                  name="website"
                  value={formState.website ?? ""}
                  onChange={handleTextChange}
                />
                <Textarea
                  label="Description"
                  name="description"
                  value={formState.description ?? ""}
                  onChange={handleTextChange}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Total Beds"
                    name="numtotbeds"
                    type="number"
                    min={0}
                    value={formState.numtotbeds ?? ""}
                    onChange={handleNumberChange}
                    required
                  />
                  <Field
                    label="Beds Available"
                    name="numopenbeds"
                    type="number"
                    min={0}
                    value={formState.numopenbeds ?? ""}
                    onChange={handleNumberChange}
                    required
                  />
                  <Field
                    label="Age Min"
                    name="age_min"
                    type="number"
                    min={0}
                    value={formState.age_min ?? ""}
                    onChange={handleNumberChange}
                  />
                  <Field
                    label="Age Max"
                    name="age_max"
                    type="number"
                    min={0}
                    value={formState.age_max ?? ""}
                    onChange={handleNumberChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Toggle label="Families" name="families" checked={!!formState.families} onChange={handleCheckboxChange} />
                  <Toggle
                    label="Single Women"
                    name="single_women"
                    checked={!!formState.single_women}
                    onChange={handleCheckboxChange}
                  />
                  <Toggle
                    label="Single Men"
                    name="single_men"
                    checked={!!formState.single_men}
                    onChange={handleCheckboxChange}
                  />
                  <Toggle
                    label="Domestic Violence"
                    name="domestic_violence"
                    checked={!!formState.domestic_violence}
                    onChange={handleCheckboxChange}
                  />
                  <Toggle
                    label="Pet Friendly"
                    name="pet_friendly"
                    checked={!!formState.pet_friendly}
                    onChange={handleCheckboxChange}
                  />
                  <Toggle
                    label="Wheelchair Accessible"
                    name="wheelchair_accessible"
                    checked={!!formState.wheelchair_accessible}
                    onChange={handleCheckboxChange}
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 rounded bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function Field({ label, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <input className="mt-1 w-full rounded border p-2" {...props} />
    </label>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

function Textarea({ label, ...props }: TextareaProps) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <textarea className="mt-1 w-full rounded border p-2" rows={4} {...props} />
    </label>
  );
}

type ToggleProps = {
  label: string;
  name: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function Toggle({ label, ...props }: ToggleProps) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}