import { formatTime } from "../lib/lyrics";

interface PlaybackDockProps {
  artist: string;
  currentTimeMs: number;
  duration: number;
  hideMeta?: boolean;
  isPlaying: boolean;
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
    progress,
    title,
  } = props;

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
          <div aria-hidden="true" className="timeline">
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
