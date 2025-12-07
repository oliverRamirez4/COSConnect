"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Shelter } from "@/app/types";

export default function EditShelterPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id as string | undefined;
  const shelterId = idParam ? Number(idParam) : null;

  const [formState, setFormState] = React.useState<Partial<Shelter> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedToast, setSavedToast] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (!shelterId) {
        setError("Invalid shelter id");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/shelters/${shelterId}`);
        if (!res.ok) throw new Error(`Failed to load shelter (${res.status})`);
        const data: Shelter = await res.json();
        setFormState({ ...data });
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shelterId]);

  const setField = React.useCallback(
    (name: keyof Shelter, value: Shelter[keyof Shelter] | null) => {
      setFormState((prev: Partial<Shelter> | null) => (prev ? { ...prev, [name]: value ?? null } : prev));
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
      await response.json();
      // Show a quick success popup, then return to admin
      setSavedToast(true);
      setTimeout(() => {
        setSavedToast(false);
        router.push("/admin");
      }, 1200);
    } catch (e: any) {
      alert(`Error saving shelter: ${e.message ?? e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-8 dark:from-slate-950 dark:to-slate-900">
      {savedToast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-800 shadow-md dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Shelter updated successfully
        </div>
      )}
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Shelter Details</h1>
          <button className="rounded px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={() => router.push("/admin")}>Back to Admin</button>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && formState && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <Field label="Shelter Name" name="title" value={formState.title ?? ""} onChange={handleTextChange} required />
            <Field label="Address" name="address" value={formState.address ?? ""} onChange={handleTextChange} required />
            <Field label="Longitude" name="longitude" type="number" value={formState.longitude ?? ""} onChange={handleNumberChange} required />
            <Field label="Latitude" name="latitude" type="number" value={formState.latitude ?? ""} onChange={handleNumberChange} required />
            <Field label="Phone" name="phone" value={formState.phone ?? ""} onChange={handleTextChange} />
            <Field label="Website" name="website" value={formState.website ?? ""} onChange={handleTextChange} />
            <Textarea label="Description" name="description" value={formState.description ?? ""} onChange={handleTextChange} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Total Beds" name="numtotbeds" type="number" min={0} value={formState.numtotbeds ?? ""} onChange={handleNumberChange} required />
              <Field label="Beds Available" name="numopenbeds" type="number" min={0} value={formState.numopenbeds ?? ""} onChange={handleNumberChange} required />
              <Field label="Age Min" name="age_min" type="number" min={0} value={formState.age_min ?? ""} onChange={handleNumberChange} />
              <Field label="Age Max" name="age_max" type="number" min={0} value={formState.age_max ?? ""} onChange={handleNumberChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Toggle label="Families" name="families" checked={!!formState.families} onChange={handleCheckboxChange} />
              <Toggle label="Single Women" name="single_women" checked={!!formState.single_women} onChange={handleCheckboxChange} />
              <Toggle label="Single Men" name="single_men" checked={!!formState.single_men} onChange={handleCheckboxChange} />
              <Toggle label="Domestic Violence" name="domestic_violence" checked={!!formState.domestic_violence} onChange={handleCheckboxChange} />
              <Toggle label="Pet Friendly" name="pet_friendly" checked={!!formState.pet_friendly} onChange={handleCheckboxChange} />
              <Toggle label="Wheelchair Accessible" name="wheelchair_accessible" checked={!!formState.wheelchair_accessible} onChange={handleCheckboxChange} />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="rounded px-4 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={() => router.push("/admin")}>Cancel</button>
              <button type="submit" className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };
function Field({ label, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <input className="mt-1 w-full rounded border p-2" {...props} />
    </label>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };
function Textarea({ label, ...props }: TextareaProps) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <textarea className="mt-1 w-full rounded border p-2" rows={4} {...props} />
    </label>
  );
}

type ToggleProps = { label: string; name: string; checked: boolean; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void };
function Toggle({ label, ...props }: ToggleProps) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}