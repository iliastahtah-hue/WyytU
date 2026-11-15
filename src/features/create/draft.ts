import { useSyncExternalStore } from 'react';

/** Lieu choisi sur l'écran « Où ? » et renvoyé au formulaire de création. */
export type PickedPlace = {
  name: string;
  partnerId: string | null;
  discountPct: number | null;
  lat: number | null;
  lng: number | null;
};

let place: PickedPlace | null = null;
const listeners = new Set<() => void>();

export const placeStore = {
  get: () => place,
  set(next: PickedPlace | null) {
    place = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function usePickedPlace() {
  return useSyncExternalStore(placeStore.subscribe, placeStore.get, placeStore.get);
}
