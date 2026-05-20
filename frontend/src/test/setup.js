import "@testing-library/jest-dom/vitest";

function createMemoryStorage() {
  const entries = new Map();
  return {
    get length() {
      return entries.size;
    },
    clear() {
      entries.clear();
    },
    getItem(key) {
      return entries.has(String(key)) ? entries.get(String(key)) : null;
    },
    key(index) {
      return Array.from(entries.keys())[index] || null;
    },
    removeItem(key) {
      entries.delete(String(key));
    },
    setItem(key, value) {
      entries.set(String(key), String(value));
    }
  };
}

const storage = globalThis.window?.localStorage || globalThis.localStorage || createMemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: storage
});

if (globalThis.window && !globalThis.window.localStorage) {
  Object.defineProperty(globalThis.window, "localStorage", {
    configurable: true,
    value: storage
  });
}
