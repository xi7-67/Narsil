<script lang="ts">
    import { page } from "$app/stores";
    import { Play } from "lucide-svelte";
    import { losslessAPI } from "$lib/api";
    import { playerStore } from "$lib/stores/player";
    import { formatArtists } from "$lib/utils";
    import type { ArtistDetails, Track } from "$lib/types";

    let artist: ArtistDetails | null = $state(null);
    let isLoading = $state(true);
    let error: string | null = $state(null);

    // Get artist ID from URL
    const artistId = $derived(Number($page.params.id));

    $effect(() => {
        if (artistId && artistId > 0) {
            loadArtist(artistId);
        }
    });

    async function loadArtist(id: number) {
        isLoading = true;
        error = null;
        try {
            artist = await losslessAPI.getArtist(id);
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to load artist";
            console.error("Failed to load artist:", e);
        }
        isLoading = false;
    }

    function playTrack(tracks: Track[], index: number) {
        playerStore.setQueue(tracks, index);
    }

    function playAllTracks() {
        if (artist?.tracks?.length) {
            playerStore.setQueue(artist.tracks, 0);
        }
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
{:else if artist}
    <div class="space-y-8">
        <!-- Artist Header -->
        <div class="flex items-end gap-6 pb-6">
            {#if artist.picture}
                <img
                    src={losslessAPI.getArtistPictureUrl(artist.picture)}
                    alt={artist.name}
                    class="w-48 h-48 rounded-full object-cover shadow-2xl"
                />
            {:else}
                <div
                    class="w-48 h-48 rounded-full bg-slate-800 flex items-center justify-center shadow-2xl"
                >
                    <span class="text-6xl font-bold text-slate-600"
                        >{artist.name[0]}</span
                    >
                </div>
            {/if}
            <div>
                <p
                    class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
                >
                    Artist
                </p>
                <h1 class="text-5xl font-bold text-white tracking-tight mb-4">
                    {artist.name}
                </h1>
                <button
                    onclick={playAllTracks}
                    class="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full transition-colors flex items-center gap-2"
                >
                    <Play class="w-5 h-5 fill-current" />
                    Play
                </button>
            </div>
        </div>

        <!-- Top Tracks -->
        {#if artist.tracks?.length}
            <section>
                <h2 class="text-2xl font-bold text-white mb-4">Popular</h2>
                <div class="space-y-1">
                    {#each artist.tracks.slice(0, 10) as track, idx}
                        <div
                            onclick={() => playTrack(artist!.tracks, idx)}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) =>
                                e.key === "Enter" &&
                                playTrack(artist!.tracks, idx)}
                            class="flex items-center gap-4 p-2 rounded-md hover:bg-slate-800/60 cursor-pointer transition-colors group"
                        >
                            <span
                                class="w-6 text-right text-sm text-slate-500 group-hover:hidden"
                                >{idx + 1}</span
                            >
                            <span
                                class="w-6 text-right hidden group-hover:block"
                            >
                                <Play class="w-4 h-4 text-white fill-current" />
                            </span>
                            <div
                                class="w-10 h-10 flex-shrink-0 rounded overflow-hidden"
                            >
                                {#if track.album?.cover}
                                    <img
                                        src={losslessAPI.getCoverUrl(
                                            track.album.cover,
                                            "80",
                                        )}
                                        alt="Cover"
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    <div
                                        class="w-full h-full bg-slate-800"
                                    ></div>
                                {/if}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-white font-medium truncate">
                                    {track.title}
                                </p>
                                <p class="text-sm text-slate-400 truncate">
                                    {formatArtists(track.artists)}
                                </p>
                            </div>
                            <span class="text-sm text-slate-500">
                                {losslessAPI.formatDuration(track.duration)}
                            </span>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- Albums -->
        {#if artist.albums?.length}
            <section>
                <h2 class="text-2xl font-bold text-white mb-4">Discography</h2>
                <div
                    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                >
                    {#each artist.albums.slice(0, 10) as album}
                        <a
                            href="/album/{album.id}"
                            class="bg-slate-800/40 p-4 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group block"
                        >
                            <div
                                class="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden"
                            >
                                {#if album.cover}
                                    <img
                                        src={losslessAPI.getCoverUrl(
                                            album.cover,
                                            "320",
                                        )}
                                        alt={album.title}
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    <div
                                        class="w-full h-full bg-slate-700"
                                    ></div>
                                {/if}
                                <div
                                    class="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-xl"
                                >
                                    <Play class="w-5 h-5 fill-current ml-1" />
                                </div>
                            </div>
                            <h3 class="font-bold text-white w-full truncate">
                                {album.title}
                            </h3>
                            <p class="text-sm text-slate-400 truncate mt-1">
                                {album.releaseDate
                                    ? album.releaseDate.split("-")[0]
                                    : ""} · {album.type || "Album"}
                            </p>
                        </a>
                    {/each}
                </div>
            </section>
        {/if}
    </div>
{/if}
