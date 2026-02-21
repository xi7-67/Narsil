<script lang="ts">
    import { libraryStore } from "$lib/stores/library.svelte";
    import { HardDriveDownload, ListMusic, PlusSquare } from "lucide-svelte";
    import { losslessAPI } from "$lib/api";

    function handleCreatePlaylist() {
        const name = window.prompt("Enter playlist name:");
        if (name && name.trim()) {
            libraryStore.createPlaylist(name.trim());
        }
    }
</script>

<div class="space-y-12">
    <div>
        <h1 class="text-4xl font-extrabold tracking-tight text-white mb-2">
            Your Library
        </h1>
        <p class="text-slate-400">Offline tunes and custom playlists.</p>
    </div>

    <!-- Pinned / Defaults -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <a
            href="/liked"
            class="flex flex-col p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg cursor-pointer group"
        >
            <div class="flex-1">
                <div
                    class="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 group-hover:bg-white/30 transition-colors"
                >
                    <HardDriveDownload class="w-6 h-6 text-white" />
                </div>
                <h3 class="text-2xl font-bold text-white mb-1">Liked Songs</h3>
                <p class="text-indigo-200">
                    {libraryStore.likedTracks.length} tracks
                </p>
            </div>
        </a>

        <button
            onclick={handleCreatePlaylist}
            class="flex flex-col p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group text-left"
        >
            <div class="flex-1">
                <div
                    class="flex items-center justify-center w-12 h-12 bg-slate-800 rounded-xl mb-4 group-hover:bg-slate-700 transition-colors"
                >
                    <PlusSquare
                        class="w-6 h-6 text-slate-300 group-hover:text-white"
                    />
                </div>
                <h3 class="text-2xl font-bold text-white mb-1">New Playlist</h3>
                <p class="text-slate-400">Curate a fresh list</p>
            </div>
        </button>
    </div>

    <!-- Playlists -->
    <section>
        <h2 class="text-2xl font-bold text-white mb-6">Playlists</h2>
        {#if libraryStore.playlists.length > 0}
            <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
                {#each libraryStore.playlists as playlist}
                    <a
                        href={`/playlist/${playlist.id}`}
                        class="bg-slate-800/40 p-4 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group block"
                    >
                        <div
                            class="w-full aspect-square mb-4 bg-slate-700 rounded-md flex items-center justify-center shadow-lg"
                        >
                            <ListMusic
                                class="w-12 h-12 text-slate-500 group-hover:text-white transition-colors"
                            />
                        </div>
                        <h3 class="font-bold text-white w-full truncate">
                            {playlist.name}
                        </h3>
                        <p class="text-sm text-slate-400 mt-1">
                            {playlist.trackIds.length} tracks
                        </p>
                    </a>
                {/each}
            </div>
        {:else}
            <div
                class="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed"
            >
                <ListMusic class="w-12 h-12 mb-4 text-slate-600" />
                <p>No custom playlists yet.</p>
            </div>
        {/if}
    </section>
</div>
