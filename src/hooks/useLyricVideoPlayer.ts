import { useEffect, useMemo, useRef, useState } from "react";
import type { LyricLine } from "@applemusic-like-lyrics/core";
import type { SongConfig } from "../config/song";
import { loadLyricLinesFromConfig } from "../lib/lyrics";

export function useLyricVideoPlayer(config: SongConfig) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    loadLyricLinesFromConfig(config)
      .then((lines) => {
        if (!isMounted) {
          return;
        }

        setLyrics(lines);
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "歌词加载失败",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [config]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const syncCurrentTime = () => {
      // 这里是“音频时间 -> AMLL currentTime”的关键桥接点。
      // AMLL 需要毫秒整数，并且更新越频繁，滚动动画就越接近 Apple Music。
      setCurrentTimeMs(Math.round(audio.currentTime * 1000));

      if (!audio.paused && !audio.ended) {
        rafRef.current = window.requestAnimationFrame(syncCurrentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handlePlay = () => {
      setIsPlaying(true);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = window.requestAnimationFrame(syncCurrentTime);
    };

    const handlePause = () => {
      setIsPlaying(false);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      syncCurrentTime();
    };

    const handleSeeked = () => {
      syncCurrentTime();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTimeMs(Math.round(audio.duration * 1000));
    };

    const handleAudioError = () => {
      setError(`无法播放音频文件：${config.audioPath}`);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleAudioError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("seeked", handleSeeked);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleAudioError);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [config.audioPath]);

  const progress = useMemo(() => {
    if (!duration) {
      return 0;
    }

    return Math.min(1, currentTimeMs / (duration * 1000));
  }, [currentTimeMs, duration]);

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
      return;
    }

    audio.pause();
  };

  const seekToProgress = (nextProgress: number) => {
    const audio = audioRef.current;

    if (!audio || !duration) {
      return;
    }

    const clamped = Math.min(1, Math.max(0, nextProgress));
    audio.currentTime = duration * clamped;
    setCurrentTimeMs(Math.round(audio.currentTime * 1000));
  };

  return {
    audioRef,
    currentTimeMs,
    duration,
    error,
    isLoading,
    isPlaying,
    lyrics,
    progress,
    seekToProgress,
    togglePlayback,
  };
}
