<script lang="ts">
    import {
        Play,
        Pause,
        SkipBack,
        SkipForward,
        Repeat,
        Shuffle,
        Volume2,
        VolumeX,
        ListMusic,
        ChevronUp,
    } from "lucide-svelte";
    import * as Slider from "$lib/components/ui/slider";
    import { playerStore } from "$lib/stores/player";
    import { losslessAPI } from "$lib/api";
    import { formatArtists } from "$lib/utils";
    import type { Track, AudioQuality } from "$lib/types";
    import { isSonglinkTrack } from "$lib/types";

    let audioElement = $state<HTMLAudioElement | null>(null);
    let currentLoadedTrackId: number | null = null;
    let isMuted = $state(false);
    let previousVolume = 0.8;
    let showQualityMenu = $state(false);
    let selectedQuality = $state<AudioQuality>("LOSSLESS");
    let currentPlaybackQuality = $state<string | null>(null);

    const qualities: { value: AudioQuality; label: string; desc: string }[] = [
        { value: "LOW", label: "Normal", desc: "96 kbps AAC" },
        { value: "HIGH", label: "High", desc: "320 kbps AAC" },
        { value: "LOSSLESS", label: "Lossless", desc: "1411 kbps FLAC" },
        { value: "HI_RES_LOSSLESS", label: "Hi-Res", desc: "Up to 9216 kbps" },
    ];

    // Reactive derivations from store
    const progressPercent = $derived(
        $playerStore.duration > 0
            ? ($playerStore.currentTime / $playerStore.duration) * 100
            : 0,
    );

    function formatTime(seconds: number): string {
        if (!seconds || !isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    /**
     * Proxy all audio stream URLs through our SvelteKit server
     * to bypass Tauri's WebKit cross-origin restrictions.
     */
    function proxyUrl(url: string): string {
        return `/api/proxy?url=${encodeURIComponent(url)}`;
    }

    // Watch for track changes and load new tracks
    $effect(() => {
        const current = $playerStore.currentTrack;
        if (!current || isSonglinkTrack(current)) return;

        const track = current as Track;
        if (track.id === currentLoadedTrackId) return;

        currentLoadedTrackId = track.id;
        loadTrack(track);
    });

    // Sync volume to audio element
    $effect(() => {
        if (audioElement) {
            audioElement.volume = $playerStore.volume;
        }
    });

    // Sync play/pause from store to audio element
    $effect(() => {
        if (!audioElement || !audioElement.src) return;
        if ($playerStore.isPlaying && audioElement.paused) {
            audioElement.play().catch(console.error);
        } else if (!$playerStore.isPlaying && !audioElement.paused) {
            audioElement.pause();
        }
    });

    async function loadTrack(track: Track) {
        if (!audioElement) {
            console.error("[Player] Audio element not ready");
            return;
        }

        try {
            playerStore.setLoading(true);

            // Don't use HI_RES_LOSSLESS directly — it uses DASH manifests
            // which need Shaka Player. Downgrade to LOSSLESS for standard playback.
            let quality = selectedQuality;
            if (quality === "HI_RES_LOSSLESS") {
                quality = "LOSSLESS";
            }

            console.log(
                `[Player] Loading track: "${track.title}" (id: ${track.id}, quality: ${quality})`,
            );

            const data = await losslessAPI.getStreamData(track.id, quality);
            console.log(
                `[Player] Got stream URL: ${data.url.substring(0, 100)}...`,
            );

            // Proxy the URL through our SvelteKit server to bypass Tauri CORS
            const proxied = proxyUrl(data.url);
            console.log(`[Player] Proxied URL: ${proxied}`);

            if (data.replayGain !== null)
                playerStore.setReplayGain(data.replayGain);
            if (data.sampleRate !== null)
                playerStore.setSampleRate(data.sampleRate);
            if (data.bitDepth !== null) playerStore.setBitDepth(data.bitDepth);

            // Stop current playback, set new source, and load
            audioElement.pause();
            audioElement.crossOrigin = "anonymous";
            audioElement.src = proxied;
            audioElement.load();
            currentPlaybackQuality = quality;

            // The play/pause $effect will automatically call play()
            // once the store's isPlaying is set to true
            playerStore.play();
        } catch (error) {
            console.error("[Player] Failed to get stream data:", error);
            playerStore.setLoading(false);
        }
    }

    function handleCanPlayThrough() {
        console.log("[Player] canplaythrough fired — audio is ready");
        playerStore.setLoading(false);
    }

    function handleTimeUpdate() {
        if (audioElement) {
            playerStore.setCurrentTime(audioElement.currentTime);
        }
    }

    function handleDurationChange() {
        if (audioElement && isFinite(audioElement.duration)) {
            playerStore.setDuration(audioElement.duration);
        }
    }

    function handleEnded() {
        playerStore.next();
        currentLoadedTrackId = null; // Force reload for next track
    }

    function handleAudioError() {
        const error = audioElement?.error;
        console.error("[Player] Audio error:", error?.code, error?.message);
        playerStore.setLoading(false);
    }

    function handleSeek(value: number) {
        if (audioElement && $playerStore.duration > 0) {
            const seekTime = (value / 100) * $playerStore.duration;
            audioElement.currentTime = seekTime;
            playerStore.setCurrentTime(seekTime);
        }
    }

    function handleVolumeChange(value: number) {
        const vol = value / 100;
        playerStore.setVolume(vol);
        if (vol > 0) {
            isMuted = false;
            previousVolume = vol;
        }
    }

    function toggleMute() {
        if (isMuted) {
            playerStore.setVolume(previousVolume);
            isMuted = false;
        } else {
            previousVolume = $playerStore.volume;
            playerStore.setVolume(0);
            isMuted = true;
        }
    }

    function togglePlay() {
        if ($playerStore.isPlaying) {
            audioElement?.pause();
            playerStore.pause();
        } else {
            audioElement?.play().catch(console.error);
            playerStore.play();
        }
    }

    function selectQuality(quality: AudioQuality) {
        selectedQuality = quality;
        showQualityMenu = false;

        // If a track is playing, reload it with the new quality
        const current = $playerStore.currentTrack;
        if (current && !isSonglinkTrack(current)) {
            currentLoadedTrackId = null; // Force reload
            loadTrack(current as Track);
        }
    }

    function getQualityLabel(quality: AudioQuality): string {
        switch (quality) {
            case "HI_RES_LOSSLESS":
                return "Hi-Res";
            case "LOSSLESS":
                return "CD";
            case "HIGH":
                return "HIGH";
            case "LOW":
                return "LOW";
            default:
                return quality;
        }
    }

    function getCurrentTrackAsTrack(): Track | null {
        const current = $playerStore.currentTrack;
        if (!current || isSonglinkTrack(current)) return null;
        return current as Track;
    }
</script>

<!-- Hidden audio element — src set imperatively in loadTrack -->
<audio
    bind:this={audioElement}
    crossorigin="anonymous"
    oncanplaythrough={handleCanPlayThrough}
    ontimeupdate={handleTimeUpdate}
    ondurationchange={handleDurationChange}
    onended={handleEnded}
    onerror={handleAudioError}
    preload="auto"
></audio>

<footer
    class="h-20 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between px-4 w-full relative"
>
    <!-- Currently Playing Info -->
    <div class="flex items-center gap-4 w-[30%] min-w-[180px]">
        {#if getCurrentTrackAsTrack()}
            {@const track = getCurrentTrackAsTrack()!}
            <div
                class="w-14 h-14 bg-slate-800 rounded flex-shrink-0 overflow-hidden shadow-lg"
            >
                {#if track.album?.cover}
                    <img
                        src={losslessAPI.getCoverUrl(track.album.cover, "160")}
                        alt="Album art"
                        class="w-full h-full object-cover"
                    />
                {:else}
                    <div class="w-full h-full flex items-center justify-center">
                        <ListMusic class="w-6 h-6 text-slate-700" />
                    </div>
                {/if}
            </div>
            <div class="flex flex-col justify-center max-w-[calc(100%-80px)]">
                <span class="text-sm text-white font-medium truncate"
                    >{track.title}</span
                >
                <span class="text-xs text-slate-400 truncate"
                    >{formatArtists(track.artists)}</span
                >
            </div>
        {:else}
            <div
                class="w-14 h-14 bg-slate-900 border border-slate-800 rounded flex-shrink-0 flex items-center justify-center"
            >
                <ListMusic class="w-6 h-6 text-slate-700" />
            </div>
            <div class="flex flex-col justify-center max-w-[calc(100%-80px)]">
                <span class="text-sm text-slate-500 font-medium truncate"
                    >No track playing</span
                >
            </div>
        {/if}
    </div>

    <!-- Player Controls -->
    <div
        class="flex flex-col items-center justify-center max-w-[40%] w-full gap-2"
    >
        <div class="flex items-center gap-6">
            <button
                class="text-slate-400 hover:text-white transition-colors"
                onclick={() => playerStore.shuffleQueue()}
            >
                <Shuffle class="w-4 h-4" />
            </button>
            <button
                class="text-slate-400 hover:text-white transition-colors"
                onclick={() => {
                    playerStore.previous();
                    currentLoadedTrackId = null;
                }}
            >
                <SkipBack class="w-5 h-5 fill-current" />
            </button>

            <button
                class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                onclick={togglePlay}
            >
                {#if $playerStore.isLoading}
                    <div
                        class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"
                    ></div>
                {:else if $playerStore.isPlaying}
                    <Pause class="w-4 h-4 fill-current" />
                {:else}
                    <Play class="w-4 h-4 fill-current ml-0.5" />
                {/if}
            </button>

            <button
                class="text-slate-400 hover:text-white transition-colors"
                onclick={() => {
                    playerStore.next();
                    currentLoadedTrackId = null;
                }}
            >
                <SkipForward class="w-5 h-5 fill-current" />
            </button>
            <button class="text-slate-400 hover:text-white transition-colors">
                <Repeat class="w-4 h-4" />
            </button>
        </div>

        <!-- Progress Bar -->
        <div class="flex items-center gap-2 w-full max-w-md">
            <span class="text-xs text-slate-400 w-10 text-right font-mono">
                {formatTime($playerStore.currentTime)}
            </span>
            <Slider.Root
                type="single"
                value={progressPercent}
                onValueChange={(v) => handleSeek(v)}
                max={100}
                step={0.1}
                class="w-full cursor-pointer hover:[&_[role=slider]]:opacity-100"
            />
            <span class="text-xs text-slate-400 w-10 font-mono">
                {formatTime($playerStore.duration)}
            </span>
        </div>
    </div>

    <!-- Extra Controls -->
    <div class="flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
        <!-- Quality Switcher -->
        <div class="relative">
            <button
                class="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors
                    {selectedQuality === 'HI_RES_LOSSLESS' ||
                selectedQuality === 'LOSSLESS'
                    ? 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20'
                    : 'text-slate-400 bg-slate-800 hover:bg-slate-700'}"
                onclick={() => (showQualityMenu = !showQualityMenu)}
            >
                {getQualityLabel(selectedQuality)}
                <ChevronUp
                    class="w-3 h-3 {showQualityMenu
                        ? ''
                        : 'rotate-180'} transition-transform"
                />
            </button>

            {#if showQualityMenu}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="fixed inset-0 z-40"
                    onclick={() => (showQualityMenu = false)}
                ></div>
                <div
                    class="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50"
                >
                    {#each qualities as q}
                        <button
                            class="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors flex justify-between items-center
                                {selectedQuality === q.value
                                ? 'bg-slate-700/30'
                                : ''}"
                            onclick={() => selectQuality(q.value)}
                        >
                            <div>
                                <span
                                    class="text-sm font-medium text-white block"
                                    >{q.label}</span
                                >
                                <span class="text-xs text-slate-400"
                                    >{q.desc}</span
                                >
                            </div>
                            {#if selectedQuality === q.value}
                                <div
                                    class="w-2 h-2 rounded-full bg-emerald-400"
                                ></div>
                            {/if}
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Volume -->
        <div class="flex items-center gap-2 w-24 group">
            <button
                class="text-slate-400 hover:text-white transition-colors"
                onclick={toggleMute}
            >
                {#if isMuted || $playerStore.volume === 0}
                    <VolumeX class="w-4 h-4" />
                {:else}
                    <Volume2 class="w-4 h-4" />
                {/if}
            </button>
            <Slider.Root
                type="single"
                value={$playerStore.volume * 100}
                onValueChange={(v) => handleVolumeChange(v)}
                max={100}
                step={1}
                class="w-full cursor-pointer hover:[&_[role=slider]]:opacity-100"
            />
        </div>
    </div>
</footer>
