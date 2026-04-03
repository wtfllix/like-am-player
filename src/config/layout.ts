export const layoutModeOptions = [
  {
    value: "landscape",
    label: "横屏",
    description: "更适合桌面预览和常规视频画幅。",
  },
  {
    value: "portrait",
    label: "竖屏",
    description: "更适合手机录屏和短视频画幅。",
  },
] as const;

export type LayoutMode = (typeof layoutModeOptions)[number]["value"];

export const lyricDensityOptions = [
  { value: "few", label: "少", description: "同屏更少行，单行更突出。" },
  { value: "medium", label: "中等", description: "默认观感，适合大多数歌词视频。" },
  { value: "many", label: "多", description: "同屏更多行，信息量更高。" },
] as const;

export type LyricDensity = (typeof lyricDensityOptions)[number]["value"];
