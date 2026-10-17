import { useState } from 'react';
import { api } from '@/api';

/** Saves a finished activity once and exposes the save receipt. */
export function useActivity(onActivitySaved) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(payload) {
    setSaving(true);
    setError(null);
    try {
      const r = await api.completeActivity(payload);
      setResult(r);
      onActivitySaved?.(r);
      return r;
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { save, reset, result, error, saving };
}

export function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) */
  }
}
