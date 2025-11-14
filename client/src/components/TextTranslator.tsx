import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Languages, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
];

interface TextTranslatorProps {
  onTranslate?: (translatedText: string) => void;
}

export default function TextTranslator({ onTranslate }: TextTranslatorProps) {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("hi");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "No text to translate",
        description: "Please enter some text to translate",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sourceText,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      setTranslatedText(data.translated_text);

      toast({
        title: "Translation complete",
        description: `Translated to ${LANGUAGES.find(l => l.code === targetLang)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Translated text copied successfully",
    });
  };

  const handleUseTranslation = () => {
    if (onTranslate && translatedText) {
      onTranslate(translatedText);
      toast({
        title: "Text applied",
        description: "Translated text has been added to the input",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Languages className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-medium">Text Translator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="source-lang" className="text-sm font-medium">From</Label>
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger id="source-lang" data-testid="select-source-lang">
              <SelectValue placeholder="Auto-detect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="target-lang" className="text-sm font-medium">To</Label>
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger id="target-lang" data-testid="select-target-lang">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="source-text" className="text-sm font-medium">Source Text</Label>
          <Textarea
            id="source-text"
            placeholder="Enter text to translate..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[150px] resize-none"
            data-testid="textarea-source-text"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="translated-text" className="text-sm font-medium">Translation</Label>
          <Textarea
            id="translated-text"
            placeholder="Translation will appear here..."
            value={translatedText}
            readOnly
            className="min-h-[150px] resize-none bg-muted/50"
            data-testid="textarea-translated-text"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          data-testid="button-translate"
        >
          {isTranslating ? "Translating..." : "Translate"}
        </Button>
        
        {translatedText && (
          <>
            <Button
              variant="outline"
              onClick={handleCopy}
              data-testid="button-copy-translation"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            
            {onTranslate && (
              <Button
                variant="secondary"
                onClick={handleUseTranslation}
                data-testid="button-use-translation"
              >
                Use for Text to Speech
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
