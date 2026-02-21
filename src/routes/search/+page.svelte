<script lang="ts">
    import { browser } from "$app/environment";
    import { Search as SearchIcon, Play, X, Clock } from "lucide-svelte";
    import { losslessAPI } from "$lib/api";
    import {
        type SearchResponse,
        type Track,
        type Artist,
        type Album,
        type Playlist,
    } from "$lib/types";
    import { formatArtists } from "$lib/utils";
    import { playerStore } from "$lib/stores/player";

    interface CombinedSearchResults {
        tracks: SearchResponse<Track>;
        artists: SearchResponse<Artist>;
        albums: SearchResponse<Album>;
        playlists: SearchResponse<Playlist>;
    }

    let query = $state("");
    let isSearching = $state(false);
    let results: CombinedSearchResults | null = $state(null);

    // Initial load from session cache handled by GlobalSearch and synced here
    if (browser) {
        try {
            const cached = sessionStorage.getItem("narsil-search-cache");
            if (cached) {
                const data = JSON.parse(cached);
                query = data.query ?? "";
                results = data.results ?? null;
            }
        } catch {}
    }

    import { onMount } from "svelte";

    $effect(() => {
        const handleSearchSync = (e: CustomEvent<string>) => {
            query = e.detail;
            if (query.trim().length > 2) {
                // Debounce auto-search while typing
                clearTimeout(timer);
                timer = setTimeout(() => doSearch(), 400);
            } else {
                results = null;
            }
        };

        const handleSearchExecute = (e: CustomEvent<string>) => {
            query = e.detail;
            clearTimeout(timer);
            if (query.trim().length > 2) {
                doSearch();
            }
        };

        if (browser) {
            window.addEventListener(
                "narsil-search-query",
                handleSearchSync as EventListener,
            );
            window.addEventListener(
                "narsil-search-execute",
                handleSearchExecute as EventListener,
            );
            return () => {
                window.removeEventListener(
                    "narsil-search-query",
                    handleSearchSync as EventListener,
                );
                window.removeEventListener(
                    "narsil-search-execute",
                    handleSearchExecute as EventListener,
                );
            };
        }
    });

    onMount(() => {
        // Auto-search if coming from another page with a cached query but no results
        if (query.trim().length > 2 && !results && !isSearching) {
            doSearch();
        }
    });

    // Debounced search
    let timer: ReturnType<typeof setTimeout>;
    async function doSearch() {
        const q = query.trim();
        if (q.length <= 2) return;
        isSearching = true;
        try {
            const [tracks, artists, albums, playlists] = await Promise.all([
                losslessAPI.searchTracks(q),
                losslessAPI.searchArtists(q),
                losslessAPI.searchAlbums(q),
                losslessAPI.searchPlaylists(q),
            ]);
            results = { tracks, artists, albums, playlists };
        } catch (e) {
            console.error("Search failed:", e);
            results = null;
        }
        isSearching = false;
    }
</script>

