import JSZip from "jszip";
import { defaultFontPreset } from "../config/fonts";
import type { LayoutMode, LyricDensity, PortraitPlatform } from "../config/layout";
import type { SongConfig } from "../config/song";
import type { CoverArtworkTemplateId } from "./coverArtwork";

export interface ProjectEditorState {
  coverArtworkTemplateId: CoverArtworkTemplateId;
  layoutMode: LayoutMode;
  lyricDensity: LyricDensity;
  lyricFontPresetId: string;
  lyricFontScale: number;
  lyricOffsetMs: number;
  portraitPlatform: PortraitPlatform;
  titleFontPresetId: string;
}

export const defaultProjectEditorState: ProjectEditorState = {
  coverArtworkTemplateId: "xiaohongshu-square",
  layoutMode: "landscape",
  lyricDensity: "medium",
  lyricFontPresetId: defaultFontPreset.id,
  lyricFontScale: 1,
  lyricOffsetMs: 0,
  portraitPlatform: "default",
  titleFontPresetId: defaultFontPreset.id,
};

interface ProjectArchiveManifest {
  version: 1;
  meta: {
    artist: string;
    title: string;
  };
  files: {
    audio: string;
    cover: string;
    lyric?: string;
    lyricFont?: string;
    titleFont?: string;
  };
  settings: ProjectEditorState;
}

export interface ProjectArchivePayload {
  config: SongConfig;
  customFonts: {
    lyric: File | null;
    title: File | null;
  };
  sourceFiles: {
    audio: File | null;
    cover: File | null;
    lyric: File | null;
  };
  settings: ProjectEditorState;
  sourceCoverPreview?: Blob | null;
}

export interface LoadedProjectArchive {
  config: SongConfig;
  customFonts: {
    lyric: File | null;
    title: File | null;
  };
  managedUrls: string[];
  sourceFiles: {
    audio: File;
    cover: File;
    lyric: File | null;
  };
  settings: ProjectEditorState;
}

function sanitizeFileNamePart(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
}

function inferFileName(path: string, fallback: string) {
  const segments = path.split("/");
  const lastSegment = segments[segments.length - 1];
  return lastSegment || fallback;
}

function normalizeSettings(input: Partial<ProjectEditorState> | undefined): ProjectEditorState {
  return {
    ...defaultProjectEditorState,
    ...input,
  };
}

async function readArchiveFile(zip: JSZip, path: string) {
  const file = zip.file(path);

  if (!file) {
    throw new Error(`项目文件缺失：${path}`);
  }

  return file;
}

