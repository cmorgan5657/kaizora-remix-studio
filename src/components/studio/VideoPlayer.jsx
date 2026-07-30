import { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, VolumeX, Volume2, Maximize } from 'lucide-react';

export default function VideoPlayer({ videoUrl, thumbnailUrl, duration, resolution }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loop, setLoop] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.loop = loop;
    }
  }, [muted, loop]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
  };

  const frameStep = (dir) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setPlaying(false);
    videoRef.current.currentTime += dir / 24;
  };

  const seek = (e) => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const pct = (e.target.value / 100);
    videoRef.current.currentTime = pct * videoRef.current.duration;
    setCurrentTime(videoRef.current.currentTime);
  };

  const fullscreen = () => {
    if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
  };

  const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0 relative bg-black rounded-md overflow-hidden group">
        <video ref={videoRef} src={videoUrl} poster={thumbnailUrl} className="w-full h-full object-contain" onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)} onEnded={() => setPlaying(false)} onClick={togglePlay} />
        {!playing && videoUrl && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors" title="Play">
            <span className="w-16 h-16 rounded-full bg-accent/90 hover:bg-accent flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <Play className="w-7 h-7 text-accent-foreground ml-1" fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5 bg-panel border-t border-border">
        <button onClick={() => frameStep(-1)} className="p-1 text-muted-foreground hover:text-foreground" title="Frame back"><SkipBack className="w-3.5 h-3.5" /></button>
        <button onClick={togglePlay} className="p-1.5 text-accent-foreground bg-accent rounded-md hover:bg-accent-hover">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
        <button onClick={() => frameStep(1)} className="p-1 text-muted-foreground hover:text-foreground" title="Frame forward"><SkipForward className="w-3.5 h-3.5" /></button>
        <input type="range" min={0} max={100} value={videoRef.current?.duration ? (currentTime / videoRef.current.duration) * 100 : 0} onChange={seek} className="flex-1 accent-accent h-1" />
        <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{fmtTime(currentTime)} / {fmtTime(duration || 0)}</span>
        <button onClick={() => setLoop(!loop)} className={`p-1 transition-colors ${loop ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`} title="Loop"><Repeat className="w-3.5 h-3.5" /></button>
        <button onClick={() => setMuted(!muted)} className="p-1 text-muted-foreground hover:text-foreground" title="Mute">{muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}</button>
        <button onClick={fullscreen} className="p-1 text-muted-foreground hover:text-foreground" title="Fullscreen"><Maximize className="w-3.5 h-3.5" /></button>
      </div>
      <div className="text-xs text-muted-foreground px-2 py-0.5 text-right">{resolution || '1080p'} · {duration || 5}s · 24fps</div>
    </div>
  );
}