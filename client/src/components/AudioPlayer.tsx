import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  audioUrl: string | null;
  onDownload?: () => void;
}

export default function AudioPlayer({ audioUrl, onDownload }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        audio.pause();
        audio.remove();
      };
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (values: number[]) => {
    if (!audioRef.current) return;
    const newTime = values[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg text-center">
        <div className="text-sm text-muted-foreground">
          No audio generated yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 p-6 rounded-lg border bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Button
            onClick={togglePlay}
            variant="outline"
            size="icon"
            data-testid="button-play-audio"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              data-testid="slider-audio-progress"
            />
          </div>
          <div className="text-sm text-muted-foreground min-w-[80px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="h-20 bg-muted/50 rounded flex items-center justify-center">
          <div className="flex gap-1 items-end h-12">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full transition-all"
                style={{
                  height: `${Math.random() * 100}%`,
                  opacity: currentTime > (i / 40) * duration ? 0.8 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <Button onClick={onDownload} variant="default" data-testid="button-download-audio">
        <Download className="h-4 w-4 mr-2" />
        Download MP3
      </Button>
    </div>
  );
}
