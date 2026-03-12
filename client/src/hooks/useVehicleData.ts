import { useState, useEffect } from 'react';

export interface EngineData {
  hp: number | null;
  ecus: string[];
}

export type VehicleData = Record<string, Record<string, Record<string, Record<string, EngineData>>>>;

let cachedData: VehicleData | null = null;
let fetchPromise: Promise<VehicleData> | null = null;

async function loadVehicleData(): Promise<VehicleData> {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/vehicle-data.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load vehicle data');
      return res.json();
    })
    .then(data => {
      cachedData = data;
      return data;
    })
    .catch(err => {
      fetchPromise = null;
      throw err;
    });

  return fetchPromise;
}

export function useVehicleData() {
  const [data, setData] = useState<VehicleData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    loadVehicleData()
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  return { data, loading, error };
}
