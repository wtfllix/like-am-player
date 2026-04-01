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
      <div className="setup-card">
        <div className="setup-copy">
          <p className="eyebrow">Local Lyric Video</p>
          <h1>选择一首歌，再进入录屏页面</h1>
          <p className="setup-description">
            你可以直接使用项目自带的 demo 资源，也可以从本机选择音频、歌词和封面图。进入播放页后，封面会固定在歌词左侧。
          </p>
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
    </section>
  );
}
