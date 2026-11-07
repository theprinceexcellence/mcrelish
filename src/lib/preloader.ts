import { useSyncExternalStore } from "react";

let appReady = false;
let preloaderDone = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isAppReady = () => appReady;

export function markAppReady() {
  if (appReady) return;
  appReady = true;
  emit();
}

export function finishPreloader() {
  if (preloaderDone) return;
  preloaderDone = true;
  emit();
}

export const usePreloaderDone = () =>
  useSyncExternalStore(
    subscribe,
    () => preloaderDone,
    () => false,
  );
