export function getStorage() {
  if (typeof globalThis === "undefined") return null;

  const candidate = globalThis.localStorage || globalThis.window?.localStorage;
  if (!candidate) return null;

  try {
    const probeKey = "__openarca_storage_probe__";
    candidate.setItem(probeKey, "1");
    candidate.removeItem(probeKey);
    return candidate;
  } catch (_error) {
    return null;
  }
}

export function getStoredValue(key, fallback = null) {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    return storage.getItem(key) ?? fallback;
  } catch (_error) {
    return fallback;
  }
}

export function setStoredValue(key, value) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch (_error) {
    // Storage can be unavailable in privacy modes or non-browser runtimes.
  }
}

export function removeStoredValue(key) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch (_error) {
    // Storage can be unavailable in privacy modes or non-browser runtimes.
  }
}
