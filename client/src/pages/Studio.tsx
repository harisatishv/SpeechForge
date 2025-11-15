import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TextTranslator from "@/components/TextTranslator";
import TextInputPanel from "@/components/TextInputPanel";
import VoiceSelector, { type Voice } from "@/components/VoiceSelector";
import AudioSettings from "@/components/AudioSettings";
import AudioPlayer from "@/components/AudioPlayer";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "/api";

export default function Studio() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [style, setStyle] = useState("default");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const { data: voicesData, isLoading: isLoadingVoices, error: voicesError } = useQuery<{ voices: Voice[] }>({
    queryKey: ["/api/voices"],
  });

  const voices = voicesData?.voices ?? [];

  useEffect(() => {
    if (voices.length > 0 && !selectedVoiceId) {
      setSelectedVoiceId(voices[0].id);
    }
  }, [voices, selectedVoiceId]);

  const generateTTSMutation = useMutation({
    mutationFn: async (data: { text: string; voice_id: string; speed: number; pitch: number; style: string }) => {
      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate audio");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (url) => {
      setAudioUrl(url);
      toast({
        title: "Audio generated",
        description: "Your speech is ready to play",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTextFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      toast({ title: "File uploaded", description: `${file.name} loaded successfully` });
    };
    reader.readAsText(file);
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      toast({
        title: "No text provided",
        description: "Please enter some text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoiceId) {
      toast({
        title: "No voice selected",
        description: "Please select a voice",
        variant: "destructive",
      });
      return;
    }

    generateTTSMutation.mutate({
      text,
      voice_id: selectedVoiceId,
      speed,
      pitch,
      style,
    });
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "generated-speech.mp3";
    link.click();
    toast({ title: "Download started", description: "Your audio file is downloading" });
  };

  const showApiKeyWarning =
    voicesError && ((voicesError as any).message?.includes("503") || (voicesError as any).message?.includes("401"));

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader variant="app" />
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <section className="space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Speech studio</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight">Create natural speech with creative control.</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Translate scripts, fine-tune pacing, and deliver natural speech before exporting clean MP3s or streaming
                  them into your production stack.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.assign("/#pricing");
                }}
              >
                View pricing
              </Button>
            </div>
          </section>

          {showApiKeyWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(voicesError as any).message?.includes("401")
                  ? "Your ElevenLabs API key is missing required permissions. Please enable 'voices_read' and 'tts' permissions in your ElevenLabs account settings. Demo voices are available for testing."
                  : "ElevenLabs API key not configured. Demo voices are available for testing the interface. Add your API key to enable voice generation and access the full voice library."}
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-4">
            <TextTranslator onTranslate={(translatedText) => setText(translatedText)} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <TextInputPanel value={text} onChange={setText} onFileUpload={handleTextFileUpload} />
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="p-6">
                <h2 className="text-lg font-medium mb-4">Voice settings</h2>
                <div className="flex flex-col gap-6">
                  {isLoadingVoices ? (
                    <div className="text-sm text-muted-foreground">Loading voices...</div>
                  ) : (
                    <VoiceSelector voices={voices} selectedVoiceId={selectedVoiceId} onSelectVoice={setSelectedVoiceId} />
                  )}

                  <Separator />

                  <AudioSettings
                    speed={speed}
                    onSpeedChange={setSpeed}
                    pitch={pitch}
                    onPitchChange={setPitch}
                    style={style}
                    onStyleChange={setStyle}
                  />
                </div>
              </Card>

              <Button
                onClick={handleGenerate}
                size="lg"
                disabled={generateTTSMutation.isPending || isLoadingVoices}
                data-testid="button-generate"
              >
                {generateTTSMutation.isPending ? "Generating..." : "Generate speech"}
              </Button>
            </div>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Generated audio</h2>
            <AudioPlayer audioUrl={audioUrl} onDownload={handleDownload} />
          </Card>
        </main>
      </div>
    </RequireAuth>
  );
}
