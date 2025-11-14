import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface TextInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (file: File) => void;
}

export default function TextInputPanel({ value, onChange, onFileUpload }: TextInputPanelProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/plain") {
      onFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <Label htmlFor="text-input" className="text-lg font-medium">Text Input</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("file-upload")?.click()}
          data-testid="button-upload-text"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload .txt
        </Button>
        <input
          id="file-upload"
          type="file"
          accept=".txt"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-file-upload"
        />
      </div>
      <Textarea
        id="text-input"
        placeholder="Paste or type your text here... You can also upload a .txt file."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-h-[300px] resize-none text-base"
        data-testid="textarea-text-input"
      />
      <div className="text-sm text-muted-foreground">
        {value.length} characters
      </div>
    </div>
  );
}
