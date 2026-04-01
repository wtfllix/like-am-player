export interface SongConfig {
  title: string;
  artist: string;
  audioPath: string;
  lyricPath?: string;
  lyricFileName?: string;
  lyricText?: string;
  coverPath: string;
}

export const songConfig: SongConfig = {
  title: "Demo Song",
  artist: "Local Template",
  audioPath: "/audio/song.mp3",
  lyricPath: "/lyrics/song.lrc",
  coverPath: "/images/cover.jpg",
};
