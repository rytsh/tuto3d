import { writable } from "svelte/store";

// information
export const informationData = writable("");
export const showInfo = writable(false);
export const showInfoReset = writable(undefined);

// debugging
export const debugging = writable({ resize: false });
