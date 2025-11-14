import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import TextInputPanel from "@/components/TextInputPanel";
import VoiceSelector, { Voice } from "@/components/VoiceSelector";
import VoiceCloneUpload from "@/components/VoiceCloneUpload";
import RecordingControls from "@/components/RecordingControls";
import AudioSettings from "@/components/AudioSettings";
import AudioPlayer from "@/components/AudioPlayer";
import VoiceCard from "@/components/VoiceCard";
import ThemeToggle from "@/components/ThemeToggle";
import TextTranslator from "@/components/TextTranslator";
import { Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = "/api";

interface ClonedVoice {
  id: string;
  name: string;
  createdAt: string;
}

export default function Home() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [style, setStyle] = useState("default");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Fetch preset voices
  const { data: voicesData, isLoading: isLoadingVoices, error: voicesError } = useQuery<{ voices: Voice[] }>({
    queryKey: ["/api/voices"],
  });

  // Fetch cloned voices
  const { data: clonedVoicesData, isLoading: isLoadingCloned } = useQuery<{ voices: ClonedVoice[] }>({
    queryKey: ["/api/voices/cloned"],
  });

  // Use only real voices from ElevenLabs API
  const voices = voicesData?.voices || [];
  const clonedVoices = clonedVoicesData?.voices || [];

  // Set first voice as selected when voices load
  useEffect(() => {
    if (voices.length > 0 && !selectedVoiceId) {
      setSelectedVoiceId(voices[0].id);
    }
  }, [voices, selectedVoiceId]);

  // TTS generation mutation
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

      // Convert response to blob and create URL
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

  // Voice clone mutation
  const cloneVoiceMutation = useMutation({
    mutationFn: async (data: { file: File; name: string }) => {
      const formData = new FormData();
      formData.append("audio_file", data.file);
      formData.append("name", data.name);

      const response = await apiRequest("POST", `${API_BASE_URL}/voices/clone`, formData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voices/cloned"] });
      toast({
        title: "Voice cloned successfully",
        description: "Your voice is ready to use",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cloning failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete cloned voice mutation
  const deleteVoiceMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      const response = await apiRequest("DELETE", `${API_BASE_URL}/voices/cloned/${voiceId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voices/cloned"] });
      toast({
        title: "Voice deleted",
        description: "Cloned voice has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTextFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      toast({
        title: "File uploaded",
        description: `${file.name} loaded successfully`,
      });
    };
    reader.readAsText(file);
  };

  const handleVoiceClone = async (file: File, name: string) => {
    cloneVoiceMutation.mutate({ file, name });
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    // Convert blob to file
    const file = new File([audioBlob], "recording.webm", { type: audioBlob.type });
    const name = `Recording ${new Date().toLocaleTimeString()}`;
    cloneVoiceMutation.mutate({ file, name });
  };

  const handleDeleteClonedVoice = (id: string) => {
    deleteVoiceMutation.mutate(id);
  };

  const handleGenerate = async () => {
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
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = "generated-speech.mp3";
      link.click();
      toast({
        title: "Download started",
        description: "Your audio file is downloading",
      });
    }
  };

  const showApiKeyWarning = voicesError && ((voicesError as any).message?.includes("503") || (voicesError as any).message?.includes("401"));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">VoiceForge</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showApiKeyWarning && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {(voicesError as any).message?.includes("401") 
                ? "Your ElevenLabs API key is missing required permissions. Please enable 'voices_read' and 'tts' permissions in your ElevenLabs account settings. Demo voices are available for testing the interface."
                : "ElevenLabs API key not configured. Demo voices are available for testing the interface. Add your API key to enable actual voice generation and access the full voice library."}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <TextTranslator onTranslate={(translatedText) => setText(translatedText)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <TextInputPanel
              value={text}
              onChange={setText}
              onFileUpload={handleTextFileUpload}
            />
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Voice Settings</h2>
              <div className="flex flex-col gap-6">
                {isLoadingVoices ? (
                  <div className="text-sm text-muted-foreground">Loading voices...</div>
                ) : (
                  <VoiceSelector
                    voices={voices}
                    selectedVoiceId={selectedVoiceId}
                    onSelectVoice={setSelectedVoiceId}
                  />
                )}

                <Separator />

                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" data-testid="tab-upload">Upload</TabsTrigger>
                    <TabsTrigger value="record" data-testid="tab-record">Record</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">Clone Voice from Audio</h3>
                      <VoiceCloneUpload onFileSelect={handleVoiceClone} />
                    </div>
                  </TabsContent>
                  <TabsContent value="record" className="mt-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">Clone Voice from Microphone</h3>
                      <RecordingControls onRecordingComplete={handleRecordingComplete} />
                    </div>
                  </TabsContent>
                </Tabs>

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
              {generateTTSMutation.isPending ? "Generating..." : "Generate Speech"}
            </Button>
          </div>
        </div>

        {clonedVoices.length > 0 && (
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-medium mb-4">Cloned Voices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clonedVoices.map((voice) => (
                <VoiceCard
                  key={voice.id}
                  id={voice.id}
                  name={voice.name}
                  createdAt={voice.createdAt}
                  onDelete={handleDeleteClonedVoice}
                  onSelect={setSelectedVoiceId}
                  isSelected={selectedVoiceId === voice.id}
                />
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6">
          <h2 className="text-lg font-medium mb-4">Generated Audio</h2>
          <AudioPlayer audioUrl={audioUrl} onDownload={handleDownload} />
        </Card>
      </main>
    </div>
  );
}
