import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2 } from "lucide-react";

interface RecordingControlsProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

export default function RecordingControls({ onRecordingComplete }: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {!isRecording && !audioUrl && (
          <Button
            onClick={startRecording}
            variant="default"
            size="default"
            data-testid="button-start-recording"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        )}
        
        {isRecording && (
          <>
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="default"
              data-testid="button-stop-recording"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          </>
        )}

        {audioUrl && !isRecording && (
          <>
            <Button
              onClick={playRecording}
              variant="outline"
              size="default"
              data-testid="button-play-recording"
            >
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
            <span className="text-sm text-muted-foreground">{formatTime(recordingTime)}</span>
            <Button
              onClick={deleteRecording}
              variant="ghost"
              size="icon"
              data-testid="button-delete-recording"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={startRecording}
              variant="outline"
              size="sm"
              data-testid="button-record-again"
            >
              Record Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
