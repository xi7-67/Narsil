<script lang="ts">
    import { cn } from "$lib/utils";
    import {
        Home,
        Search,
        Library,
        PlusSquare,
        Heart,
        ListMusic,
    } from "lucide-svelte";
    import { libraryStore } from "$lib/stores/library.svelte";

    function handleCreatePlaylist() {
        const name = window.prompt("Enter playlist name:");
        if (name && name.trim()) {
            libraryStore.createPlaylist(name.trim());
        }
    }
</script>

<aside
    class="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full pt-4"
>
    <!-- Navigation -->
    <nav class="flex-1 px-3 space-y-6 overflow-y-auto">
        <div class="space-y-1">
            <a
                href="/"
                class="flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md hover:text-white text-slate-300 hover:bg-slate-900 transition-colors"
            >
                <Home class="w-5 h-5" />
                Home
            </a>
            <a
                href="/search"
                class="flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md hover:text-white text-slate-300 hover:bg-slate-900 transition-colors"
            >
                <Search class="w-5 h-5" />
                Search
            </a>
            <a
                href="/library"
                class="flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md hover:text-white text-slate-300 hover:bg-slate-900 transition-colors"
            >
                <Library class="w-5 h-5" />
                Your Library
            </a>
        </div>

        <div class="space-y-1 pt-4 border-t border-slate-800">
            <button
                onclick={handleCreatePlaylist}
                class="w-full flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md hover:text-white text-slate-300 hover:bg-slate-900 transition-colors"
            >
                <div
                    class="flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-900 rounded-sm"
                >
                    <PlusSquare class="w-4 h-4" />
                </div>
                Create Playlist
            </button>
            <a
                href="/liked"
                class="flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md hover:text-white text-slate-300 hover:bg-slate-900 transition-colors"
            >
                <div
                    class="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-sm"
                >
                    <Heart class="w-4 h-4 fill-current" />
                </div>
                Liked Songs
            </a>

            {#each libraryStore.playlists as playlist}
                <a
                    href={`/playlist/${playlist.id}`}
                    class="flex items-center gap-4 px-3 py-2 text-sm font-medium rounded-md hover:text-white text-slate-300 hover:bg-slate-900 transition-colors group"
                >
                    <div
                        class="flex items-center justify-center w-6 h-6 bg-slate-800 text-slate-400 group-hover:text-white rounded-sm transition-colors"
                    >
                        <ListMusic class="w-4 h-4" />
                    </div>
                    <span class="truncate">{playlist.name}</span>
                </a>
            {/each}
        </div>
    </nav>
</aside>
