import { useEffect, useMemo, useState } from "react";
import { fontPresets } from "../config/fonts";
import {
  layoutModeOptions,
  lyricDensityOptions,
  portraitPlatformOptions,
  type LayoutMode,
  type LyricDensity,
  type PortraitPlatform,
} from "../config/layout";

const MAX_LYRIC_OFFSET_MS = 10000;

interface SettingsPanelProps {
  artist: string;
  customLyricFontLabel: string | null;
  customTitleFontLabel: string | null;
  layoutMode: LayoutMode;
  lyricDensity: LyricDensity;
  lyricFontPresetId: string;
  lyricFontScale: number;
  lyricOffsetMs: number;
  onBackToSetup: () => void;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  onChangeLyricDensity: (density: LyricDensity) => void;
  onChangeLyricFontPreset: (presetId: string) => void;
  onChangeLyricFontScale: (scale: number) => void;
  onChangeTitleFontPreset: (presetId: string) => void;
  onCustomLyricFontFileChange: (file: File | null) => void;
  onCustomTitleFontFileChange: (file: File | null) => void;
  onChangeLyricOffset: (offsetMs: number) => void;
  onClose: () => void;
  onReplaceAudioFile: (file: File) => void;
  onReplaceCoverFile: (file: File) => void;
  onReplaceLyricFile: (file: File) => Promise<void>;
  onResetToStart: () => void;
  onToggleFullscreen: () => void;
  open: boolean;
  portraitPlatform: PortraitPlatform;
  onChangePortraitPlatform: (platform: PortraitPlatform) => void;
  onUpdateSongMeta: (patch: { title: string; artist: string }) => void;
  title: string;
  titleFontPresetId: string;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    artist,
    customLyricFontLabel,
    customTitleFontLabel,
    layoutMode,
    lyricDensity,
    lyricFontPresetId,
    lyricFontScale,
    lyricOffsetMs,
    onBackToSetup,
    onChangeLayoutMode,
    onChangeLyricDensity,
    onChangeLyricFontPreset,
    onChangeLyricFontScale,
    onChangeTitleFontPreset,
    onCustomLyricFontFileChange,
    onCustomTitleFontFileChange,
    onChangeLyricOffset,
    onClose,
    onReplaceAudioFile,
    onReplaceCoverFile,
    onReplaceLyricFile,
    onChangePortraitPlatform,
    onUpdateSongMeta,
    onResetToStart,
    onToggleFullscreen,
    open,
    portraitPlatform,
    title,
    titleFontPresetId,
  } = props;
  const [lyricOffsetInput, setLyricOffsetInput] = useState(String(lyricOffsetMs));
  const [titleInput, setTitleInput] = useState(title);
  const [artistInput, setArtistInput] = useState(artist);

  useEffect(() => {
    setLyricOffsetInput(String(lyricOffsetMs));
  }, [lyricOffsetMs]);

  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  useEffect(() => {
    setArtistInput(artist);
  }, [artist]);

  const lyricOffsetError = useMemo(() => {
    const trimmedValue = lyricOffsetInput.trim();

    if (!trimmedValue) {
      return "请输入毫秒数，例如 -250 或 300。";
    }

    if (!/^[+-]?\d+$/.test(trimmedValue)) {
      return "只支持整数毫秒值，可输入正数或负数。";
    }

    const parsedValue = Number(trimmedValue);

    if (!Number.isInteger(parsedValue)) {
      return "歌词延时必须是整数毫秒值。";
    }

    if (Math.abs(parsedValue) > MAX_LYRIC_OFFSET_MS) {
      return `请输入 -${MAX_LYRIC_OFFSET_MS} 到 ${MAX_LYRIC_OFFSET_MS} 之间的值。`;
    }

    return null;
  }, [lyricOffsetInput]);

  const handleLyricOffsetChange = (nextValue: string) => {
    setLyricOffsetInput(nextValue);

    const trimmedValue = nextValue.trim();
    if (!trimmedValue || !/^[+-]?\d+$/.test(trimmedValue)) {
      return;
    }

    const parsedValue = Number(trimmedValue);
    if (!Number.isInteger(parsedValue) || Math.abs(parsedValue) > MAX_LYRIC_OFFSET_MS) {
      return;
    }

    onChangeLyricOffset(parsedValue);
  };

  const handleSongMetaBlur = () => {
    onUpdateSongMeta({
      title: titleInput.trim() || title,
      artist: artistInput.trim() || artist,
    });
  };

  return (
    <aside
      aria-hidden={!open}
      className={`settings-panel ${open ? "is-open" : ""}`}
    >
      <div className="settings-card">
        <div className="settings-header">
          <div>
            <p className="eyebrow">Playback Settings</p>
            <h2>配置面板</h2>
          </div>
          <button className="icon-button subtle compact" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="settings-body">
          <section className="settings-group">
            <div className="settings-group-header">
              <span>播放模式</span>
              <small>同一套素材可以随时切换横屏或竖屏布局。</small>
            </div>

            <div className="mode-option-row">
              {layoutModeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`mode-option-button ${layoutMode === option.value ? "is-active" : ""}`}
                  onClick={() => {
                    onChangeLayoutMode(option.value);
                  }}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-header">
              <span>快捷操作</span>
              <small>录屏前最常用的动作都放在这里。</small>
            </div>

            <div className="settings-actions">
              <button className="icon-button settings-action accent" onClick={onToggleFullscreen}>
                全屏
              </button>
              <button className="icon-button settings-action" onClick={onResetToStart}>
                回到开头
              </button>
              <button className="icon-button settings-action" onClick={onBackToSetup}>
                换素材
              </button>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-header">
              <span>换素材</span>
              <small>可以单独替换任意一个项目，不用回到首页重新选整套素材。</small>
            </div>

            <div className="settings-field-grid settings-field-grid-compact">
              <label className="settings-field settings-field-compact">
                <span>歌曲标题</span>
                <input
                  className="text-input"
                  onBlur={handleSongMetaBlur}
                  onChange={(event) => {
                    setTitleInput(event.target.value);
                  }}
                  type="text"
                  value={titleInput}
                />
              </label>

              <label className="settings-field settings-field-compact">
                <span>歌手</span>
                <input
                  className="text-input"
                  onBlur={handleSongMetaBlur}
                  onChange={(event) => {
                    setArtistInput(event.target.value);
                  }}
                  type="text"
                  value={artistInput}
                />
              </label>

              <label className="settings-field settings-field-compact">
                <span>替换音频</span>
                <input
                  accept="audio/*"
                  className="file-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      onReplaceAudioFile(file);
                      event.target.value = "";
                    }
                  }}
                  type="file"
                />
                <small>重新选择后会立即替换当前播放的音频。</small>
              </label>

              <label className="settings-field settings-field-compact">
                <span>替换歌词</span>
                <input
                  accept=".lrc,.yrc,.qrc,.lys,.eslrc,.ttml,text/plain,application/xml,text/xml"
                  className="file-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      void onReplaceLyricFile(file);
                      event.target.value = "";
                    }
                  }}
                  type="file"
                />
                <small>替换后会重新解析歌词，当前其它设置保持不变。</small>
              </label>

              <label className="settings-field settings-field-compact">
                <span>替换封面</span>
                <input
                  accept="image/*"
                  className="file-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      onReplaceCoverFile(file);
                      event.target.value = "";
                    }
                  }}
                  type="file"
                />
                <small>封面和背景会一起更新，不需要重新进入播放页。</small>
              </label>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-header">
              <span>字体</span>
              <small>标题和歌词字体集中管理，减少切换时的视觉打断。</small>
            </div>

            <div className="settings-field-grid settings-field-grid-compact">
              <label className="settings-field settings-field-compact">
                <span>标题字体</span>
                <select
                  className="settings-select"
                  onChange={(event) => onChangeTitleFontPreset(event.target.value)}
                  value={titleFontPresetId}
                >
                  {fontPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <small>
                  {fontPresets.find((preset) => preset.id === titleFontPresetId)?.description}
                </small>
              </label>

              <label className="settings-field settings-field-compact">
                <span>歌词字体</span>
                <select
                  className="settings-select"
                  onChange={(event) => onChangeLyricFontPreset(event.target.value)}
                  value={lyricFontPresetId}
                >
                  {fontPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <small>
                  {fontPresets.find((preset) => preset.id === lyricFontPresetId)?.description}
                </small>
              </label>

              <label className="settings-field settings-field-compact">
                <span>标题本地字体文件</span>
                <input
                  accept=".woff,.woff2,.ttf,.otf"
                  className="file-input"
                  onChange={(event) => {
                    onCustomTitleFontFileChange(event.target.files?.[0] ?? null);
                  }}
                  type="file"
                />
                <small>
                  {customTitleFontLabel
                    ? `当前已加载：${customTitleFontLabel}`
                    : "可选本地 woff2 / ttf / otf，用来覆盖系统字体预设。"}
                </small>
              </label>

              <label className="settings-field settings-field-compact">
                <span>歌词本地字体文件</span>
                <input
                  accept=".woff,.woff2,.ttf,.otf"
                  className="file-input"
                  onChange={(event) => {
                    onCustomLyricFontFileChange(event.target.files?.[0] ?? null);
                  }}
                  type="file"
                />
                <small>
                  {customLyricFontLabel
                    ? `当前已加载：${customLyricFontLabel}`
                    : "可选本地 woff2 / ttf / otf，用来覆盖系统字体预设。"}
                </small>
              </label>
            </div>
          </section>

          <section className="settings-group">
            <div className="settings-group-header">
              <span>歌词</span>
              <small>
                {layoutMode === "portrait"
                  ? "控制同屏密度、字号和时间对齐。"
                  : "延时微调用来对齐音频和歌词出现时机。"}
              </small>
            </div>

            {layoutMode === "portrait" ? (
              <>
                <label className="settings-field">
                  <span>平台适配</span>
                  <select
                    className="settings-select"
                    onChange={(event) => {
                      onChangePortraitPlatform(event.target.value as PortraitPlatform);
                    }}
                    value={portraitPlatform}
                  >
                    {portraitPlatformOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>
                    {portraitPlatformOptions.find((option) => option.value === portraitPlatform)?.description}
                  </small>
                </label>

                <label className="settings-field">
                  <span>同屏歌词行数</span>
                  <select
                    className="settings-select"
                    onChange={(event) => {
                      onChangeLyricDensity(event.target.value as LyricDensity);
                    }}
                    value={lyricDensity}
                  >
                    {lyricDensityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>
                    {lyricDensityOptions.find((option) => option.value === lyricDensity)?.description}
                  </small>
                </label>

                <label className="settings-field">
                  <span>歌词字号</span>
                  <input
                    className="settings-range"
                    max={140}
                    min={70}
                    onChange={(event) => {
                      onChangeLyricFontScale(Number(event.target.value) / 100);
                    }}
                    step={1}
                    type="range"
                    value={Math.round(lyricFontScale * 100)}
                  />
                  <small>当前字号：{Math.round(lyricFontScale * 100)}%</small>
                </label>
              </>
            ) : null}

            <label className="settings-field">
              <span>歌词延时 (ms)</span>
              <input
                aria-invalid={lyricOffsetError ? "true" : "false"}
                className={`offset-input ${lyricOffsetError ? "is-invalid" : ""}`}
                inputMode="numeric"
                onBlur={() => {
                  if (lyricOffsetError) {
                    setLyricOffsetInput(String(lyricOffsetMs));
                  }
                }}
                onChange={(event) => {
                  handleLyricOffsetChange(event.target.value);
                }}
                placeholder="例如 -250 或 300"
                type="text"
                value={lyricOffsetInput}
              />
              <small className={lyricOffsetError ? "field-error" : undefined}>
                {lyricOffsetError
                  ? lyricOffsetError
                  : `正数会让歌词更早出现，负数会让歌词更晚出现。当前支持范围：±${MAX_LYRIC_OFFSET_MS}ms。`}
              </small>
            </label>
          </section>

          <div className="settings-shortcuts">
            <span>快捷键</span>
            <small>`Space` 播放/暂停，`F` 全屏，`C` 打开/关闭面板，`Esc` 关闭面板。</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
