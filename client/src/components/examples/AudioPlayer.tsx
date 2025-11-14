import AudioPlayer from "../AudioPlayer";

export default function AudioPlayerExample() {
  const handleDownload = () => {
    console.log("Download requested");
  };

  return (
    <div className="p-6 max-w-2xl">
      <AudioPlayer
        audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        onDownload={handleDownload}
      />
    </div>
  );
}
