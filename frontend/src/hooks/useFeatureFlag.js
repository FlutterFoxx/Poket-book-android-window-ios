/**
 * useFeatureFlag — Check if a feature is enabled.
 * Flags are controlled from SuperAdmin panel without redeploying.
 * 
 * Usage: const canShare = useFeatureFlag("pdf_share", true);
 */
import { useState, useEffect } from "react";

let cachedFlags = null;
let fetchPromise = null;

async function loadFlags() {
  if (cachedFlags) return cachedFlags;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/api/feature-flags`)
    .then(r => r.json())
    .then(data => { cachedFlags = data; fetchPromise = null; return data; })
    .catch(() => { fetchPromise = null; return {}; });
  return fetchPromise;
}

// Refresh flags every 5 minutes
setInterval(() => { cachedFlags = null; }, 5 * 60 * 1000);

export function useFeatureFlag(key, defaultValue = true) {
  const [enabled, setEnabled] = useState(defaultValue);
  useEffect(() => {
    loadFlags().then(flags => {
      if (key in flags) setEnabled(flags[key]);
    });
  }, [key]);
  return enabled;
}

// Sync version for non-hook contexts
export function isFeatureEnabled(key, defaultValue = true) {
  if (!cachedFlags) return defaultValue;
  return key in cachedFlags ? cachedFlags[key] : defaultValue;
}

// Preload flags on app start
export function preloadFlags() {
  loadFlags();
}
