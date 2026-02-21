<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { Search as SearchIcon, X, Clock } from "lucide-svelte";

    const RECENT_SEARCHES_KEY = "narsil-recent-searches";
    const MAX_RECENT = 10;

    let query = $state("");
    let recentSearches = $state<string[]>([]);
    let inputElement = $state<HTMLInputElement | null>(null);
    let showRecent = $state(false);

    if (browser) {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) recentSearches = JSON.parse(stored);
        } catch {}

        // Restore query from session cache if available
        try {
            const cached = sessionStorage.getItem("narsil-search-cache");
            if (cached) {
                const data = JSON.parse(cached);
                query = data.query ?? "";
            }
        } catch {}
    }

    $effect(() => {
        // Expose query globally to keep in sync with search page
        if (browser) {
            window.dispatchEvent(
                new CustomEvent("narsil-search-query", { detail: query }),
            );
        }
    });

    function addRecentSearch(term: string) {
        const trimmed = term.trim();
        if (!trimmed || !browser) return;
        recentSearches = [
            trimmed,
            ...recentSearches.filter(
                (s) => s.toLowerCase() !== trimmed.toLowerCase(),
            ),
        ].slice(0, MAX_RECENT);
        try {
            localStorage.setItem(
                RECENT_SEARCHES_KEY,
                JSON.stringify(recentSearches),
            );
        } catch {}
    }

    function removeRecentSearch(term: string) {
        recentSearches = recentSearches.filter((s) => s !== term);
        if (browser) {
            try {
                localStorage.setItem(
                    RECENT_SEARCHES_KEY,
                    JSON.stringify(recentSearches),
                );
            } catch {}
        }
    }

    function clearRecentSearches() {
        recentSearches = [];
        if (browser) {
            try {
                localStorage.removeItem(RECENT_SEARCHES_KEY);
            } catch {}
        }
    }

    function executeSearch(q: string) {
        if (q.trim().length <= 2) return;
        query = q;
        showRecent = false;
        addRecentSearch(q);
        inputElement?.blur();

        // Save to cache before navigating
        if (browser) {
            try {
                sessionStorage.setItem(
                    "narsil-search-cache",
                    JSON.stringify({ query: q, results: null }),
                );
            } catch {}

            // Force search execution payload
            window.dispatchEvent(
                new CustomEvent("narsil-search-execute", { detail: query }),
            );
        }

        goto("/search");
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            executeSearch(query);
        }
        if (e.key === "Escape") {
            showRecent = false;
            inputElement?.blur();
        }
    }

    function clearSearch() {
        query = "";
        showRecent = false;
        if (browser) {
            try {
                sessionStorage.removeItem("narsil-search-cache");
            } catch {}
        }
        inputElement?.focus();
    }
</script>

<div class="relative w-full">
    <SearchIcon
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
    />
    <input
        bind:this={inputElement}
        type="text"
        placeholder="What do you want to listen to?"
        class="w-full pl-10 pr-9 h-10 bg-black/40 hover:bg-black/50 border border-transparent hover:border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-slate-800 rounded-full text-sm transition-all"
        bind:value={query}
        onkeydown={handleKeydown}
        onfocus={() => (showRecent = true)}
        onblur={() => setTimeout(() => (showRecent = false), 250)}
    />
    {#if query.length > 0}
        <button
            onclick={clearSearch}
            class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
            <X class="w-3 h-3 text-slate-400" />
        </button>
    {/if}

    <!-- Recent Searches Dropdown -->
    {#if showRecent && recentSearches.length > 0}
        <div
            class="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 pointer-events-auto"
        >
            <div
                class="flex items-center justify-between px-4 py-2 border-b border-slate-700"
            >
                <span
                    class="text-xs font-semibold text-white uppercase tracking-wider"
                    >Recent searches</span
                >
                <button
                    onmousedown={(e) => {
                        e.preventDefault();
                        clearRecentSearches();
                    }}
                    class="text-xs text-slate-400 hover:text-white transition-colors"
                    >Clear all</button
                >
            </div>
            <div class="max-h-[60vh] overflow-y-auto">
                {#each recentSearches as term}
                    <div
                        onmousedown={(e) => {
                            e.preventDefault();
                            executeSearch(term);
                        }}
                        role="button"
                        tabindex="0"
                        class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors text-left group cursor-pointer"
                    >
                        <Clock class="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span class="text-sm text-slate-300 flex-1 truncate"
                            >{term}</span
                        >
                        <button
                            onmousedown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeRecentSearch(term);
                            }}
                            class="w-6 h-6 rounded-full hover:bg-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X class="w-3 h-3 text-slate-400" />
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
