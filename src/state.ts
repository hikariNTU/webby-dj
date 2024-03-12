import { atom } from "jotai";

export const durationAtom = atom(0);
export const timeAtom = atom(0);
export const nameAtom = atom("");
export const isPlayingAtom = atom(false);
export const progressAtom = atom((get) => {
  return get(timeAtom) / (get(durationAtom) || 1);
});
