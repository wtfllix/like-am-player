import type { LyricLine } from "@applemusic-like-lyrics/core";
import {
  parseEslrc,
  parseLrc,
  parseLys,
  parseQrc,
  parseTTML,
  parseYrc,
} from "@applemusic-like-lyrics/lyric";
import type { SongConfig } from "../config/song";

function getExtension(path: string) {
  const cleanPath = path.split("?")[0] ?? path;
  return cleanPath.split(".").pop()?.toLowerCase() ?? "";
}

export async function loadLyricLines(path: string): Promise<LyricLine[]> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`无法读取歌词文件：${path}`);
  }

  const text = await response.text();
  const extension = getExtension(path);
  return parseLyricText(text, extension);
}

export function parseLyricText(text: string, extensionOrName: string): LyricLine[] {
  const extension = getExtension(extensionOrName);

  switch (extension) {
    case "lrc":
      return parseLrc(text);
    case "yrc":
      return parseYrc(text);
    case "qrc":
      return parseQrc(text);
    case "lys":
      return parseLys(text);
    case "eslrc":
      return parseEslrc(text);
    case "ttml":
      return parseTTML(text).lines;
    default:
      throw new Error(
        `暂不支持的歌词格式：.${extension || "unknown"}，请使用 .lrc / .yrc / .qrc / .lys / .eslrc / .ttml`,
      );
  }
}

export async function loadLyricLinesFromConfig(config: SongConfig): Promise<LyricLine[]> {
  if (config.lyricText) {
    return parseLyricText(config.lyricText, config.lyricFileName ?? config.lyricPath ?? "");
  }

  if (config.lyricPath) {
    return loadLyricLines(config.lyricPath);
  }

  throw new Error("没有找到歌词来源，请重新选择歌词文件。");
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const remainSeconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainSeconds}`;
}
