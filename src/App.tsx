import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import { PlaybackDock } from "./components/PlaybackDock";
import { SettingsPanel } from "./components/SettingsPanel";
import { defaultFontPreset, fontPresets } from "./config/fonts";
import { type LayoutMode, type LyricDensity, type PortraitPlatform } from "./config/layout";
import { songConfig, type SongConfig } from "./config/song";
import { useLyricVideoPlayer } from "./hooks/useLyricVideoPlayer";
import {
  coverArtworkTemplates,
  renderCoverArtwork,
  type CoverArtworkTemplateId,
} from "./lib/coverArtwork";
import {
  defaultProjectEditorState,
  exportProjectArchive,
  loadProjectArchive,
  type ProjectEditorState,
} from "./lib/projectArchive";

type WorkspaceModule = "project" | "assets" | "lyrics" | "layout" | "cover" | "save";

const workspaceModules: Array<{ id: WorkspaceModule; label: string }> = [
  { id: "project", label: "新建/载入" },
  { id: "assets", label: "素材管理" },
  { id: "lyrics", label: "歌词同步与样式" },
  { id: "layout", label: "画幅与布局" },
  { id: "cover", label: "封面生成" },
  { id: "save", label: "保存项目" },
];

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
  initialCustomFonts: {
    lyric: File | null;
    title: File | null;
  };
  initialEditorState: ProjectEditorState;
  initialEditorStateVersion: number;
  sourceFiles: {
    audio: File | null;
    cover: File | null;
    lyric: File | null;
  };
  layoutMode: LayoutMode;
  portraitPlatform: PortraitPlatform;
  onBackToSetup: () => void;
  onCreateProject: () => void;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  onChangePortraitPlatform: (platform: PortraitPlatform) => void;
  onLoadProjectFile: (file: File) => Promise<void>;
  onReplaceAudioFile: (file: File) => void;
  onReplaceCoverFile: (file: File) => void;
  onReplaceLyricFile: (file: File) => Promise<void>;
  onUpdateSongMeta: (patch: Pick<SongConfig, "title" | "artist">) => void;
}) {
  const {
    config,
    initialCustomFonts,
    initialEditorState,
    initialEditorStateVersion,
    sourceFiles,
    layoutMode,
    onBackToSetup,
    onCreateProject,
    onChangeLayoutMode,
    onChangePortraitPlatform,
    onLoadProjectFile,
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
  const [coverArtworkPreviewUrl, setCoverArtworkPreviewUrl] = useState<string | null>(null);
  const [coverArtworkError, setCoverArtworkError] = useState<string | null>(null);
  const [isGeneratingCoverArtwork, setIsGeneratingCoverArtwork] = useState(false);
  const [coverArtworkTemplateId, setCoverArtworkTemplateId] =
    useState<CoverArtworkTemplateId>("xiaohongshu-square");
  const [activeWorkspaceModule, setActiveWorkspaceModule] = useState<WorkspaceModule | null>(null);
  const [projectBusyAction, setProjectBusyAction] = useState<"export" | "load" | null>(null);
  const [projectActionMessage, setProjectActionMessage] = useState<string | null>(null);
  const [projectActionError, setProjectActionError] = useState<string | null>(null);
  const shellRef = useRef<HTMLElement | null>(null);
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
  }, [config.artist, config.coverPath, config.title, coverArtworkTemplateId, resolvedTitleFontFamily]);

  useEffect(() => {
    setTitleFontPresetId(initialEditorState.titleFontPresetId);
    setLyricFontPresetId(initialEditorState.lyricFontPresetId);
    setLyricDensity(initialEditorState.lyricDensity);
    setLyricFontScale(initialEditorState.lyricFontScale);
    setLyricOffsetMs(initialEditorState.lyricOffsetMs);
    setCoverArtworkTemplateId(initialEditorState.coverArtworkTemplateId);
    onChangeLayoutMode(initialEditorState.layoutMode);
    onChangePortraitPlatform(initialEditorState.portraitPlatform);
    setProjectActionError(null);
    setProjectActionMessage(null);
    setActiveWorkspaceModule(null);

    void handleCustomFontFileChange(null, "title");
    void handleCustomFontFileChange(null, "lyric");

    if (initialCustomFonts.title) {
      void handleCustomFontFileChange(initialCustomFonts.title, "title");
    }

    if (initialCustomFonts.lyric) {
      void handleCustomFontFileChange(initialCustomFonts.lyric, "lyric");
    }
  }, [
    handleCustomFontFileChange,
    initialCustomFonts.lyric,
    initialCustomFonts.title,
    initialEditorState,
    initialEditorStateVersion,
    onChangeLayoutMode,
    onChangePortraitPlatform,
  ]);

  const handleToggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await shellRef.current?.requestFullscreen();
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
        setActiveWorkspaceModule((current) => (current === "lyrics" ? null : "lyrics"));
      }

      if (event.key === "Escape") {
        setActiveWorkspaceModule(null);
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
      const { dataUrl } = await renderCoverArtwork({
        artist: config.artist,
        coverSrc: config.coverPath,
        templateId: coverArtworkTemplateId,
        title: config.title,
        titleFontFamily: resolvedTitleFontFamily,
      });

      setCoverArtworkPreviewUrl(dataUrl);
    } catch (error) {
      setCoverArtworkError(error instanceof Error ? error.message : "生成封面失败，请稍后再试。");
    } finally {
      setIsGeneratingCoverArtwork(false);
    }
  }, [config.artist, config.coverPath, config.title, coverArtworkTemplateId, resolvedTitleFontFamily]);

  const handleDownloadCoverArtwork = useCallback(() => {
    if (!coverArtworkPreviewUrl) {
      return;
    }

    const link = document.createElement("a");
    const title = sanitizeFileNamePart(config.title) || "cover";
    const artist = sanitizeFileNamePart(config.artist) || "artist";
    const templateLabel =
      coverArtworkTemplates.find((item) => item.id === coverArtworkTemplateId)?.label ?? "1x1";
    link.href = coverArtworkPreviewUrl;
    link.download = `${title} - ${artist} - ${templateLabel}.png`;
    link.click();
  }, [config.artist, config.title, coverArtworkPreviewUrl, coverArtworkTemplateId]);

  const handleExportProject = useCallback(async () => {
    setProjectBusyAction("export");
    setProjectActionError(null);
    setProjectActionMessage(null);

    try {
      const titleFontFile = customTitleFontUrl && customTitleFontLabel
        ? new File(
          [await fetch(customTitleFontUrl).then(async (response) => response.blob())],
          customTitleFontLabel,
        )
        : null;
      const lyricFontFile = customLyricFontUrl && customLyricFontLabel
        ? new File(
          [await fetch(customLyricFontUrl).then(async (response) => response.blob())],
          customLyricFontLabel,
        )
        : null;
      const coverPreviewBlob = coverArtworkPreviewUrl
        ? await fetch(coverArtworkPreviewUrl).then(async (response) => response.blob())
        : null;
      const { blob, fileName } = await exportProjectArchive({
        config,
        customFonts: {
          lyric: lyricFontFile,
          title: titleFontFile,
        },
        sourceFiles,
        settings: {
          coverArtworkTemplateId,
          layoutMode,
          lyricDensity,
          lyricFontPresetId,
          lyricFontScale,
          lyricOffsetMs,
          portraitPlatform,
          titleFontPresetId,
        },
        sourceCoverPreview: coverPreviewBlob,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setProjectActionMessage("项目已导出为 .amlv.zip。");
    } catch (error) {
      setProjectActionError(error instanceof Error ? error.message : "保存项目失败。");
    } finally {
      setProjectBusyAction(null);
    }
  }, [
    config,
    coverArtworkPreviewUrl,
    coverArtworkTemplateId,
    customLyricFontLabel,
    customLyricFontUrl,
    customTitleFontLabel,
    customTitleFontUrl,
    layoutMode,
    lyricDensity,
    lyricFontPresetId,
    lyricFontScale,
    lyricOffsetMs,
    portraitPlatform,
    sourceFiles,
    titleFontPresetId,
  ]);

  const handleLoadProject = useCallback(async (file: File) => {
    setProjectBusyAction("load");
    setProjectActionError(null);
    setProjectActionMessage(null);

    try {
      await onLoadProjectFile(file);
      setProjectActionMessage("项目已载入，可以继续编辑。");
      setActiveWorkspaceModule(null);
    } catch (error) {
      setProjectActionError(error instanceof Error ? error.message : "载入项目失败。");
    } finally {
      setProjectBusyAction(null);
    }
  }, [onLoadProjectFile]);

  return (
    <main
      className={`app-shell ${isPortrait ? "app-shell-portrait app-shell-portrait-platform-" + portraitPlatform : ""} ${isCompactPortrait ? "app-shell-portrait-compact" : ""}`}
      ref={shellRef}
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

      <div className="workspace-chrome">
        <aside className="workspace-sidepanel">
          <div className="workspace-product-title">Apple Music Lyric Video</div>

          {activeWorkspaceModule === null ? (
            <div className="workspace-menu">
              <nav className="workspace-menu-nav" aria-label="平台模块">
                {workspaceModules.map((module) => (
                  <button
                    key={module.id}
                    className="workspace-menu-item"
                    onClick={() => {
                      setActiveWorkspaceModule(module.id);
                    }}
                    type="button"
                  >
                    {module.label}
                  </button>
                ))}
              </nav>
            </div>
          ) : (
            <SettingsPanel
              activeModule={activeWorkspaceModule}
              artist={config.artist}
              coverArtworkError={coverArtworkError}
              coverArtworkPreviewUrl={coverArtworkPreviewUrl}
              coverArtworkTemplateId={coverArtworkTemplateId}
              coverArtworkTemplates={coverArtworkTemplates}
              customLyricFontLabel={customLyricFontLabel}
              customTitleFontLabel={customTitleFontLabel}
              isGeneratingCoverArtwork={isGeneratingCoverArtwork}
              layoutMode={layoutMode}
              lyricDensity={lyricDensity}
              lyricFontPresetId={lyricFontPresetId}
              lyricFontScale={lyricFontScale}
              lyricOffsetMs={lyricOffsetMs}
              onBackToSetup={onBackToSetup}
              onCreateProject={onCreateProject}
              onChangeLayoutMode={onChangeLayoutMode}
              onChangePortraitPlatform={onChangePortraitPlatform}
              onChangeLyricDensity={setLyricDensity}
              onChangeLyricFontPreset={setLyricFontPresetId}
              onChangeLyricFontScale={setLyricFontScale}
              onChangeTitleFontPreset={setTitleFontPresetId}
              onChangeCoverArtworkTemplate={setCoverArtworkTemplateId}
              onDownloadCoverArtwork={handleDownloadCoverArtwork}
              onExportProject={handleExportProject}
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
                setActiveWorkspaceModule(null);
              }}
              onLoadProjectFile={handleLoadProject}
              onReplaceAudioFile={onReplaceAudioFile}
              onReplaceCoverFile={onReplaceCoverFile}
              onReplaceLyricFile={onReplaceLyricFile}
              onResetToStart={resetToStart}
              onToggleFullscreen={() => {
                void handleToggleFullscreen();
              }}
              onUpdateSongMeta={onUpdateSongMeta}
              open
              placement="inline"
              portraitPlatform={portraitPlatform}
              projectActionError={projectActionError}
              projectActionMessage={projectActionMessage}
              projectBusyAction={projectBusyAction}
              title={config.title}
              titleFontPresetId={titleFontPresetId}
            />
          )}
        </aside>

        <header className="workspace-topbar">
          <div className="workspace-topbar-copy">
            <strong>{config.title}</strong>
            <span>{config.artist}</span>
          </div>

          <div className="workspace-topbar-actions">
            <span className="workspace-pill">{layoutMode === "portrait" ? "竖屏" : "横屏"}</span>
            <button className="icon-button subtle compact" onClick={() => {
              void togglePlayback();
            }}>
              {isPlaying ? "暂停" : "播放"}
            </button>
            <button className="icon-button subtle compact" onClick={() => {
              void handleToggleFullscreen();
            }}>
              全屏
            </button>
          </div>
        </header>
      </div>

      <section className={`content-shell content-shell-workspace ${isPortrait ? "content-shell-portrait" : ""} ${isCompactPortrait ? "content-shell-portrait-square" : ""}`}>
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
  const [activeConfig, setActiveConfig] = useState<SongConfig | null>(songConfig);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(defaultProjectEditorState.layoutMode);
  const [portraitPlatform, setPortraitPlatform] = useState<PortraitPlatform>(defaultProjectEditorState.portraitPlatform);
  const [initialEditorState, setInitialEditorState] = useState<ProjectEditorState>(defaultProjectEditorState);
  const [initialEditorStateVersion, setInitialEditorStateVersion] = useState(0);
  const [initialCustomFonts, setInitialCustomFonts] = useState<{ lyric: File | null; title: File | null }>({
    lyric: null,
    title: null,
  });
  const [sourceFiles, setSourceFiles] = useState<{
    audio: File | null;
    cover: File | null;
    lyric: File | null;
  }>({
    audio: null,
    cover: null,
    lyric: null,
  });

  useEffect(() => {
    return () => {
      cleanupObjectUrls(generatedUrls);
    };
  }, [generatedUrls]);

  const resetEditorState = (nextEditorState: ProjectEditorState = defaultProjectEditorState) => {
    setInitialEditorState(nextEditorState);
    setInitialCustomFonts({
      lyric: null,
      title: null,
    });
    setSourceFiles({
      audio: null,
      cover: null,
      lyric: null,
    });
    setLayoutMode(nextEditorState.layoutMode);
    setPortraitPlatform(nextEditorState.portraitPlatform);
    setInitialEditorStateVersion((current) => current + 1);
  };

  const handleStartDemo = () => {
    cleanupObjectUrls(generatedUrls);
    setGeneratedUrls([]);
    setActiveConfig(songConfig);
    resetEditorState();
  };

  const handleStartWithConfig = (config: SongConfig, objectUrls: string[]) => {
    cleanupObjectUrls(generatedUrls);
    setGeneratedUrls(objectUrls);
    setActiveConfig(config);
  };

  const handleBackToSetup = () => {
    cleanupObjectUrls(generatedUrls);
    setGeneratedUrls([]);
    setActiveConfig(songConfig);
    resetEditorState();
  };

  const handleCreateProject = () => {
    handleBackToSetup();
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
    setSourceFiles((current) => ({
      ...current,
      audio: file,
    }));
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
    setSourceFiles((current) => ({
      ...current,
      cover: file,
    }));
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
    setSourceFiles((current) => ({
      ...current,
      lyric: file,
    }));
  };

  const handleLoadProjectFile = async (file: File) => {
    const loadedProject = await loadProjectArchive(file);

    cleanupObjectUrls(generatedUrls);
    setGeneratedUrls(loadedProject.managedUrls);
    setActiveConfig(loadedProject.config);
    setInitialEditorState(loadedProject.settings);
    setInitialCustomFonts(loadedProject.customFonts);
    setSourceFiles(loadedProject.sourceFiles);
    setLayoutMode(loadedProject.settings.layoutMode);
    setPortraitPlatform(loadedProject.settings.portraitPlatform);
    setInitialEditorStateVersion((current) => current + 1);
  };

  return (
    <PlayerScreen
      config={activeConfig ?? songConfig}
      initialCustomFonts={initialCustomFonts}
      initialEditorState={initialEditorState}
      initialEditorStateVersion={initialEditorStateVersion}
      sourceFiles={sourceFiles}
      layoutMode={layoutMode}
      onBackToSetup={handleBackToSetup}
      onCreateProject={handleCreateProject}
      onChangeLayoutMode={setLayoutMode}
      onChangePortraitPlatform={setPortraitPlatform}
      onLoadProjectFile={handleLoadProjectFile}
      onReplaceAudioFile={handleReplaceAudioFile}
      onReplaceCoverFile={handleReplaceCoverFile}
      onReplaceLyricFile={handleReplaceLyricFile}
      onUpdateSongMeta={handleUpdateSongMeta}
      portraitPlatform={portraitPlatform}
    />
  );
}
