import { useMemo, useState } from "react";
import { songConfig, type SongConfig } from "../config/song";

interface SetupPageProps {
  onStartDemo: () => void;
  onStartWithConfig: (config: SongConfig, objectUrls: string[]) => void;
}

function fileNameWithoutExtension(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

export function SetupPage(props: SetupPageProps) {
  const { onStartDemo, onStartWithConfig } = props;
  const [title, setTitle] = useState(songConfig.title);
  const [artist, setArtist] = useState(songConfig.artist);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyricFile, setLyricFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const canStartCustom = useMemo(
    () => Boolean(audioFile && lyricFile && coverFile),
    [audioFile, lyricFile, coverFile],
  );

  const handleStartCustom = async () => {
    if (!audioFile || !lyricFile || !coverFile) {
      return;
    }

    const lyricText = await lyricFile.text();
    const audioPath = URL.createObjectURL(audioFile);
    const coverPath = URL.createObjectURL(coverFile);

    onStartWithConfig(
      {
        title: title.trim() || fileNameWithoutExtension(audioFile.name),
        artist: artist.trim() || "Unknown Artist",
        audioPath,
        lyricFileName: lyricFile.name,
        lyricText,
        coverPath,
      },
      [audioPath, coverPath],
    );
  };

  return (
    <section className="setup-shell">
      <div className="setup-layout">
        <div className="setup-overview">
          <div className="setup-copy">
            <p className="eyebrow">Local Lyric Video</p>
            <h1>选择一首歌，再进入录屏页面</h1>
            <p className="setup-description">
              你可以直接使用项目自带的 demo 资源，也可以从本机选择音频、歌词和封面图。进入播放页后，封面会固定在歌词左侧。
            </p>
          </div>

          <div className="setup-guide setup-guide-list">
            <p>
              <strong>怎么开始：</strong>
              先点“使用 Demo 素材”跑通一次，再导入你自己的音频、歌词和封面图。
            </p>
            <p>
              <strong>需要准备：</strong>
              一份音频、一份歌词和一张封面图。歌词推荐优先使用 <code>.lrc</code>。
            </p>
            <p>
              <strong>进入播放页后：</strong>
              按 <code>C</code> 打开配置面板，调整歌词延时和字体。
            </p>
          </div>

          <div className="setup-tip">
            <strong>推荐工作流</strong>
            <p>先用 Demo 看效果，再换自己的素材。</p>
            <p>如果歌词整体快或慢，在播放页用“歌词延时”微调。</p>
            <p>录屏前建议先全屏，再隐藏鼠标。</p>
          </div>
        </div>

        <div className="setup-panel">
          <div className="setup-panel-header">
            <h2>导入你的素材</h2>
            <p>填好歌曲信息并选择 3 个文件后，就可以直接进入播放页。</p>
          </div>

          <div className="setup-grid">
            <label className="field">
              <span>歌曲标题</span>
              <input
                className="text-input"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：Cruel Summer"
                type="text"
                value={title}
              />
            </label>

            <label className="field">
              <span>歌手</span>
              <input
                className="text-input"
                onChange={(event) => setArtist(event.target.value)}
                placeholder="例如：Taylor Swift"
                type="text"
                value={artist}
              />
            </label>

            <label className="field">
              <span>音频文件</span>
              <input
                accept="audio/*"
                className="file-input"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setAudioFile(file);

                  if (file && title === songConfig.title) {
                    setTitle(fileNameWithoutExtension(file.name));
                  }
                }}
                type="file"
              />
              <small>{audioFile?.name ?? "支持 mp3 / m4a / wav 等浏览器可播放格式"}</small>
            </label>

            <label className="field">
              <span>歌词文件</span>
              <input
                accept=".lrc,.yrc,.qrc,.lys,.eslrc,.ttml,text/plain,application/xml,text/xml"
                className="file-input"
                onChange={(event) => {
                  setLyricFile(event.target.files?.[0] ?? null);
                }}
                type="file"
              />
              <small>{lyricFile?.name ?? "推荐先用 .lrc，后续可升级 .ttml / .lys"}</small>
            </label>

            <label className="field">
              <span>封面图片</span>
              <input
                accept="image/*"
                className="file-input"
                onChange={(event) => {
                  setCoverFile(event.target.files?.[0] ?? null);
                }}
                type="file"
              />
              <small>{coverFile?.name ?? "建议使用接近正方形的封面图"}</small>
            </label>
          </div>

          <div className="setup-actions">
            <button className="icon-button" onClick={onStartDemo}>
              使用 Demo 素材
            </button>
            <button
              className="icon-button primary"
              disabled={!canStartCustom}
              onClick={() => {
                void handleStartCustom();
              }}
            >
              进入播放页
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
