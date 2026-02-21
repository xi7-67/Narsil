<script lang="ts">
    import { browser } from "$app/environment";
    import {
        Play,
        Search as SearchIcon,
        Clock,
        HardDriveDownload,
    } from "lucide-svelte";
    import { libraryStore } from "$lib/stores/library.svelte";
    import { playerStore } from "$lib/stores/player";
    import { losslessAPI } from "$lib/api";
    import { formatArtists } from "$lib/utils";
    import { goto } from "$app/navigation";

    // Recent Searches
    const RECENT_SEARCHES_KEY = "narsil-recent-searches";
    let recentSearches = $state<string[]>([]);

    if (browser) {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) recentSearches = JSON.parse(stored);
        } catch {}

        // Listen for new searches to update the list
        window.addEventListener("storage", (e) => {
            if (e.key === RECENT_SEARCHES_KEY && e.newValue) {
                try {
                    recentSearches = JSON.parse(e.newValue);
                } catch {}
            }
        });
    }

    function doRecentSearch(term: string) {
        // Trigger global search update
        window.dispatchEvent(
            new CustomEvent("narsil-search-query", { detail: term }),
        );
        if (browser) {
            try {
                sessionStorage.setItem(
                    "narsil-search-cache",
                    JSON.stringify({ query: term, results: null }),
                );
            } catch {}
        }
        goto("/search");
    }

    function playLikedTrack(index: number) {
        const tracks = libraryStore.likedTracks.map((lt) => lt.track);
        if (tracks.length > 0) {
            playerStore.setQueue(tracks, index);
        }
    }
</script>

<div class="space-y-12">
    <!-- Header Greeting -->
    <div>
        <h1 class="text-4xl font-extrabold tracking-tight text-white mb-2">
            Welcome back
        </h1>
        <p class="text-slate-400">
            Jump right into your library or find something new.
        </p>
    </div>

    <!-- Liked Songs Section -->
    {#if libraryStore.likedTracks.length > 0}
        <section>
            <div class="flex items-center justify-between mb-6">
                <h2
                    class="text-2xl font-bold text-white flex items-center gap-2"
                >
                    <HardDriveDownload class="w-6 h-6 text-pink-500" />
                    Offline Liked Songs
                </h2>
                <a
                    href="/liked"
                    class="text-sm text-slate-400 hover:text-white transition-colors"
                    >View all</a
                >
            </div>

            <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
                {#each libraryStore.likedTracks.slice(0, 5) as item, idx}
                    <div
                        role="button"
                        tabindex="0"
                        onclick={() => playLikedTrack(idx)}
                        onkeydown={(e) =>
                            e.key === "Enter" && playLikedTrack(idx)}
                        class="bg-slate-800/40 p-4 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group block"
                    >
                        <div
                            class="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden bg-slate-700"
                        >
                            {#if item.track.album?.cover}
                                <img
                                    src={losslessAPI.getCoverUrl(
                                        item.track.album.cover,
                                        "320",
                                    )}
                                    alt={item.track.title}
                                    class="w-full h-full object-cover"
                                />
                            {/if}
                            <div
                                class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"
                            ></div>
                            <div
                                class="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-xl"
                            >
                                <Play class="w-5 h-5 fill-current ml-1" />
                            </div>
                        </div>
                        <h3 class="font-bold text-white w-full truncate">
                            {item.track.title}
                        </h3>
                        <p class="text-sm text-slate-400 truncate mt-1">
                            {formatArtists(item.track.artists)}
                        </p>
                    </div>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Recent Searches Section -->
    {#if recentSearches.length > 0}
        <section>
            <h2 class="text-2xl font-bold text-white mb-6">Recent Searches</h2>
            <div class="flex flex-wrap gap-3">
                {#each recentSearches.slice(0, 8) as term}
                    <button
                        onclick={() => doRecentSearch(term)}
                        class="flex items-center gap-2 px-4 py-3 bg-slate-800/60 hover:bg-slate-700 rounded-full transition-colors text-slate-200 group"
                    >
                        <Clock
                            class="w-4 h-4 text-slate-400 group-hover:text-white transition-colors"
                        />
                        <span class="font-medium">{term}</span>
                    </button>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Empty State if nothing is available yet -->
    {#if libraryStore.likedTracks.length === 0 && recentSearches.length === 0}
        <div
            class="flex flex-col items-center justify-center h-64 text-slate-500 py-20 bg-slate-900/50 rounded-3xl border border-slate-800/50 border-dashed"
        >
            <div class="mb-6 p-6 bg-slate-900 rounded-full shadow-inner">
                <SearchIcon class="w-12 h-12 text-blue-500/50" />
            </div>
            <h2 class="text-2xl font-bold text-white mb-3">
                Your library is empty
            </h2>
            <p class="text-lg max-w-md text-center">
                Use the search bar above to find tracks, albums, and artists.
                Like songs to save them offline.
            </p>
        </div>
    {/if}
</div>
