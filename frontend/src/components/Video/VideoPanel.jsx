import { useRef, useEffect } from 'react';
import useWebRTC from '../../hooks/useWebRTC';
import toast from 'react-hot-toast';

function VideoTile({ stream, label, muted = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-surface rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-2 text-xs text-white bg-black/50 px-1 rounded">
        {label}
      </div>
    </div>
  );
}

export default function VideoPanel({ socketRef, roomId, username, clients }) {
  const {
    localStream,
    streams,
    videoEnabled,
    audioEnabled,
    joinVideo,
    leaveVideo,
    toggleVideo,
    toggleAudio,
  } = useWebRTC(socketRef, roomId);

  async function handleJoinVideo() {
    try {
      await joinVideo();
      toast.success('Joined video call');
    } catch {
      toast.error('Could not access camera/microphone');
    }
  }

  const remoteEntries = Object.entries(streams);

  return (
    <div className="flex flex-col gap-2">
      {!localStream ? (
        <button
          onClick={handleJoinVideo}
          className="w-full py-2 text-sm rounded border border-border text-muted hover:border-primary hover:text-primary transition-colors"
        >
          📹 Join Video Call
        </button>
      ) : (
        <>
          <div className={`grid gap-2 ${remoteEntries.length === 0 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <VideoTile stream={localStream} label={`${username} (you)`} muted />
            {remoteEntries.map(([socketId, stream]) => {
              const client = clients.find(c => c.socketId === socketId);
              return <VideoTile key={socketId} stream={stream} label={client?.username || socketId.slice(0, 6)} />;
            })}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2 mt-1">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full border text-sm transition-colors ${
                audioEnabled ? 'border-border text-white hover:bg-surface' : 'border-danger bg-red-950 text-danger'
              }`}
              title={audioEnabled ? 'Mute mic' : 'Unmute mic'}
            >
              {audioEnabled ? '🎤' : '🔇'}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full border text-sm transition-colors ${
                videoEnabled ? 'border-border text-white hover:bg-surface' : 'border-danger bg-red-950 text-danger'
              }`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? '📹' : '🚫'}
            </button>
            <button
              onClick={leaveVideo}
              className="p-2 rounded-full border border-danger bg-red-950 text-danger hover:bg-red-900 transition-colors text-sm"
              title="Leave video"
            >
              📵
            </button>
          </div>
        </>
      )}
    </div>
  );
}
