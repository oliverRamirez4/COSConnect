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
  const [isEditing, setIsEditing] = React.useState(false);
  // Frontend-only state for assignment/release flows
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [isReleasing, setIsReleasing] = React.useState(false);
  const [assigneeName, setAssigneeName] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState<number | null>(null);
  const [personSearch, setPersonSearch] = React.useState("");
  const [personResults, setPersonResults] = React.useState<Array<{ id: number; full_name: string; phone?: string; email?: string }>>([]);
  const [creatingPerson, setCreatingPerson] = React.useState(false);
  const [newPerson, setNewPerson] = React.useState<{ full_name: string; phone?: string; email?: string; date_of_birth?: string }>({ full_name: "" });
  const [selectedOccupant, setSelectedOccupant] = React.useState<string>("");
  const [occupantsByShelter, setOccupantsByShelter] = React.useState<Record<number, string[]>>({});

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
      setIsEditing(false);
      alert("Shelter details saved!");
    } catch (error: any) {
      alert(`Error saving shelter: ${error.message ?? error}`);
    } finally {
      setSaving(false);
    }
  };

  const mutateBeds = async (delta: number) => {
    if (!selectedShelter) return;
    const next = Math.max(0, (selectedShelter.numopenbeds ?? 0) + delta);
    const payload: Partial<Shelter> = { ...selectedShelter, numopenbeds: next };
    setSaving(true);
    try {
      const res = await fetch(`/api/shelters/${selectedShelter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error: message } = await res.json();
        throw new Error(message ?? `Request failed (${res.status})`);
      }
      const updated: Shelter = await res.json();
      setLocalShelters((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      alert(`Error updating beds: ${err.message ?? err}`);
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Assign / Release flows (frontend only)
  const openAssignModal = () => {
    setAssigneeName("");
    setAssigneeId(null);
    setPersonSearch("");
    setPersonResults([]);
    setCreatingPerson(false);
    setIsAssigning(true);
  };

  const confirmAssign = async () => {
    if (!selectedShelter) return;
    // prefer selected personId; fallback to name entry
    const payload: any = assigneeId
      ? { shelterId: selectedShelter.id, personId: assigneeId }
      : { shelterId: selectedShelter.id, personName: assigneeName.trim() };
    if (!payload.personId && !payload.personName) return;
    setIsAssigning(false);
    // Persist assignment
    try {
      const res = await fetch(`/api/bed-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Failed to assign" }));
        alert(error ?? "Failed to assign");
        return;
      }
      // Update local occupants and beds
      setOccupantsByShelter((prev) => {
        const current = prev[selectedShelter.id] ?? [];
        const name = assigneeName.trim();
        return { ...prev, [selectedShelter.id]: [...current, name] };
      });
      await mutateBeds(-1);
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  const openReleaseModal = () => {
    setSelectedOccupant("");
    setIsReleasing(true);
  };

  const confirmRelease = async () => {
    if (!selectedShelter) return;
    const current = occupantsByShelter[selectedShelter.id] ?? [];
    if (!selectedOccupant || !current.includes(selectedOccupant)) return;
    setIsReleasing(false);
    try {
      const res = await fetch(`/api/bed-assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelterId: selectedShelter.id, personName: selectedOccupant }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Failed to release" }));
        alert(error ?? "Failed to release");
        return;
      }
      setOccupantsByShelter((prev) => {
        const list = (prev[selectedShelter.id] ?? []).filter((name) => name !== selectedOccupant);
        return { ...prev, [selectedShelter.id]: list };
      });
      await mutateBeds(+1);
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  // Load occupants when selected shelter changes
  React.useEffect(() => {
    const load = async () => {
      if (!selectedShelter) return;
      try {
        const res = await fetch(`/api/bed-assignments?shelterId=${selectedShelter.id}`);
        if (!res.ok) return;
        const data: { full_name: string }[] = await res.json();
        setOccupantsByShelter((prev) => ({
          ...prev,
          [selectedShelter.id]: data.map((d) => d.full_name),
        }));
      } catch {
        // no-op
      }
    };
    load();
  }, [selectedShelter]);

  // search persons (debounced)
  React.useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      if (!isAssigning) return;
      try {
        const res = await fetch(`/api/persons?q=${encodeURIComponent(personSearch)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: Array<{ id: number; full_name: string; phone?: string; email?: string }> = await res.json();
        setPersonResults(data);
      } catch {}
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [personSearch, isAssigning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto mb-6 flex w-full max-w-5xl items-center justify-between px-4">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
          Shelter Admin Portal
        </h1>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-900/10 transition hover:from-slate-700 hover:to-slate-600 hover:shadow-md dark:from-zinc-800 dark:to-zinc-700 dark:ring-zinc-700"
          aria-label="Return to Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M11.47 2.47a.75.75 0 0 1 1.06 0l8 8a.75.75 0 1 1-1.06 1.06L19.5 10.56V19.5A2.25 2.25 0 0 1 17.25 21.75h-10.5A2.25 2.25 0 0 1 4.5 19.5V10.56l-0.97 0.97a.75.75 0 1 1-1.06-1.06l8-8ZM6 9.75V19.5c0 .414.336.75.75.75h10.5c.414 0 .75-.336.75-.75V9.75l-6-6-6 6ZM9.75 12a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 9.75 12ZM14.25 12a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Z" />
          </svg>
          Home
        </a>
      </div>
      <div className="mx-auto w-full max-w-5xl px-4">
        <p className="mb-6 text-base tracking-wide text-slate-600 dark:text-slate-400">
          Manage your shelter, track beds, and occupants here.
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: shelter selection and actions */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
        {loading && <div>Loading shelters...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <>
                <div className="mb-4">
                  <label className="block">
                    <span className="font-semibold">Select Shelter</span>
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
                </div>

            {selectedShelter && (
                  <div className="mt-2 space-y-4">
                    <div className="grid items-start gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 p-4 dark:border-zinc-800 sm:col-span-2">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <div className="font-semibold">{selectedShelter.title}</div>
                          <div className="mt-1">Open beds: {selectedShelter.numopenbeds ?? 0} / {selectedShelter.numtotbeds ?? 0}</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800 disabled:opacity-60"
                            onClick={openAssignModal}
                            disabled={saving || (selectedShelter.numopenbeds ?? 0) <= 0}
                          >
                            Assign Bed
                          </button>
                          <button
                            className="rounded bg-teal-600 px-3 py-2 text-white hover:bg-teal-700 disabled:opacity-60"
                            onClick={openReleaseModal}
                            disabled={
                              saving || (selectedShelter.numopenbeds ?? 0) >= (selectedShelter.numtotbeds ?? 0)
                            }
                          >
                            Open Bed
                          </button>
                          <a
                            href={`/admin/shelter/${selectedShelter.id}/edit`}
                            className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                          >
                            Edit Details
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
            )}

                {/* Assign Bed Modal */}
            <Modal open={isAssigning} onClose={() => setIsAssigning(false)}>
              {selectedShelter && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Assign Bed</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Assign a bed at <span className="font-medium">{selectedShelter.title}</span> to a person.
                  </p>
                  <div className="space-y-2">
                    <label className="block">
                      <span className="font-semibold">Search Person</span>
                      <input
                        className="mt-1 w-full rounded border p-2"
                        placeholder="Type a name to search"
                        value={personSearch}
                        onChange={(e) => setPersonSearch(e.target.value)}
                      />
                    </label>
                    <div className="max-h-48 overflow-auto rounded border">
                      {personResults.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500">No results</div>
                      ) : (
                        <ul>
                          {personResults.map((p) => (
                            <li key={p.id}>
                              <button
                                className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 ${assigneeId === p.id ? 'bg-slate-100 dark:bg-zinc-800' : ''}`}
                                onClick={() => { setAssigneeId(p.id); setAssigneeName(p.full_name); setCreatingPerson(false); }}
                              >
                                <span className="font-medium">{p.full_name}</span>
                                <span className="text-xs text-slate-500">{p.email ?? p.phone ?? ''}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        className="text-sm text-emerald-700 hover:underline"
                        onClick={() => { setCreatingPerson(true); setAssigneeId(null); }}
                      >
                        + Create new person
                      </button>
                    </div>
                  </div>
                  {creatingPerson && (
                    <div className="space-y-2 rounded border p-3">
                      <div className="text-sm font-semibold">New Person Details</div>
                      <label className="block">
                        <span className="font-semibold">Full Name</span>
                        <input className="mt-1 w-full rounded border p-2" value={newPerson.full_name}
                          onChange={(e) => { setNewPerson({ ...newPerson, full_name: e.target.value }); setAssigneeName(e.target.value); }} />
                      </label>
                      <label className="block">
                        <span className="font-semibold">Email</span>
                        <input className="mt-1 w-full rounded border p-2" value={newPerson.email ?? ''}
                          onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="font-semibold">Phone</span>
                        <input className="mt-1 w-full rounded border p-2" value={newPerson.phone ?? ''}
                          onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })} />
                      </label>
                      <label className="block">
                        <span className="font-semibold">Date of Birth</span>
                        <input type="date" className="mt-1 w-full rounded border p-2" value={newPerson.date_of_birth ?? ''}
                          onChange={(e) => setNewPerson({ ...newPerson, date_of_birth: e.target.value })} />
                      </label>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="rounded bg-slate-800 px-3 py-2 text-white hover:bg-slate-700"
                          onClick={async () => {
                            if (!newPerson.full_name.trim()) { alert('Full name required'); return; }
                            try {
                              const res = await fetch('/api/persons', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPerson),
                              });
                              if (!res.ok) {
                                const { error } = await res.json().catch(() => ({ error: 'Failed to create person' }));
                                alert(error ?? 'Failed to create person');
                                return;
                              }
                              const created: { id: number; full_name: string } = await res.json();
                              setAssigneeId(created.id);
                              setAssigneeName(created.full_name);
                              setCreatingPerson(false);
                            } catch (e: any) {
                              alert(e?.message ?? String(e));
                            }
                          }}
                        >
                          Save Person
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded px-4 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800"
                      onClick={() => setIsAssigning(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                      onClick={confirmAssign}
                      disabled={saving || (!assigneeId && !assigneeName.trim())}
                    >
                      Confirm Assign
                    </button>
                  </div>
                </div>
              )}
            </Modal>

        {/* Open Bed (Release) Modal */}
            <Modal open={isReleasing} onClose={() => setIsReleasing(false)}>
              {selectedShelter && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Open Bed</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Select a person to remove from their bed at <span className="font-medium">{selectedShelter.title}</span>.
                  </p>
                  <label className="block">
                    <span className="font-semibold">Occupant</span>
                    <select
                      className="mt-1 block w-full rounded border p-2"
                      value={selectedOccupant}
                      onChange={(e) => setSelectedOccupant(e.target.value)}
                    >
                      <option value="" disabled>
                        Select an occupant...
                      </option>
                      {(occupantsByShelter[selectedShelter.id] ?? []).length === 0 ? (
                        <option value="" disabled>No occupants found</option>
                      ) : (
                        (occupantsByShelter[selectedShelter.id] ?? []).map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))
                      )}
                    </select>
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded px-4 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800"
                      onClick={() => setIsReleasing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                      onClick={confirmRelease}
                      disabled={saving || !selectedOccupant}
                    >
                      Confirm Open Bed
                    </button>
                  </div>
                </div>
              )}
            </Modal>

        <Modal open={isEditing} onClose={() => setIsEditing(false)}>
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
                  <Field label="Website" name="website" value={formState.website ?? ""} onChange={handleTextChange} />
                  <Textarea label="Description" name="description" value={formState.description ?? ""} onChange={handleTextChange} />

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
                    <button type="button" className="rounded px-4 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button
                      type="submit"
                      className="rounded bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
                </Modal>
          </>
        )}
          </div>

          {/* Right column: Occupants list */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Current Occupants</h2>
              <span className="text-xs text-slate-500">Live</span>
            </div>
            <div className="mt-3 space-y-2">
              {selectedShelter ? (
                (occupantsByShelter[selectedShelter.id] ?? []).length === 0 ? (
                  <div className="rounded border border-dashed p-3 text-sm text-slate-500 dark:border-zinc-800">No occupants yet.</div>
                ) : (
                  <ul className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {(occupantsByShelter[selectedShelter.id] ?? []).map((name) => (
                      <li key={name} className="py-2 text-sm">
                        {name}
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <div className="rounded border border-dashed p-3 text-sm text-slate-500 dark:border-zinc-800">Select a shelter to view occupants.</div>
              )}
            </div>
          </div>
        </div>
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

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-semibold">Edit Shelter Details</h2>
          <button className="rounded px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}