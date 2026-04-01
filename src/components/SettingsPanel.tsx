import { fontPresets } from "../config/fonts";

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
    onToggleFullscreen,
    open,
    titleFontPresetId,
  } = props;

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
              className="offset-input"
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                onChangeLyricOffset(Number.isFinite(nextValue) ? nextValue : 0);
              }}
              placeholder="负数提前，正数延后"
              step={50}
              type="number"
              value={lyricOffsetMs}
            />
            <small>正数会让歌词更晚出现，负数会让歌词更早出现。</small>
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
