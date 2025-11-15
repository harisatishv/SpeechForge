import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Voice {
  id: string;
  name: string;
  language: string;
  accent: string;
  gender: string;
  provider: string;
  preview_url?: string;
}

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  onSelectVoice: (voiceId: string) => void;
}

export default function VoiceSelector({ voices, selectedVoiceId, onSelectVoice }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPreviewId = useRef<string | null>(null);  // Track current preview to prevent race conditions
  const selectedVoice = voices.find(v => v.id === selectedVoiceId);

  const handlePlayPreview = async (voice: Voice, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!voice.preview_url) return;
    
    // If this voice is already playing, pause it
    if (playingVoiceId === voice.id && audioRef.current && currentPreviewId.current === voice.id) {
      audioRef.current.pause();
      audioRef.current = null;
      currentPreviewId.current = null;
      setPlayingVoiceId(null);
      return;
    }
    
    // Stop any currently playing audio and clean up
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';  // Clear source to free resources
      audioRef.current = null;
    }
    
    try {
      // Set this as the current preview BEFORE creating audio
      currentPreviewId.current = voice.id;
      setLoadingVoiceId(voice.id);
      
      // Create new audio element
      const audio = new Audio(voice.preview_url);
      const previewId = voice.id;  // Capture in closure
      audioRef.current = audio;
      
      // Handle audio events - check if this is still the active preview
      const handleLoadedData = () => {
        // Only proceed if this is still the active preview
        if (currentPreviewId.current !== previewId) {
          audio.pause();
          audio.src = '';  // Clear source instead of remove()
          return;
        }
        setLoadingVoiceId(null);
        setPlayingVoiceId(previewId);
        audio.play().catch(err => {
          if (currentPreviewId.current === previewId) {
            console.error('Error playing audio:', err);
            setPlayingVoiceId(null);
            setLoadingVoiceId(null);
          }
        });
      };
      
      const handleEnded = () => {
        if (currentPreviewId.current === previewId) {
          setPlayingVoiceId(null);
          currentPreviewId.current = null;
        }
      };
      
      const handleError = () => {
        if (currentPreviewId.current === previewId) {
          console.error('Error loading audio preview');
          setLoadingVoiceId(null);
          setPlayingVoiceId(null);
          currentPreviewId.current = null;
        }
      };
      
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
    } catch (error) {
      console.error('Error playing preview:', error);
      if (currentPreviewId.current === voice.id) {
        setLoadingVoiceId(null);
        setPlayingVoiceId(null);
        currentPreviewId.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="voice-select" className="text-sm font-medium">Voice</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            id="voice-select"
            data-testid="select-voice"
          >
            {selectedVoice
              ? `${selectedVoice.name} (${selectedVoice.language} • ${selectedVoice.accent})`
              : "Select a voice"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search voices by name or language..." data-testid="input-search-voice" />
            <CommandList>
              <CommandEmpty>No voice found.</CommandEmpty>
              <CommandGroup>
                {voices.filter(v => v.preview_url).map((voice) => (
                  <CommandItem
                    key={voice.id}
                    value={`${voice.name} ${voice.language} ${voice.accent}`}
                    onSelect={() => {
                      onSelectVoice(voice.id);
                      setOpen(false);
                    }}
                    data-testid={`select-voice-${voice.id}`}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selectedVoiceId === voice.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{voice.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({voice.language} • {voice.accent})
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => handlePlayPreview(voice, e)}
                      data-testid={`button-preview-${voice.id}`}
                    >
                      {loadingVoiceId === voice.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : playingVoiceId === voice.id ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedVoice && (
        <div className="flex gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {selectedVoice.language}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {selectedVoice.accent}
          </Badge>
        </div>
      )}
    </div>
  );
}
