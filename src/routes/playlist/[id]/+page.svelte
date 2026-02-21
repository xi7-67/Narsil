<script lang="ts">
    import { page } from "$app/stores";
    import { libraryStore } from "$lib/stores/library.svelte";
    import { losslessAPI } from "$lib/api";
    import type { Track } from "$lib/types";
    import { formatArtists } from "$lib/utils";
    import { Play, ListMusic, Trash2 } from "lucide-svelte";
    import { playerStore } from "$lib/stores/player";
    import { goto } from "$app/navigation";

    const playlistId = $derived($page.params.id);
    const playlist = $derived(
        libraryStore.playlists.find((p) => p.id === playlistId),
    );

    // For simplicity, we assume tracks in a playlist are also in the liked queue
    // or we fetch them if needed. This is a basic offline playlist that pulls
    // cached track objects from the likedTracks store for now.
    // In a full implementation, the playlist object should store the full Track object
    // or we should fetch it from the API if it's not downloaded yet.
    // Here we'll map trackIds to LikedTracks inside the libraryStore which have full Track info.

    const playlistTracks = $derived.by(() => {
        if (!playlist) return [];
        const items = playlist.trackIds
            .map((id) => {
                return libraryStore.likedTracks.find(
                    (lt) => String(lt.track.id) === id,
                )?.track;
            })
            .filter(Boolean) as Track[];
        return items;
    });

    function playAll() {
        if (playlistTracks.length > 0) {
            playerStore.setQueue(playlistTracks, 0);
        }
    }

    function playTrack(index: number) {
        if (playlistTracks.length > 0) {
            playerStore.setQueue(playlistTracks, index);
        }
    }

    function removeTrack(trackId: number | string, e: Event) {
        e.stopPropagation();
        if (playlist) {
            libraryStore.removeTrackFromPlaylist(playlist.id, trackId);
        }
    }

    function deletePlaylist() {
        if (
            playlist &&
            confirm(`Are you sure you want to delete "${playlist.name}"?`)
        ) {
            libraryStore.deletePlaylist(playlist.id);
            goto("/");
        }
    }
</script>

{#if playlist}
    <div class="space-y-8">
        <!-- Header -->
        <div
            class="flex items-end gap-6 bg-gradient-to-b from-indigo-900/60 to-slate-900 -mx-8 -mt-10 px-8 pt-20 pb-10"
        >
            <div
                class="w-40 h-40 bg-slate-800 shadow-2xl rounded-xl flex items-center justify-center flex-shrink-0"
            >
                <ListMusic class="w-16 h-16 text-slate-500" />
            </div>
            <div class="flex flex-col gap-2 flex-1">
                <span
                    class="text-xs font-bold uppercase tracking-widest text-white/80"
                    >Custom Playlist</span
                >
                <h1
                    class="text-5xl lg:text-7xl font-extrabold text-white tracking-tight"
                >
                    {playlist.name}
                </h1>
                <div
                    class="flex items-center gap-2 text-sm text-slate-300 font-medium mt-2"
                >
                    <span class="text-white">{playlistTracks.length} songs</span
                    >
                </div>
            </div>
            <button
                onclick={deletePlaylist}
                class="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors mb-2"
                title="Delete Playlist"
            >
                <Trash2 class="w-4 h-4" />
            </button>
        </div>

        <!-- Controls -->
        {#if playlistTracks.length > 0}
            <div class="flex items-center gap-4">
                <button
                    onclick={playAll}
                    class="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    <Play class="w-6 h-6 fill-current ml-1" />
                </button>
            </div>

            <!-- Track List -->
            <div class="w-full">
                <div
                    class="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 border-b border-slate-800 text-sm font-semibold text-slate-400 mb-4 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10"
                >
                    <div class="w-8 text-center">#</div>
                    <div>Title</div>
                    <div class="w-12 text-center"></div>
                </div>

                <div class="space-y-1 pb-10">
                    {#each playlistTracks as track, idx}
                        <div
                            role="button"
                            tabindex="0"
                            onclick={() => playTrack(idx)}
                            onkeydown={(e) =>
                                e.key === "Enter" && playTrack(idx)}
                            class="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2 hover:bg-slate-800/60 rounded-lg group cursor-pointer transition-colors"
                        >
                            <div
                                class="w-8 text-center text-slate-400 group-hover:hidden"
                            >
                                {idx + 1}
                            </div>
                            <div
                                class="w-8 flex justify-center hidden group-hover:flex"
                            >
                                <Play class="w-4 h-4 text-white fill-current" />
                            </div>

                            <div class="flex items-center gap-4 min-w-0">
                                <div
                                    class="w-10 h-10 rounded shadow-sm overflow-hidden flex-shrink-0 bg-slate-800"
                                >
                                    {#if track.album?.cover}
                                        <img
                                            src={losslessAPI.getCoverUrl(
                                                track.album.cover,
                                                "80",
                                            )}
                                            alt=""
                                            class="w-full h-full object-cover"
                                        />
                                    {/if}
                                </div>
                                <div class="flex flex-col truncate">
                                    <span
                                        class="text-white font-medium truncate"
                                        >{track.title}</span
                                    >
                                    <span
                                        class="text-sm text-slate-400 truncate hover:text-white transition-colors"
                                        >{formatArtists(track.artists)}</span
                                    >
                                </div>
                            </div>

                            <div
                                class="w-12 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <button
                                    onclick={(e) => removeTrack(track.id, e)}
                                    class="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                    aria-label="Remove from Playlist"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <!-- Empty State -->
            <div
                class="flex flex-col items-center justify-center py-20 text-slate-500"
            >
                <ListMusic class="w-16 h-16 mb-4 text-slate-700" />
                <h2 class="text-2xl font-bold text-white mb-2">
                    This playlist is empty
                </h2>
                <p>Go to your Liked Songs and add them to this playlist!</p>
            </div>
        {/if}
    </div>
{:else}
    <div
        class="flex items-center justify-center h-full text-slate-500 font-medium"
    >
        Playlist not found.
    </div>
{/if}
