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

export const portraitPlatformOptions = [
  {
    value: "default",
    label: "通用竖屏",
    description: "适合本地预览或暂不区分平台时使用。",
  },
  {
    value: "xiaohongshu",
    label: "小红书",
    description: "给顶部状态栏、右侧操作区和底部文案区多留一些空间。",
  },
  {
    value: "douyin",
    label: "抖音",
    description: "右侧交互和底部文案更靠内，整体安全区更保守。",
  },
] as const;

export type PortraitPlatform = (typeof portraitPlatformOptions)[number]["value"];

export const lyricDensityOptions = [
  { value: "few", label: "少", description: "同屏更少行，单行更突出。" },
  { value: "medium", label: "中等", description: "默认观感，适合大多数歌词视频。" },
  { value: "many", label: "多", description: "同屏更多行，信息量更高。" },
] as const;

export type LyricDensity = (typeof lyricDensityOptions)[number]["value"];
