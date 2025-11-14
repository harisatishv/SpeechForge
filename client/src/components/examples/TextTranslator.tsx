import TextTranslator from "../TextTranslator";

export default function TextTranslatorExample() {
  const handleTranslate = (translatedText: string) => {
    console.log("Translated text:", translatedText);
  };

  return (
    <div className="p-6 max-w-4xl">
      <TextTranslator onTranslate={handleTranslate} />
    </div>
  );
}
