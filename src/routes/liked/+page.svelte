<script lang="ts">
    import { libraryStore } from "$lib/stores/library.svelte";
    import { playerStore } from "$lib/stores/player";
    import { losslessAPI } from "$lib/api";
    import { formatArtists } from "$lib/utils";
    import { Play, HardDriveDownload, Trash2 } from "lucide-svelte";

    function playAll() {
        const tracks = libraryStore.likedTracks.map((lt) => lt.track);
        if (tracks.length > 0) {
            playerStore.setQueue(tracks, 0);
        }
    }

    function playTrack(index: number) {
        const tracks = libraryStore.likedTracks.map((lt) => lt.track);
        if (tracks.length > 0) {
            playerStore.setQueue(tracks, index);
        }
    }

    function removeTrack(trackId: number | string, e: Event) {
        e.stopPropagation(); // prevent playing track
        // Find track first
        const item = libraryStore.likedTracks.find(
            (lt) => lt.track.id === trackId || lt.track.id === Number(trackId),
        );
        if (item) {
            libraryStore.toggleLike(item.track);
        }
    }
</script>

<div class="space-y-8">
    <!-- Header -->
    <div
        class="flex items-end gap-6 bg-gradient-to-b from-indigo-900/60 to-slate-900 -mx-8 -mt-10 px-8 pt-20 pb-10"
    >
        <div
            class="w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-500 shadow-2xl rounded-xl flex items-center justify-center flex-shrink-0"
        >
            <HardDriveDownload class="w-16 h-16 text-white" />
        </div>
        <div class="flex flex-col gap-2">
            <span
                class="text-xs font-bold uppercase tracking-widest text-white/80"
                >Playlist</span
            >
            <h1
                class="text-5xl lg:text-7xl font-extrabold text-white tracking-tight"
            >
                Liked Songs
            </h1>
            <div
                class="flex items-center gap-2 text-sm text-slate-300 font-medium mt-2"
            >
                <span class="text-white">You</span>
                <span>•</span>
                <span>{libraryStore.likedTracks.length} songs</span>
            </div>
        </div>
    </div>

    <!-- Controls -->
    {#if libraryStore.likedTracks.length > 0}
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
                {#each libraryStore.likedTracks as item, idx}
                    <div
                        role="button"
                        tabindex="0"
                        onclick={() => playTrack(idx)}
                        onkeydown={(e) => e.key === "Enter" && playTrack(idx)}
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
                                {#if item.track.album?.cover}
                                    <img
                                        src={losslessAPI.getCoverUrl(
                                            item.track.album.cover,
                                            "80",
                                        )}
                                        alt=""
                                        class="w-full h-full object-cover"
                                    />
                                {/if}
                            </div>
                            <div class="flex flex-col truncate">
                                <span class="text-white font-medium truncate"
                                    >{item.track.title}</span
                                >
                                <span
                                    class="text-sm text-slate-400 truncate hover:text-white transition-colors"
                                    >{formatArtists(item.track.artists)}</span
                                >
                            </div>
                        </div>

                        <div
                            class="w-12 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                onclick={(e) => removeTrack(item.track.id, e)}
                                class="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                aria-label="Remove from Liked Songs"
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
            <HardDriveDownload class="w-16 h-16 mb-4 text-slate-700" />
            <h2 class="text-2xl font-bold text-white mb-2">
                Songs you like will appear here
            </h2>
            <p>Save songs by tapping the heart icon.</p>
        </div>
    {/if}
</div>
