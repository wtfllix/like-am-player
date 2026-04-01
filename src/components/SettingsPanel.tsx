import { useEffect, useMemo, useState } from "react";
import { fontPresets } from "../config/fonts";

const MAX_LYRIC_OFFSET_MS = 10000;

interface SettingsPanelProps {
  customLyricFontLabel: string | null;
  customTitleFontLabel: string | null;
  lyricFontPresetId: string;
  lyricOffsetMs: number;
  onBackToSetup: () => void;
  onChangeLyricFontPreset: (presetId: string) => void;
  onChangeTitleFontPreset: (presetId: string) => void;
  onCustomLyricFontFileChange: (file: File | null) => void;
  onCustomTitleFontFileChange: (file: File | null) => void;
  onChangeLyricOffset: (offsetMs: number) => void;
  onClose: () => void;
  onResetToStart: () => void;
  onToggleFullscreen: () => void;
  open: boolean;
  titleFontPresetId: string;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    customLyricFontLabel,
    customTitleFontLabel,
    lyricFontPresetId,
    lyricOffsetMs,
    onBackToSetup,
    onChangeLyricFontPreset,
    onChangeTitleFontPreset,
    onCustomLyricFontFileChange,
    onCustomTitleFontFileChange,
    onChangeLyricOffset,
    onClose,
    onResetToStart,
    onToggleFullscreen,
    open,
    titleFontPresetId,
  } = props;
  const [lyricOffsetInput, setLyricOffsetInput] = useState(String(lyricOffsetMs));

  useEffect(() => {
    setLyricOffsetInput(String(lyricOffsetMs));
  }, [lyricOffsetMs]);

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
          <div className="settings-actions">
            <button className="icon-button subtle" onClick={onBackToSetup}>
              换素材
            </button>
            <button className="icon-button subtle" onClick={onResetToStart}>
              回到开头
            </button>
            <button className="icon-button subtle" onClick={onToggleFullscreen}>
              全屏
            </button>
          </div>

          <label className="settings-field">
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

          <label className="settings-field">
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

          <label className="settings-field">
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

          <label className="settings-field">
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
                : `正数会让歌词更晚出现，负数会让歌词更早出现。当前支持范围：±${MAX_LYRIC_OFFSET_MS}ms。`}
            </small>
          </label>

          <div className="settings-shortcuts">
            <span>快捷键</span>
            <small>`Space` 播放/暂停，`F` 全屏，`C` 打开/关闭面板，`Esc` 关闭面板。</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
