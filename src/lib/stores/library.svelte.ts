import { browser } from '$app/environment';
import type { Track, Album } from '$lib/types';

export interface LocalPlaylist {
    id: string;
    createdAt: number;
    name: string;
    coverArtUrl?: string;
    trackIds: string[];
}

export interface LikedTrack {
    track: Track;
    likedAt: number;
    downloadRequestId?: string; // TBD: integrate with downloadUi
}

const STORAGE_KEY = 'narsil-library-v1';

class LibraryStore {
    likedTracks: LikedTrack[] = [];
    playlists: LocalPlaylist[] = [];
    isLoaded = false;

    constructor() {
        if (browser) {
            this.load();
        }
    }

    private load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.likedTracks = parsed.likedTracks || [];
                this.playlists = parsed.playlists || [];
            }
        } catch (e) {
            console.error('Failed to load library data', e);
        } finally {
            this.isLoaded = true;
        }
    }

    private save() {
        if (!browser) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                likedTracks: this.likedTracks,
                playlists: this.playlists
            }));
        } catch (e) {
            console.error('Failed to save library data', e);
        }
    }

    // Liked Tracks
    isLiked(trackId: number | string): boolean {
        return this.likedTracks.some(lt => lt.track.id === trackId || lt.track.id === Number(trackId));
    }

    toggleLike(track: Track) {
        if (this.isLiked(track.id)) {
            this.likedTracks = this.likedTracks.filter(lt => lt.track.id !== track.id);
            // TODO: Optional: delete locally downloaded file
        } else {
            this.likedTracks = [{ track, likedAt: Date.now() }, ...this.likedTracks];
            // TODO: trigger background download queue
            this.downloadLikedTrack(track);
        }
        this.save();
    }

    private async downloadLikedTrack(track: Track) {
        // @ts-ignore
        if (!browser || !window.__TAURI_INTERNALS__) return; // Only run in Tauri

        try {
            // Dynamically import Tauri plugins to avoid breaking web builds
            const { writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
            const { BaseDirectory, join } = await import('@tauri-apps/api/path');
            const { losslessAPI } = await import('$lib/api');
            const { buildTrackFilename } = await import('$lib/downloads');
            const { userPreferencesStore } = await import('$lib/stores/userPreferences');
            const { get } = await import('svelte/store');

            const libraryDir = await join('Narsil', 'Liked Songs');

            // Ensure directory exists
            const dirExists = await exists(libraryDir, { baseDir: BaseDirectory.Audio });
            if (!dirExists) {
                await mkdir(libraryDir, { baseDir: BaseDirectory.Audio, recursive: true });
            }

            // Quality logic
            const prefs = get(userPreferencesStore);
            const quality = prefs.playbackQuality || 'LOSSLESS';

            // We need an album object for buildTrackFilename. Fallback if missing
            const dummyAlbum = track.album || {
                id: -1,
                title: 'Unknown Album',
                cover: '',
                artist: track.artists?.[0],
                duration: track.duration,
                releaseDate: '',
                numberOfTracks: 1,
                numberOfVolumes: 1
            } as unknown as Album;
            const filename = buildTrackFilename(dummyAlbum, track, quality, undefined, prefs.convertAacToMp3);

            const fullPath = await join(libraryDir, filename);
            const fileExists = await exists(fullPath, { baseDir: BaseDirectory.Audio });

            if (!fileExists) {
                console.log(`[Library] Downloading liked track to OS Music folder: ${filename}`);
                const { blob } = await losslessAPI.fetchTrackBlob(track.id, quality, filename, {
                    ffmpegAutoTriggered: false,
                    convertAacToMp3: prefs.convertAacToMp3
                });

                const arrayBuffer = await blob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                await writeFile(fullPath, uint8Array, { baseDir: BaseDirectory.Audio });
                console.log(`[Library] Successfully saved: ${fullPath}`);
            }
        } catch (e) {
            console.error('[Library] Failed to download liked track to disk', e);
        }
    }

    // Playlists
    createPlaylist(name: string): LocalPlaylist {
        const playlist: LocalPlaylist = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            trackIds: []
        };
        this.playlists = [playlist, ...this.playlists];
        this.save();
        return playlist;
    }

    deletePlaylist(id: string) {
        this.playlists = this.playlists.filter(p => p.id !== id);
        this.save();
    }

    addTrackToPlaylist(playlistId: string, trackId: string | number) {
        const idStr = String(trackId);
        this.playlists = this.playlists.map(p => {
            if (p.id === playlistId && !p.trackIds.includes(idStr)) {
                return { ...p, trackIds: [...p.trackIds, idStr] };
            }
            return p;
        });
        this.save();
    }

    removeTrackFromPlaylist(playlistId: string, trackId: string | number) {
        const idStr = String(trackId);
        this.playlists = this.playlists.map(p => {
            if (p.id === playlistId) {
                return { ...p, trackIds: p.trackIds.filter(id => id !== idStr) };
            }
            return p;
        });
        this.save();
    }
}

// Convert LibraryStore to a reactive writable store pattern for Svelte 5 by wrapping with $state
export function createReactiveLibrary() {
    let internal = $state(new LibraryStore());

    return {
        get likedTracks() { return internal.likedTracks; },
        get playlists() { return internal.playlists; },
        get isLoaded() { return internal.isLoaded; },
        isLiked(id: string | number) { return internal.isLiked(id); },
        toggleLike(track: Track) {
            internal.toggleLike(track);
            internal = internal; // trigger reactivity
        },
        createPlaylist(name: string) {
            const p = internal.createPlaylist(name);
            internal = internal;
            return p;
        },
        deletePlaylist(id: string) {
            internal.deletePlaylist(id);
            internal = internal;
        },
        addTrackToPlaylist(pid: string, tid: string | number) {
            internal.addTrackToPlaylist(pid, tid);
            internal = internal;
        },
        removeTrackFromPlaylist(pid: string, tid: string | number) {
            internal.removeTrackFromPlaylist(pid, tid);
            internal = internal;
        }
    };
}

export const libraryStore = createReactiveLibrary();
