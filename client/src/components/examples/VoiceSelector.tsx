import { useState } from "react";
import VoiceSelector, { Voice } from "../VoiceSelector";

const mockVoices: Voice[] = [
  { id: "v1", name: "Sarah", language: "English", accent: "US", gender: "Female" },
  { id: "v2", name: "James", language: "English", accent: "UK", gender: "Male" },
  { id: "v3", name: "Emma", language: "English", accent: "Australian", gender: "Female" },
  { id: "v4", name: "Miguel", language: "Spanish", accent: "Spain", gender: "Male" },
  { id: "v5", name: "Yuki", language: "Japanese", accent: "Tokyo", gender: "Female" },
];

export default function VoiceSelectorExample() {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>("v1");

  return (
    <div className="p-6 max-w-md">
      <VoiceSelector
        voices={mockVoices}
        selectedVoiceId={selectedVoiceId}
        onSelectVoice={setSelectedVoiceId}
      />
    </div>
  );
}
