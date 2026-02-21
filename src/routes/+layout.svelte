<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import AudioPlayer from "$lib/components/AudioPlayer.svelte";
  import GlobalSearch from "$lib/components/GlobalSearch.svelte";
  import { page } from "$app/stores";
  import { playerStore } from "$lib/stores/player";
  import { ArrowLeft, ArrowRight } from "lucide-svelte";

  let { children } = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.code !== "Space") return;
    const target = event.target as HTMLElement;
    const tag = target?.tagName?.toLowerCase();
    if (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "button" ||
      target?.isContentEditable
    )
      return;
    event.preventDefault();
    playerStore.togglePlay();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div
  class="h-screen w-full flex flex-col bg-slate-950 text-slate-50 overflow-hidden font-sans"
>
  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div
      class="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-900 to-slate-950"
    >
      <!-- Top Navigation Bar -->
      <div
        class="flex items-center gap-6 px-6 py-3 flex-shrink-0"
        data-tauri-drag-region
      >
        <div class="flex items-center gap-1">
          <button
            onclick={() => history.back()}
            class="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft class="w-4 h-4 text-white pointer-events-none" />
          </button>
          <button
            onclick={() => history.forward()}
            class="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
            aria-label="Go forward"
          >
            <ArrowRight class="w-4 h-4 text-white pointer-events-none" />
          </button>
        </div>

        <!-- Global Search Bar Placeholder -->
        <div class="flex-1 max-w-sm">
          <GlobalSearch />
        </div>
      </div>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto px-8 pb-32">
        {@render children()}
      </main>
    </div>
  </div>

  <!-- Global Player Bar Docked to Bottom -->
  <div class="fixed bottom-0 left-0 right-0 z-50">
    <AudioPlayer headless={false} />
  </div>
</div>
