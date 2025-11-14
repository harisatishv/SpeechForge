import { useState } from "react";
import VoiceCard from "../VoiceCard";

export default function VoiceCardExample() {
  const [selectedId, setSelectedId] = useState<string | null>("v1");

  const handleDelete = (id: string) => {
    console.log("Delete voice:", id);
  };

  return (
    <div className="p-6 max-w-md flex flex-col gap-4">
      <VoiceCard
        id="v1"
        name="My Voice"
        createdAt="2 hours ago"
        onDelete={handleDelete}
        onSelect={setSelectedId}
        isSelected={selectedId === "v1"}
      />
      <VoiceCard
        id="v2"
        name="Professional Narrator"
        createdAt="Yesterday"
        onDelete={handleDelete}
        onSelect={setSelectedId}
        isSelected={selectedId === "v2"}
      />
    </div>
  );
}