<div class="space-y-6">
    <!-- The GlobalSearch component in +layout.svelte now handles the input UI -->

    {#if isSearching}
        <div class="flex items-center justify-center p-12">
            <div
                class="w-8 h-8 border-4 border-slate-600 border-t-white rounded-full animate-spin"
            ></div>
        </div>
    {:else if results}
        <div class="space-y-10">
            <!-- Top Result & Tracks -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <!-- Top Result -->
                {#if results.artists?.items?.[0]}
                    <div class="lg:col-span-2 space-y-4">
                        <h2
                            class="text-2xl font-bold tracking-tight text-white"
                        >
                            Top result
                        </h2>
                        <a
                            href="/artist/{results.artists.items[0].id}"
                            class="bg-slate-800/40 hover:bg-slate-800 transition-colors rounded-xl p-6 group cursor-pointer relative block"
                        >
                            <img
                                src={results.artists.items[0].picture
                                    ? losslessAPI.getArtistPictureUrl(
                                          results.artists.items[0].picture,
                                      )
                                    : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300"}
                                alt="Artist"
                                class="w-24 h-24 rounded-full mb-6 object-cover shadow-lg"
                            />
                            <h3
                                class="text-3xl font-bold text-white mb-2 truncate"
                            >
                                {results.artists.items[0].name}
                            </h3>
                            <div class="flex items-center gap-2">
                                <span
                                    class="px-3 py-1 bg-slate-900 rounded-full text-xs font-semibold text-white tracking-wide uppercase"
                                    >Artist</span
                                >
                            </div>
                            <div
                                class="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-xl"
                            >
                                <Play class="w-6 h-6 fill-current ml-1" />
                            </div>
                        </a>
                    </div>
                {/if}

                <!-- Songs -->
                {#if results.tracks?.items?.length}
                    <div class="lg:col-span-3 space-y-4">
                        <h2
                            class="text-2xl font-bold tracking-tight text-white"
                        >
                            Songs
                        </h2>
                        <div class="space-y-2">
                            {#each results.tracks.items.slice(0, 4) as track, idx}
                                <div
                                    onclick={() =>
                                        playerStore.setQueue(
                                            results!.tracks.items,
                                            idx,
                                        )}
                                    role="button"
                                    tabindex="0"
                                    onkeydown={(e) =>
                                        e.key === "Enter" &&
                                        playerStore.setQueue(
                                            results!.tracks.items,
                                            idx,
                                        )}
                                    class="flex items-center justify-between p-2 rounded-md hover:bg-slate-800/60 group cursor-pointer transition-colors"
                                >
                                    <div
                                        class="flex items-center gap-4 flex-1 min-w-0"
                                    >
                                        <div
                                            class="relative w-10 h-10 flex-shrink-0"
                                        >
                                            <img
                                                src={track.album?.cover
                                                    ? losslessAPI.getCoverUrl(
                                                          track.album.cover,
                                                          "80",
                                                      )
                                                    : "https://images.unsplash.com/photo-1614613535308-eb5fbdcd42b2?auto=format&fit=crop&q=80&w=150&h=150"}
                                                alt="Cover"
                                                class="w-full h-full object-cover rounded"
                                            />
                                            <div
                                                class="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded"
                                            >
                                                <Play
                                                    class="w-4 h-4 text-white fill-current"
                                                />
                                            </div>
                                        </div>
                                        <div
                                            class="flex flex-col truncate pr-4"
                                        >
                                            <span
                                                class="text-white font-medium truncate"
                                                >{track.title}</span
                                            >
                                            <span
                                                class="text-sm text-slate-400 truncate"
                                                >{formatArtists(
                                                    track.artists,
                                                )}</span
                                            >
                                        </div>
                                    </div>
                                    <span
                                        class="text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {losslessAPI.formatDuration(
                                            track.duration,
                                        )}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Albums -->
            {#if results.albums?.items?.length}
                <section>
                    <h2 class="text-2xl font-bold text-white mb-4">Albums</h2>
                    <div
                        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                    >
                        {#each results.albums.items.slice(0, 5) as album}
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
                                        <Play
                                            class="w-5 h-5 fill-current ml-1"
                                        />
                                    </div>
                                </div>
                                <h3
                                    class="font-bold text-white w-full truncate"
                                >
                                    {album.title}
                                </h3>
                                <p class="text-sm text-slate-400 truncate mt-1">
                                    {album.releaseDate
                                        ? album.releaseDate.split("-")[0]
                                        : ""}
                                    {#if album.artist}
                                        · {album.artist.name}
                                    {/if}
                                </p>
                            </a>
                        {/each}
                    </div>
                </section>
            {/if}
        </div>
    {:else if query.length > 2}
        <div class="text-center p-12 text-slate-400">
            <p>No results found for "{query}"</p>
        </div>
    {:else}
        <!-- Browse All -->
        <div>
            <h2 class="text-xl font-bold tracking-tight text-white mb-6">
                Browse all
            </h2>
            <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
                {#each ["Pop", "Hip-Hop", "Rock", "Electronic", "Jazz", "Classical", "R&B", "Indie", "Country", "Metal"] as genre, i}
                    <div
                        class="aspect-square rounded-xl p-4 overflow-hidden relative cursor-pointer hover:scale-105 transition-transform duration-300"
                        style="background-color: hsl({i * 36}, 70%, 40%)"
                    >
                        <h3
                            class="text-xl font-bold text-white break-words w-3/4 leading-tight"
                        >
                            {genre}
                        </h3>
                        <div
                            class="absolute -bottom-4 -right-4 w-24 h-24 bg-black/20 transform rotate-[25deg] rounded-lg shadow-2xl backdrop-blur-sm"
                        ></div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
