import { useRef, useEffect, useState } from 'react';
import useWebRTC from '../../hooks/useWebRTC';
import toast from 'react-hot-toast';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react';

function VideoTile({ stream, label, muted = false, isLocal = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-surface rounded-lg overflow-hidden aspect-video border border-border hover:border-primary/50 transition-colors group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      
      {/* User label */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
        <div className={`w-2 h-2 rounded-full ${isLocal ? 'bg-primary' : 'bg-success'}`} />
        <span className="font-medium">{label}</span>
      </div>

      {/* Muted indicator */}
      {muted && (
        <div className="absolute top-2 right-2 bg-danger/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <MicOff size={12} />
          Muted
        </div>
      )}
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

  const [isLoading, setIsLoading] = useState(false);

  async function handleJoinVideo() {
    setIsLoading(true);
    try {
      await joinVideo();
      toast.success('Joined video call', {
        icon: '📹',
      });
    } catch (err) {
      toast.error('Could not access camera/microphone', {
        icon: '❌',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const remoteEntries = Object.entries(streams);
  const hasRemoteStreams = remoteEntries.length > 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      {!localStream ? (
        <div className="flex flex-col gap-3">
          <div className="bg-surface border border-border rounded-lg p-6 text-center">
            <Video size={48} className="mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted mb-4">Start a video call with your team</p>
            <button
              onClick={handleJoinVideo}
              disabled={isLoading}
              className="btn-primary w-full text-sm inline-flex items-center justify-center gap-2"
            >
              <Video size={16} />
              {isLoading ? 'Joining...' : 'Join Video Call'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Video grid */}
          <div className={`grid gap-2 flex-1 overflow-y-auto ${hasRemoteStreams ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <VideoTile stream={localStream} label={`${username} (You)`} muted isLocal />
            {remoteEntries.map(([socketId, stream]) => {
              const client = clients.find(c => c.socketId === socketId);
              return (
                <VideoTile
                  key={socketId}
                  stream={stream}
                  label={client?.username || socketId.slice(0, 6)}
                  isLocal={false}
                />
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mt-auto">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`flex-1 p-3 rounded-lg border transition-all duration-200 text-sm font-medium inline-flex items-center justify-center gap-2 ${
                audioEnabled
                  ? 'border-border bg-surface hover:bg-surface hover:border-primary text-white'
                  : 'border-danger bg-red-950/50 text-danger hover:bg-red-950'
              }`}
              title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {audioEnabled ? (
                <>
                  <Mic size={18} />
                  <span className="hidden sm:inline">Mic</span>
                </>
              ) : (
                <>
                  <MicOff size={18} />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`flex-1 p-3 rounded-lg border transition-all duration-200 text-sm font-medium inline-flex items-center justify-center gap-2 ${
                videoEnabled
                  ? 'border-border bg-surface hover:bg-surface hover:border-primary text-white'
                  : 'border-danger bg-red-950/50 text-danger hover:bg-red-950'
              }`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? (
                <>
                  <Video size={18} />
                  <span className="hidden sm:inline">Camera</span>
                </>
              ) : (
                <>
                  <VideoOff size={18} />
                  <span className="hidden sm:inline">Off</span>
                </>
              )}
            </button>

            {/* Leave Call */}
            <button
              onClick={leaveVideo}
              className="flex-1 p-3 rounded-lg border border-danger bg-red-950/30 hover:bg-red-950 text-danger transition-all duration-200 text-sm font-medium inline-flex items-center justify-center gap-2"
              title="Leave video call"
            >
              <>
                <PhoneOff size={18} />
                <span className="hidden sm:inline">Leave</span>
              </>
            </button>
          </div>

          {/* Participant count */}
          <div className="text-xs text-muted text-center mt-2">
            {remoteEntries.length + 1} participant{remoteEntries.length !== 0 ? 's' : ''} in call
          </div>
        </>
      )}
    </div>
  );
}

