import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Artist } from './types';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Formats an array of artists into a readable string for UI display.
 * For single artist: "Artist Name"
 * For multiple artists: "Artist1, Artist2 & Artist3"
 */
export function formatArtists(artists: Artist[] | undefined): string {
	if (!artists || artists.length === 0) return 'Unknown Artist';
	if (artists.length === 1) return artists[0].name;
	if (artists.length === 2) return `${artists[0].name} & ${artists[1].name}`;
	const allButLast = artists.slice(0, -1).map(a => a.name).join(', ');
	const last = artists[artists.length - 1].name;
	return `${allButLast} & ${last}`;
}

export function formatArtistsForMetadata(artists: Artist[] | undefined): string {
	if (!artists || artists.length === 0) return 'Unknown Artist';
	return artists.map(a => a.name).join('; ');
}
