import RecordingControls from "../RecordingControls";

export default function RecordingControlsExample() {
  const handleRecordingComplete = (audioBlob: Blob) => {
    console.log("Recording complete, blob size:", audioBlob.size);
  };

  return (
    <div className="p-6">
      <RecordingControls onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}
