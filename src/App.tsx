import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import { PlaybackDock } from "./components/PlaybackDock";
import { SettingsPanel } from "./components/SettingsPanel";
import { defaultFontPreset, fontPresets } from "./config/fonts";
import { SetupPage } from "./components/SetupPage";
import { songConfig, type SongConfig } from "./config/song";
import { useLyricVideoPlayer } from "./hooks/useLyricVideoPlayer";

function cleanupObjectUrls(urls: string[]) {
  urls.forEach((url) => URL.revokeObjectURL(url));
}

function PlayerScreen(props: {
  config: SongConfig;
  onBackToSetup: () => void;
}) {
  const { config, onBackToSetup } = props;
  const [titleFontPresetId, setTitleFontPresetId] = useState(defaultFontPreset.id);
  const [lyricFontPresetId, setLyricFontPresetId] = useState(defaultFontPreset.id);
  const [customTitleFontFamily, setCustomTitleFontFamily] = useState<string | null>(null);
  const [customLyricFontFamily, setCustomLyricFontFamily] = useState<string | null>(null);
  const [customTitleFontLabel, setCustomTitleFontLabel] = useState<string | null>(null);
  const [customLyricFontLabel, setCustomLyricFontLabel] = useState<string | null>(null);
  const [customTitleFontUrl, setCustomTitleFontUrl] = useState<string | null>(null);
  const [customLyricFontUrl, setCustomLyricFontUrl] = useState<string | null>(null);
  const [lyricOffsetMs, setLyricOffsetMs] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    audioRef,
    currentTimeMs,
    duration,
    isPlaying,
    lyrics,
    progress,
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

  return (
      <main
        className="app-shell"
        style={
          {
            fontFamily: resolvedLyricFontFamily,
            ["--title-font-family" as "--title-font-family"]: resolvedTitleFontFamily,
            ["--lyric-font-family" as "--lyric-font-family"]: resolvedLyricFontFamily,
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

      <section className="content-shell">
        <SettingsPanel
          customLyricFontLabel={customLyricFontLabel}
          customTitleFontLabel={customTitleFontLabel}
          lyricFontPresetId={lyricFontPresetId}
          lyricOffsetMs={lyricOffsetMs}
          onBackToSetup={onBackToSetup}
          onChangeLyricFontPreset={setLyricFontPresetId}
          onChangeTitleFontPreset={setTitleFontPresetId}
          onCustomLyricFontFileChange={(file) => {
            void handleCustomFontFileChange(file, "lyric");
          }}
          onCustomTitleFontFileChange={(file) => {
            void handleCustomFontFileChange(file, "title");
          }}
          onChangeLyricOffset={setLyricOffsetMs}
          onClose={() => {
            setIsSettingsOpen(false);
          }}
          onToggleFullscreen={() => {
            void handleToggleFullscreen();
          }}
          open={isSettingsOpen}
          titleFontPresetId={titleFontPresetId}
        />

        <div className="lyrics-panel">
          <div className="stage-grid">
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
          </div>
        </div>

        <PlaybackDock
          artist={config.artist}
          currentTimeMs={currentTimeMs}
          duration={duration}
          isPlaying={isPlaying}
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

  if (!activeConfig) {
    return (
      <main className="app-shell app-shell-setup">
        <div className="background-stack" aria-hidden="true">
          <img alt="" className="background-cover" src={songConfig.coverPath} />
          <div className="background-vignette" />
          <div className="background-overlay" />
        </div>
        <SetupPage
          onStartDemo={handleStartDemo}
          onStartWithConfig={handleStartWithConfig}
        />
      </main>
    );
  }

  return <PlayerScreen config={activeConfig} onBackToSetup={handleBackToSetup} />;
}