export async function exportProjectArchive(payload: ProjectArchivePayload) {
  const zip = new JSZip();
  const title = sanitizeFileNamePart(payload.config.title) || "Untitled Project";
  const artist = sanitizeFileNamePart(payload.config.artist) || "Unknown Artist";
  const audioName = inferFileName(payload.config.audioPath, "audio.mp3");
  const coverName = inferFileName(payload.config.coverPath, "cover.jpg");
  const lyricName = payload.config.lyricFileName?.trim() || "lyrics.lrc";
  const titleFontName = payload.customFonts.title?.name || "title-font.woff2";
  const lyricFontName = payload.customFonts.lyric?.name || "lyric-font.woff2";

  const manifest: ProjectArchiveManifest = {
    version: 1,
    meta: {
      artist: payload.config.artist,
      title: payload.config.title,
    },
    files: {
      audio: `assets/${audioName}`,
      cover: `assets/${coverName}`,
      lyric: payload.config.lyricText || payload.config.lyricPath ? `assets/${lyricName}` : undefined,
      lyricFont: payload.customFonts.lyric ? `assets/${lyricFontName}` : undefined,
      titleFont: payload.customFonts.title ? `assets/${titleFontName}` : undefined,
    },
    settings: normalizeSettings(payload.settings),
  };

  const [audioBlob, coverBlob] = await Promise.all([
    payload.sourceFiles.audio
      ? Promise.resolve(payload.sourceFiles.audio)
      : fetch(payload.config.audioPath).then(async (response) => {
        if (!response.ok) {
          throw new Error("无法读取当前音频文件。");
        }

        return response.blob();
      }),
    payload.sourceFiles.cover
      ? Promise.resolve(payload.sourceFiles.cover)
      : fetch(payload.config.coverPath).then(async (response) => {
        if (!response.ok) {
          throw new Error("无法读取当前封面文件。");
        }

        return response.blob();
      }),
  ]);

  zip.file(manifest.files.audio, audioBlob);
  zip.file(manifest.files.cover, coverBlob);

  if (manifest.files.lyric) {
    const lyricText = payload.sourceFiles.lyric
      ? await payload.sourceFiles.lyric.text()
      : payload.config.lyricText ??
      (payload.config.lyricPath
        ? await fetch(payload.config.lyricPath).then(async (response) => {
          if (!response.ok) {
            throw new Error("无法读取当前歌词文件。");
          }

          return response.text();
        })
        : "");

    zip.file(manifest.files.lyric, lyricText);
  }

  if (manifest.files.titleFont && payload.customFonts.title) {
    zip.file(manifest.files.titleFont, payload.customFonts.title);
  }

  if (manifest.files.lyricFont && payload.customFonts.lyric) {
    zip.file(manifest.files.lyricFont, payload.customFonts.lyric);
  }

  if (payload.sourceCoverPreview) {
    zip.file("cache/cover-preview.png", payload.sourceCoverPreview);
  }

  zip.file("project.json", JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  return {
    blob,
    fileName: `${title} - ${artist}.amlv.zip`,
  };
}

export async function loadProjectArchive(file: File): Promise<LoadedProjectArchive> {
  const zip = await JSZip.loadAsync(file);
  const manifestFile = await readArchiveFile(zip, "project.json");
  const manifest = JSON.parse(await manifestFile.async("string")) as Partial<ProjectArchiveManifest>;

  if (manifest.version !== 1 || !manifest.meta || !manifest.files?.audio || !manifest.files?.cover) {
    throw new Error("项目格式无效，无法识别该 .amlv.zip 文件。");
  }

  const settings = normalizeSettings(manifest.settings);
  const audioBlob = await (await readArchiveFile(zip, manifest.files.audio)).async("blob");
  const coverBlob = await (await readArchiveFile(zip, manifest.files.cover)).async("blob");
  const audioFile = new File([audioBlob], inferFileName(manifest.files.audio, "audio.mp3"), {
    type: audioBlob.type || "audio/mpeg",
  });
  const coverFile = new File([coverBlob], inferFileName(manifest.files.cover, "cover.jpg"), {
    type: coverBlob.type || "image/jpeg",
  });
  const audioPath = URL.createObjectURL(audioBlob);
  const coverPath = URL.createObjectURL(coverBlob);
  const lyricFile = manifest.files.lyric
    ? new File(
      [await (await readArchiveFile(zip, manifest.files.lyric)).async("blob")],
      inferFileName(manifest.files.lyric, "lyrics.lrc"),
    )
    : null;
  const lyricText = lyricFile ? await lyricFile.text() : undefined;
  const titleFont = manifest.files.titleFont
    ? new File(
      [await (await readArchiveFile(zip, manifest.files.titleFont)).async("blob")],
      inferFileName(manifest.files.titleFont, "title-font.woff2"),
    )
    : null;
  const lyricFont = manifest.files.lyricFont
    ? new File(
      [await (await readArchiveFile(zip, manifest.files.lyricFont)).async("blob")],
      inferFileName(manifest.files.lyricFont, "lyric-font.woff2"),
    )
    : null;

  return {
    config: {
      artist: manifest.meta.artist,
      audioPath,
      coverPath,
      lyricFileName: manifest.files.lyric ? inferFileName(manifest.files.lyric, "lyrics.lrc") : undefined,
      lyricPath: undefined,
      lyricText,
      title: manifest.meta.title,
    },
    customFonts: {
      lyric: lyricFont,
      title: titleFont,
    },
    managedUrls: [audioPath, coverPath],
    sourceFiles: {
      audio: audioFile,
      cover: coverFile,
      lyric: lyricFile,
    },
    settings,
  };
}
