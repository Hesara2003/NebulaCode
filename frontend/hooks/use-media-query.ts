import { useSyncExternalStore } from "react";

const isClient = typeof window !== "undefined";

const subscribe = (query: string, callback: () => void) => {
  if (!isClient) {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
};

const getSnapshot = (query: string) => {
  if (!isClient) {
    return false;
  }
  return window.matchMedia(query).matches;
};

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => getSnapshot(query),
    () => false
  );
}
