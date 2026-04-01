export interface FontPreset {
  id: string;
  label: string;
  description: string;
  fontFamily: string;
}

export const fontPresets: FontPreset[] = [
  {
    id: "apple",
    label: "Apple 风格",
    description: "最稳，最接近 Apple Music 的克制观感。",
    fontFamily:
      '"SF Pro Display", "PingFang SC", "Helvetica Neue", "Hiragino Sans GB", sans-serif',
  },
  {
    id: "avenir",
    label: "Avenir 电影感",
    description: "更柔和一点，标题观感更像海报。",
    fontFamily:
      '"Avenir Next", "PingFang SC", "Helvetica Neue", "Hiragino Sans GB", sans-serif',
  },
  {
    id: "serif",
    label: "中文衬线",
    description: "更有抒情感，适合慢歌或叙事感强的歌。",
    fontFamily:
      '"Songti SC", "STSong", "Source Han Serif SC", "Noto Serif SC", serif',
  },
  {
    id: "neutral",
    label: "中性现代",
    description: "更平衡，兼顾干净和可读性。",
    fontFamily:
      '"PingFang SC", "Helvetica Neue", "Microsoft YaHei UI", sans-serif',
  },
];

export const defaultFontPreset = fontPresets[0];
