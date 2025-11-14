import { useState } from "react";
import TextInputPanel from "../TextInputPanel";

export default function TextInputPanelExample() {
  const [text, setText] = useState("Welcome to VoiceForge. Transform your text into natural-sounding speech with our advanced AI voice synthesis.");

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-[500px] p-6">
      <TextInputPanel
        value={text}
        onChange={setText}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}
