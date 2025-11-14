import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VoiceCloneUploadProps {
  onFileSelect: (file: File, name: string) => void;
}

export default function VoiceCloneUpload({ onFileSelect }: VoiceCloneUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith("audio/") || file.name.endsWith(".mp3") || file.name.endsWith(".wav"))) {
      setSelectedFile(file);
      if (!voiceName) {
        setVoiceName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile && voiceName.trim()) {
      onFileSelect(selectedFile, voiceName.trim());
      setSelectedFile(null);
      setVoiceName("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate active-elevate-2">
        <input
          type="file"
          id="audio-upload"
          accept="audio/*,.mp3,.wav"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-audio-upload"
        />
        <label
          htmlFor="audio-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-medium">
            {selectedFile ? selectedFile.name : "Click to upload audio"}
          </div>
          <div className="text-xs text-muted-foreground">
            MP3, WAV (15+ seconds recommended)
          </div>
        </label>
      </div>

      {selectedFile && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="voice-name" className="text-sm font-medium">Voice Name</Label>
          <Input
            id="voice-name"
            type="text"
            placeholder="e.g., My Voice"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            data-testid="input-voice-name"
          />
          <Button
            onClick={handleUpload}
            disabled={!voiceName.trim()}
            data-testid="button-clone-voice"
          >
            Clone Voice
          </Button>
        </div>
      )}
    </div>
  );
}
