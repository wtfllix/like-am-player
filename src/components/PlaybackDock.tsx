import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { formatTime } from "../lib/lyrics";

interface PlaybackDockProps {
  artist: string;
  currentTimeMs: number;
  duration: number;
  hideMeta?: boolean;
  isPlaying: boolean;
  onSeek: (nextProgress: number) => void;
  progress: number;
  title: string;
}

export function PlaybackDock(props: PlaybackDockProps) {
  const {
    artist,
    currentTimeMs,
    duration,
    hideMeta = false,
    isPlaying,
    onSeek,
    progress,
    title,
  } = props;
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const updateFromPointer = (clientX: number) => {
      const timeline = timelineRef.current;

      if (!timeline) {
        return;
      }

      const rect = timeline.getBoundingClientRect();
      if (!rect.width) {
        return;
      }

      const nextProgress = (clientX - rect.left) / rect.width;
      onSeek(nextProgress);
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateFromPointer(event.clientX);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, onSeek]);

  const handleTimelinePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const timeline = timelineRef.current;

    if (!timeline) {
      return;
    }

    const rect = timeline.getBoundingClientRect();
    if (!rect.width) {
      return;
    }

    const nextProgress = (event.clientX - rect.left) / rect.width;
    onSeek(nextProgress);
    setIsDragging(true);
  };

  const handleTimelineKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 0.01 : -0.01;
    onSeek(progress + delta);
  };

  return (
    <div className="playback-dock">
      {!hideMeta ? (
        <div className="playback-copy">
          <p className="eyebrow">Now Playing</p>
          <h1>{title}</h1>
          <p className="artist">{artist}</p>
        </div>
      ) : null}

      <div className="playback-controls">
        <div className="timeline-block">
          <div
            aria-label="播放进度"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progress * 100)}
            className={`timeline ${isDragging ? "is-dragging" : ""}`}
            onKeyDown={handleTimelineKeyDown}
            onPointerDown={handleTimelinePointerDown}
            ref={timelineRef}
            role="slider"
            tabIndex={0}
          >
            <div className="timeline-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="timeline-meta">
            <span>{isPlaying ? "Playing" : "Paused"} · {formatTime(currentTimeMs / 1000)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
