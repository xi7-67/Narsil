<script lang="ts">
    import { page } from "$app/stores";
    import { Play } from "lucide-svelte";
    import { losslessAPI } from "$lib/api";
    import { playerStore } from "$lib/stores/player";
    import { formatArtists } from "$lib/utils";
    import type { Album, Track } from "$lib/types";

    let album: Album | null = $state(null);
    let tracks: Track[] = $state([]);
    let isLoading = $state(true);
    let error: string | null = $state(null);

    const albumId = $derived(Number($page.params.id));

    $effect(() => {
        if (albumId && albumId > 0) {
            loadAlbum(albumId);
        }
    });

    async function loadAlbum(id: number) {
        isLoading = true;
        error = null;
        try {
            const data = await losslessAPI.getAlbum(id);
            album = data.album;
            tracks = data.tracks;
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to load album";
            console.error("Failed to load album:", e);
        }
        isLoading = false;
    }

    function playTrack(index: number) {
        playerStore.setQueue(tracks, index);
        playerStore.play();
    }

    function playAll() {
        if (tracks.length) {
            playerStore.setQueue(tracks, 0);
            playerStore.play();
        }
    }

    function formatDuration(seconds: number): string {
        if (!seconds || !isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    function totalDuration(): string {
        const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
        const mins = Math.floor(total / 60);
        return `${tracks.length} songs, ${mins} min`;
    }
</script>

{#if isLoading}
    <div class="flex items-center justify-center p-20">
        <div
            class="w-10 h-10 border-4 border-slate-600 border-t-white rounded-full animate-spin"
        ></div>
    </div>
{:else if error}
    <div class="text-center p-12 text-slate-400">
        <p>Error: {error}</p>
    </div>
{:else if album}
    <div class="space-y-8">
        <!-- Album Header -->
        <div class="flex items-end gap-6 pb-6">
            {#if album.cover}
                <img
                    src={losslessAPI.getCoverUrl(album.cover, "320")}
                    alt={album.title}
                    class="w-48 h-48 rounded-lg object-cover shadow-2xl flex-shrink-0"
                />
            {:else}
                <div
                    class="w-48 h-48 rounded-lg bg-slate-800 flex items-center justify-center shadow-2xl flex-shrink-0"
                >
                    <span class="text-6xl font-bold text-slate-600"
                        >{album.title[0]}</span
                    >
                </div>
            {/if}
            <div class="min-w-0">
                <p
                    class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
                >
                    {album.type || "Album"}
                </p>
                <h1
                    class="text-4xl font-bold text-white tracking-tight mb-2 truncate"
                >
                    {album.title}
                </h1>
                <p class="text-sm text-slate-400 mb-4">
                    {#if album.artist}
                        <a
                            href="/artist/{album.artist.id}"
                            class="text-white hover:underline font-medium"
                            >{album.artist.name}</a
                        >
                        ·
                    {/if}
                    {album.releaseDate ? album.releaseDate.split("-")[0] : ""} · {totalDuration()}
                </p>
                <button
                    onclick={playAll}
                    class="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full transition-colors flex items-center gap-2"
                >
                    <Play class="w-5 h-5 fill-current" />
                    Play
                </button>
            </div>
        </div>

        <!-- Track List -->
        {#if tracks.length}
            <div class="space-y-1">
                {#each tracks as track, idx}
                    <div
                        onclick={() => playTrack(idx)}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) => e.key === "Enter" && playTrack(idx)}
                        class="flex items-center gap-4 p-2 rounded-md hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                        <span
                            class="w-6 text-right text-sm text-slate-500 group-hover:hidden"
                            >{track.trackNumber || idx + 1}</span
                        >
                        <span class="w-6 text-right hidden group-hover:block">
                            <Play class="w-4 h-4 text-white fill-current" />
                        </span>
                        <div class="flex-1 min-w-0">
                            <p class="text-white font-medium truncate">
                                {track.title}
                                {#if track.version}
                                    <span class="text-slate-400 text-sm"
                                        >({track.version})</span
                                    >
                                {/if}
                            </p>
                            <p class="text-sm text-slate-400 truncate">
                                {formatArtists(track.artists)}
                            </p>
                        </div>
                        <span class="text-sm text-slate-500">
                            {formatDuration(track.duration)}
                        </span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}
