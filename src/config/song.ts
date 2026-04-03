export interface SongConfig {
  title: string;
  artist: string;
  audioPath: string;
  lyricPath?: string;
  lyricFileName?: string;
  lyricText?: string;
  coverPath: string;
}

function withBase(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

export const songConfig: SongConfig = {
  title: "Demo Song",
  artist: "Local Template",
  audioPath: withBase("audio/song.mp3"),
  lyricPath: withBase("lyrics/song.lrc"),
  coverPath: withBase("images/cover.jpg"),
};
