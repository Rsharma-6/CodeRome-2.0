import { useRef, useState, useCallback } from 'react';
import { ACTIONS } from '../Actions';

const ICE_SERVERS = [
  { urls: 'stun:stun.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function useWebRTC(socketRef, roomId) {
  const [streams, setStreams] = useState({}); // { socketId: MediaStream }
  const [localStream, setLocalStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const peers = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);

  function createPeerConnection(remoteSocketId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit(ACTIONS.VIDEO_ICE_CANDIDATE, {
          to: remoteSocketId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      setStreams(prev => ({ ...prev, [remoteSocketId]: stream }));
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peers.current[remoteSocketId] = pc;
    return pc;
  }

  const joinVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      socketRef.current?.emit(ACTIONS.VIDEO_JOIN, { roomId });

      // Handle incoming video join (someone else joined)
      socketRef.current?.on(ACTIONS.VIDEO_JOIN, async ({ socketId }) => {
        const pc = createPeerConnection(socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit(ACTIONS.VIDEO_OFFER, { to: socketId, offer });
      });

      socketRef.current?.on(ACTIONS.VIDEO_OFFER, async ({ from, offer }) => {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit(ACTIONS.VIDEO_ANSWER, { to: from, answer });
      });

      socketRef.current?.on(ACTIONS.VIDEO_ANSWER, async ({ from, answer }) => {
        await peers.current[from]?.setRemoteDescription(answer);
      });

      socketRef.current?.on(ACTIONS.VIDEO_ICE_CANDIDATE, ({ from, candidate }) => {
        peers.current[from]?.addIceCandidate(candidate).catch(() => {});
      });

      socketRef.current?.on(ACTIONS.VIDEO_LEAVE, ({ socketId }) => {
        peers.current[socketId]?.close();
        delete peers.current[socketId];
        setStreams(prev => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      });
    } catch (err) {
      console.error('[WebRTC] Failed to get media:', err);
      throw err;
    }
  }, [socketRef, roomId]);

  const leaveVideo = useCallback(() => {
    socketRef.current?.emit(ACTIONS.VIDEO_LEAVE, { roomId });

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    Object.values(peers.current).forEach(pc => pc.close());
    peers.current = {};
    setStreams({});
  }, [socketRef, roomId]);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  }, []);

  return {
    localStream,
    streams,
    videoEnabled,
    audioEnabled,
    joinVideo,
    leaveVideo,
    toggleVideo,
    toggleAudio,
  };
}
