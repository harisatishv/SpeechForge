import { useState } from "react";
import AudioSettings from "../AudioSettings";

export default function AudioSettingsExample() {
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [style, setStyle] = useState("default");

  return (
    <div className="p-6 max-w-md">
      <AudioSettings
        speed={speed}
        onSpeedChange={setSpeed}
        pitch={pitch}
        onPitchChange={setPitch}
        style={style}
        onStyleChange={setStyle}
      />
    </div>
  );
}
