import VoiceCloneUpload from "../VoiceCloneUpload";

export default function VoiceCloneUploadExample() {
  const handleFileSelect = (file: File, name: string) => {
    console.log("Voice clone requested:", name, file.name);
  };

  return (
    <div className="p-6 max-w-md">
      <VoiceCloneUpload onFileSelect={handleFileSelect} />
    </div>
  );
}
