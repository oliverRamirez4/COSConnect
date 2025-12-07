import { useEffect, useState } from "react";
import { Shelter } from "../types";

export function useShelters() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shelters');
      if (!res.ok) throw new Error('Failed to fetch shelters');
      const data = await res.json();
      setShelters(data);
    } catch (err) {
      setError('Error fetching shelters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { shelters, loading, error, refetch };
}