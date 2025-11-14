import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioSettingsProps {
  speed: number;
  onSpeedChange: (value: number) => void;
  pitch: number;
  onPitchChange: (value: number) => void;
  style: string;
  onStyleChange: (value: string) => void;
}

const SPEAKING_STYLES = [
  { value: "default", label: "Default" },
  { value: "conversational", label: "Conversational" },
  { value: "professional", label: "Professional" },
  { value: "cheerful", label: "Cheerful" },
  { value: "empathetic", label: "Empathetic" },
];

export default function AudioSettings({
  speed,
  onSpeedChange,
  pitch,
  onPitchChange,
  style,
  onStyleChange,
}: AudioSettingsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="style-select" className="text-sm font-medium">Speaking Style</Label>
        <Select value={style} onValueChange={onStyleChange}>
          <SelectTrigger id="style-select" data-testid="select-style">
            <SelectValue placeholder="Select style" />
          </SelectTrigger>
          <SelectContent>
            {SPEAKING_STYLES.map((s) => (
              <SelectItem key={s.value} value={s.value} data-testid={`select-style-${s.value}`}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="speed-slider" className="text-sm font-medium">Speed</Label>
          <span className="text-sm text-muted-foreground">{speed.toFixed(1)}x</span>
        </div>
        <Slider
          id="speed-slider"
          min={0.5}
          max={2}
          step={0.1}
          value={[speed]}
          onValueChange={(values) => onSpeedChange(values[0])}
          data-testid="slider-speed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="pitch-slider" className="text-sm font-medium">Pitch</Label>
          <span className="text-sm text-muted-foreground">{pitch > 0 ? '+' : ''}{pitch}</span>
        </div>
        <Slider
          id="pitch-slider"
          min={-12}
          max={12}
          step={1}
          value={[pitch]}
          onValueChange={(values) => onPitchChange(values[0])}
          data-testid="slider-pitch"
        />
      </div>
    </div>
  );
}
