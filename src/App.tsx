import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import { PlaybackDock } from "./components/PlaybackDock";
import { SettingsPanel } from "./components/SettingsPanel";
import { defaultFontPreset, fontPresets } from "./config/fonts";
import { type LayoutMode, type LyricDensity, type PortraitPlatform } from "./config/layout";
import { SetupPage } from "./components/SetupPage";
import { songConfig, type SongConfig } from "./config/song";
import { useLyricVideoPlayer } from "./hooks/useLyricVideoPlayer";
import { renderSquareCoverArtwork } from "./lib/coverArtwork";

function cleanupObjectUrls(urls: string[]) {
  urls.forEach((url) => URL.revokeObjectURL(url));
}

function replaceManagedUrl(
  managedUrls: string[],
  previousUrl: string | undefined,
  nextUrl: string,
) {
  return [...managedUrls.filter((url) => url !== previousUrl), nextUrl];
}

function sanitizeFileNamePart(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
}

function PlayerScreen(props: {
  config: SongConfig;
  layoutMode: LayoutMode;
  portraitPlatform: PortraitPlatform;
  onBackToSetup: () => void;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  onChangePortraitPlatform: (platform: PortraitPlatform) => void;
  onReplaceAudioFile: (file: File) => void;
  onReplaceCoverFile: (file: File) => void;
  onReplaceLyricFile: (file: File) => Promise<void>;
  onUpdateSongMeta: (patch: Pick<SongConfig, "title" | "artist">) => void;
}) {
  const {
    config,
    layoutMode,
    onBackToSetup,
    onChangeLayoutMode,
    onChangePortraitPlatform,
    onReplaceAudioFile,
    onReplaceCoverFile,
    onReplaceLyricFile,
    onUpdateSongMeta,
    portraitPlatform,
  } = props;
  const [titleFontPresetId, setTitleFontPresetId] = useState(defaultFontPreset.id);
  const [lyricFontPresetId, setLyricFontPresetId] = useState(defaultFontPreset.id);
  const [customTitleFontFamily, setCustomTitleFontFamily] = useState<string | null>(null);
  const [customLyricFontFamily, setCustomLyricFontFamily] = useState<string | null>(null);
  const [customTitleFontLabel, setCustomTitleFontLabel] = useState<string | null>(null);
  const [customLyricFontLabel, setCustomLyricFontLabel] = useState<string | null>(null);
  const [customTitleFontUrl, setCustomTitleFontUrl] = useState<string | null>(null);
  const [customLyricFontUrl, setCustomLyricFontUrl] = useState<string | null>(null);
  const [lyricDensity, setLyricDensity] = useState<LyricDensity>("medium");
  const [lyricFontScale, setLyricFontScale] = useState(1);
  const [lyricOffsetMs, setLyricOffsetMs] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coverArtworkPreviewUrl, setCoverArtworkPreviewUrl] = useState<string | null>(null);
  const [coverArtworkError, setCoverArtworkError] = useState<string | null>(null);
  const [isGeneratingCoverArtwork, setIsGeneratingCoverArtwork] = useState(false);
  const {
    audioRef,
    currentTimeMs,
    duration,
    isPlaying,
    lyrics,
    progress,
    resetToStart,
    seekToProgress,
    togglePlayback,
  } = useLyricVideoPlayer(config);

  const adjustedCurrentTimeMs = Math.max(0, currentTimeMs + lyricOffsetMs);
  const activeTitleFontPreset =
    fontPresets.find((preset) => preset.id === titleFontPresetId) ?? defaultFontPreset;
  const activeLyricFontPreset =
    fontPresets.find((preset) => preset.id === lyricFontPresetId) ?? defaultFontPreset;
  const resolvedTitleFontFamily =
    customTitleFontFamily ?? activeTitleFontPreset.fontFamily;
  const resolvedLyricFontFamily =
    customLyricFontFamily ?? activeLyricFontPreset.fontFamily;
  const lyricDensityVars: Record<LyricDensity, { fontSize: string; linePadding: string }> = {
    few: {
      fontSize: "clamp(20px, 3.9vw, 30px)",
      linePadding: "0.9vh",
    },
    medium: {
      fontSize: "clamp(17px, 3.3vw, 26px)",
      linePadding: "0.55vh",
    },
    many: {
      fontSize: "clamp(14px, 2.7vw, 22px)",
      linePadding: "0.28vh",
    },
  };
  const activeLyricDensity = lyricDensityVars[lyricDensity];
  const isPortrait = layoutMode === "portrait";
  const isCompactPortrait = isPortrait && portraitPlatform !== "default";

  const handleCustomFontFileChange = useCallback(async (
    file: File | null,
    target: "title" | "lyric",
  ) => {
    const currentUrl = target === "title" ? customTitleFontUrl : customLyricFontUrl;
    const fallbackStack =
      target === "title" ? activeTitleFontPreset.fontFamily : activeLyricFontPreset.fontFamily;

    if (!file) {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      if (target === "title") {
        setCustomTitleFontFamily(null);
        setCustomTitleFontLabel(null);
        setCustomTitleFontUrl(null);
      } else {
        setCustomLyricFontFamily(null);
        setCustomLyricFontLabel(null);
        setCustomLyricFontUrl(null);
      }
      return;
    }

    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }

    const familyName = `UploadedFont-${target}-${Date.now()}`;
    const nextFontUrl = URL.createObjectURL(file);
    const font = new FontFace(familyName, `url(${nextFontUrl})`);
    await font.load();
    document.fonts.add(font);
    const resolvedFamily = `"${familyName}", ${fallbackStack}`;

    if (target === "title") {
      setCustomTitleFontFamily(resolvedFamily);
      setCustomTitleFontLabel(file.name);
      setCustomTitleFontUrl(nextFontUrl);
    } else {
      setCustomLyricFontFamily(resolvedFamily);
      setCustomLyricFontLabel(file.name);
      setCustomLyricFontUrl(nextFontUrl);
    }
  }, [
    activeLyricFontPreset.fontFamily,
    activeTitleFontPreset.fontFamily,
    customLyricFontUrl,
    customTitleFontUrl,
  ]);

  useEffect(() => {
    return () => {
      if (customTitleFontUrl) {
        URL.revokeObjectURL(customTitleFontUrl);
      }

      if (customLyricFontUrl) {
        URL.revokeObjectURL(customLyricFontUrl);
      }
    };
  }, [customLyricFontUrl, customTitleFontUrl]);

  useEffect(() => {
    setLyricOffsetMs(0);
  }, [config.audioPath, config.lyricFileName, config.lyricPath, config.lyricText]);

  useEffect(() => {
    setCoverArtworkPreviewUrl(null);
    setCoverArtworkError(null);
  }, [config.artist, config.coverPath, config.title, resolvedTitleFontFamily]);

  const handleToggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget =
        tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        void togglePlayback();
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void handleToggleFullscreen();
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        setIsSettingsOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleToggleFullscreen, togglePlayback]);

  const handleGenerateCoverArtwork = useCallback(async () => {
    setIsGeneratingCoverArtwork(true);
    setCoverArtworkError(null);

    try {
      const previewUrl = await renderSquareCoverArtwork({
        artist: config.artist,
        coverSrc: config.coverPath,
        title: config.title,
        titleFontFamily: resolvedTitleFontFamily,
      });

      setCoverArtworkPreviewUrl(previewUrl);
    } catch (error) {
      setCoverArtworkError(error instanceof Error ? error.message : "生成封面失败，请稍后再试。");
    } finally {
      setIsGeneratingCoverArtwork(false);
    }
  }, [config.artist, config.coverPath, config.title, resolvedTitleFontFamily]);

  const handleDownloadCoverArtwork = useCallback(() => {
    if (!coverArtworkPreviewUrl) {
      return;
    }

    const link = document.createElement("a");
    const title = sanitizeFileNamePart(config.title) || "cover";
    const artist = sanitizeFileNamePart(config.artist) || "artist";
    link.href = coverArtworkPreviewUrl;
    link.download = `${title} - ${artist}.png`;
    link.click();
  }, [config.artist, config.title, coverArtworkPreviewUrl]);

  return (
    <main
      className={`app-shell ${isPortrait ? "app-shell-portrait app-shell-portrait-platform-" + portraitPlatform : ""} ${isCompactPortrait ? "app-shell-portrait-compact" : ""}`}
      style={
        {
          fontFamily: resolvedLyricFontFamily,
          ["--title-font-family" as "--title-font-family"]: resolvedTitleFontFamily,
          ["--lyric-font-family" as "--lyric-font-family"]: resolvedLyricFontFamily,
          ["--portrait-lyric-font-size" as "--portrait-lyric-font-size"]: activeLyricDensity.fontSize,
          ["--portrait-lyric-line-padding" as "--portrait-lyric-line-padding"]: activeLyricDensity.linePadding,
          ["--portrait-lyric-font-scale" as "--portrait-lyric-font-scale"]: lyricFontScale.toString(),
        } as CSSProperties
      }
    >
      <audio preload="auto" ref={audioRef} src={config.audioPath} />

      <div className="background-stack" aria-hidden="true">
        <img alt="" className="background-cover" src={config.coverPath} />
        <BackgroundRender
          album={config.coverPath}
          className="fluid-background"
          fps={60}
          flowSpeed={1.8}
          hasLyric={lyrics.length > 0}
          playing={isPlaying}
          renderScale={1}
        />
        <div className="background-vignette" />
        <div className="background-overlay" />
      </div>

      <section className={`content-shell ${isPortrait ? "content-shell-portrait" : ""} ${isCompactPortrait ? "content-shell-portrait-square" : ""}`}>
        <SettingsPanel
          artist={config.artist}
          coverArtworkError={coverArtworkError}
          coverArtworkPreviewUrl={coverArtworkPreviewUrl}
          customLyricFontLabel={customLyricFontLabel}
          customTitleFontLabel={customTitleFontLabel}
          isGeneratingCoverArtwork={isGeneratingCoverArtwork}
          layoutMode={layoutMode}
          lyricDensity={lyricDensity}
          lyricFontPresetId={lyricFontPresetId}
          lyricFontScale={lyricFontScale}
          lyricOffsetMs={lyricOffsetMs}
          onBackToSetup={onBackToSetup}
          onChangeLayoutMode={onChangeLayoutMode}
          onChangePortraitPlatform={onChangePortraitPlatform}
          onChangeLyricDensity={setLyricDensity}
          onChangeLyricFontPreset={setLyricFontPresetId}
          onChangeLyricFontScale={setLyricFontScale}
          onChangeTitleFontPreset={setTitleFontPresetId}
          onDownloadCoverArtwork={handleDownloadCoverArtwork}
          onCustomLyricFontFileChange={(file) => {
            void handleCustomFontFileChange(file, "lyric");
          }}
          onCustomTitleFontFileChange={(file) => {
            void handleCustomFontFileChange(file, "title");
          }}
          onGenerateCoverArtwork={() => {
            void handleGenerateCoverArtwork();
          }}
          onChangeLyricOffset={setLyricOffsetMs}
          onClose={() => {
            setIsSettingsOpen(false);
          }}
          onReplaceAudioFile={onReplaceAudioFile}
          onReplaceCoverFile={onReplaceCoverFile}
          onReplaceLyricFile={onReplaceLyricFile}
          onResetToStart={resetToStart}
          onToggleFullscreen={() => {
            void handleToggleFullscreen();
          }}
          onUpdateSongMeta={onUpdateSongMeta}
          open={isSettingsOpen}
          portraitPlatform={portraitPlatform}
          title={config.title}
          titleFontPresetId={titleFontPresetId}
        />

        <div className="lyrics-panel">
          <div className="stage-grid">
            {isPortrait ? (
              <>
                <div className="stage-top">
                  <aside className="cover-panel">
                    <div className="cover-card">
                      <img alt={`${config.title} cover`} className="cover-art" src={config.coverPath} />
                    </div>
                  </aside>

                  <div className="playback-copy stage-copy">
                    <p className="eyebrow">Now Playing</p>
                    <h1>{config.title}</h1>
                    <p className="artist">{config.artist}</p>
                  </div>
                </div>

                <div className="stage-lyrics">
                  <div className="lyrics-frame">
                    {/* AMLL 的歌词播放器在这里接入。
                        当前会把音频时间持续转换成毫秒传给 currentTime。
                        如果以后换成逐词歌词，只要歌词文件本身有更细粒度时间信息，这里基本不用重写。 */}
                    <LyricPlayer
                      alignAnchor="center"
                      alignPosition={0.5}
                      currentTime={adjustedCurrentTimeMs}
                      enableBlur
                      enableScale
                      enableSpring
                      lyricLines={lyrics}
                      playing={isPlaying}
                      style={{
                        fontFamily: resolvedLyricFontFamily,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <aside className="cover-panel">
                  <div className="cover-card">
                    <img alt={`${config.title} cover`} className="cover-art" src={config.coverPath} />
                  </div>
                </aside>

                <div className="lyrics-frame">
                  {/* AMLL 的歌词播放器在这里接入。
                      当前会把音频时间持续转换成毫秒传给 currentTime。
                      如果以后换成逐词歌词，只要歌词文件本身有更细粒度时间信息，这里基本不用重写。 */}
                  <LyricPlayer
                    alignAnchor="center"
                    alignPosition={0.5}
                    currentTime={adjustedCurrentTimeMs}
                    enableBlur
                    enableScale
                    enableSpring
                    lyricLines={lyrics}
                    playing={isPlaying}
                    style={{
                      fontFamily: resolvedLyricFontFamily,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <PlaybackDock
          artist={config.artist}
          currentTimeMs={currentTimeMs}
          duration={duration}
          hideMeta={isPortrait}
          isPlaying={isPlaying}
          onSeek={seekToProgress}
          progress={progress}
          title={config.title}
        />
      </section>
    </main>
  );
}

export default function App() {
  const [activeConfig, setActiveConfig] = useState<SongConfig | null>(null);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("landscape");
  const [portraitPlatform, setPortraitPlatform] = useState<PortraitPlatform>("default");

  useEffect(() => {
    document.body.classList.toggle("setup-mode", !activeConfig);

    return () => {
      document.body.classList.remove("setup-mode");
    };
  }, [activeConfig]);

  useEffect(() => {
    return () => {
      cleanupObjectUrls(generatedUrls);
    };
  }, [generatedUrls]);

  const handleStartDemo = () => {
    cleanupObjectUrls(generatedUrls);
    setGeneratedUrls([]);
    setActiveConfig(songConfig);
  };

  const handleStartWithConfig = (config: SongConfig, objectUrls: string[]) => {
    cleanupObjectUrls(generatedUrls);
    setGeneratedUrls(objectUrls);
    setActiveConfig(config);
  };

  const handleBackToSetup = () => {
    setActiveConfig(null);
  };

  const handleUpdateSongMeta = (patch: Pick<SongConfig, "title" | "artist">) => {
    setActiveConfig((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ...patch,
      };
    });
  };

  const handleReplaceAudioFile = (file: File) => {
    if (!activeConfig) {
      return;
    }

    const previousAudioPath = activeConfig.audioPath;
    const nextAudioPath = URL.createObjectURL(file);

    setGeneratedUrls((current) => {
      if (current.includes(previousAudioPath)) {
        URL.revokeObjectURL(previousAudioPath);
      }

      return replaceManagedUrl(current, previousAudioPath, nextAudioPath);
    });

    setActiveConfig((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        audioPath: nextAudioPath,
      };
    });

  };

  const handleReplaceCoverFile = (file: File) => {
    if (!activeConfig) {
      return;
    }

    const previousCoverPath = activeConfig.coverPath;
    const nextCoverPath = URL.createObjectURL(file);

    setGeneratedUrls((current) => {
      if (current.includes(previousCoverPath)) {
        URL.revokeObjectURL(previousCoverPath);
      }

      return replaceManagedUrl(current, previousCoverPath, nextCoverPath);
    });

    setActiveConfig((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        coverPath: nextCoverPath,
      };
    });
  };

  const handleReplaceLyricFile = async (file: File) => {
    const lyricText = await file.text();

    setActiveConfig((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        lyricFileName: file.name,
        lyricPath: undefined,
        lyricText,
      };
    });
  };

  if (!activeConfig) {
    return (
      <main className="app-shell app-shell-setup">
        <div className="background-stack" aria-hidden="true">
          <img alt="" className="background-cover" src={songConfig.coverPath} />
          <div className="background-vignette" />
          <div className="background-overlay" />
        </div>
        <SetupPage
          layoutMode={layoutMode}
          onChangeLayoutMode={setLayoutMode}
          onStartDemo={handleStartDemo}
          onStartWithConfig={handleStartWithConfig}
        />
      </main>
    );
  }

  return (
    <PlayerScreen
      config={activeConfig}
      layoutMode={layoutMode}
      onBackToSetup={handleBackToSetup}
      onChangeLayoutMode={setLayoutMode}
      onChangePortraitPlatform={setPortraitPlatform}
      onReplaceAudioFile={handleReplaceAudioFile}
      onReplaceCoverFile={handleReplaceCoverFile}
      onReplaceLyricFile={handleReplaceLyricFile}
      onUpdateSongMeta={handleUpdateSongMeta}
      portraitPlatform={portraitPlatform}
    />
  );
}
