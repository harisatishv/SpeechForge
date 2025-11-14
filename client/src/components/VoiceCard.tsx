import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface VoiceCardProps {
  id: string;
  name: string;
  createdAt: string;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

export default function VoiceCard({
  id,
  name,
  createdAt,
  onDelete,
  onSelect,
  isSelected = false,
}: VoiceCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border hover-elevate active-elevate-2 cursor-pointer ${
        isSelected ? "border-primary bg-accent" : ""
      }`}
      onClick={() => onSelect(id)}
      data-testid={`card-voice-${id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="font-medium truncate">{name}</div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">Cloned</Badge>
            <span className="text-xs text-muted-foreground">{createdAt}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          data-testid={`button-delete-voice-${id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
