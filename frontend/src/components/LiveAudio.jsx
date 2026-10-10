import React, { useState, useEffect, useRef } from "react";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function LiveAudio({ classroomId, socket, isTeacher }) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTeacherMuted, setIsTeacherMuted] = useState(false);
  const [audioConnected, setAudioConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // Key: targetSocketId or 'student'
  const studentPeerConnectionRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Clean up media streams & peer connections on unmount
  useEffect(() => {
    return () => {
      stopTeacherBroadcast();
      closeStudentConnection();
    };
  }, []);

  const closeStudentConnection = () => {
    if (studentPeerConnectionRef.current) {
      studentPeerConnectionRef.current.close();
      studentPeerConnectionRef.current = null;
    }
    setAudioConnected(false);
  };

  const stopTeacherBroadcast = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    setIsBroadcasting(false);
    setIsMuted(false);
  };

  // --- TEACHER WEBRTC BROADCAST LOGIC ---
  const startTeacherBroadcast = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsBroadcasting(true);
      setIsMuted(false);

      if (socket && classroomId) {
        socket.emit("teacher-mic-state", { classroomId, isMuted: false });
        // Initiate offer to existing room participants
        createTeacherOffer();
      }
    } catch (err) {
      console.error("Error accessing microphone for broadcast:", err);
      setErrorMsg("Microphone access denied or unreadable.");
    }
  };

  const createTeacherOffer = async (targetSocketId = null) => {
    if (!localStreamRef.current || !socket || !classroomId) return;

    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc-ice-candidate", {
            classroomId,
            candidate: e.candidate,
            targetSocketId,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const pcKey = targetSocketId || "broadcast";
      peerConnectionsRef.current.set(pcKey, pc);

      socket.emit("webrtc-offer", { classroomId, offer, targetSocketId });
    } catch (err) {
      console.error("Error creating WebRTC offer:", err);
    }
  };

  const toggleMicMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle enabled
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);

        if (socket && classroomId) {
          socket.emit("teacher-mic-state", { classroomId, isMuted: newMuteState });
        }
      }
    }
  };

  // --- STUDENT WEBRTC LISTENER LOGIC ---
  useEffect(() => {
    if (!socket || isTeacher) return;

    // Handle incoming WebRTC offer from teacher
    const handleOffer = async ({ offer, senderSocketId }) => {
      closeStudentConnection();

      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        studentPeerConnectionRef.current = pc;

        pc.ontrack = (event) => {
          if (remoteAudioRef.current && event.streams[0]) {
            remoteAudioRef.current.srcObject = event.streams[0];
            remoteAudioRef.current.play().catch((err) => {
              console.warn("Autoplay blocked or audio error:", err);
            });
            setAudioConnected(true);
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("webrtc-ice-candidate", {
              classroomId,
              candidate: e.candidate,
              targetSocketId: senderSocketId,
            });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          classroomId,
          answer,
          targetSocketId: senderSocketId,
        });
      } catch (err) {
        console.error("Error handling WebRTC offer on student side:", err);
      }
    };

    // Handle incoming WebRTC answer (Teacher side response)
    const handleAnswer = async ({ answer, senderSocketId }) => {
      if (isTeacher) {
        const pcKey = senderSocketId || "broadcast";
        const pc = peerConnectionsRef.current.get(pcKey) || peerConnectionsRef.current.get("broadcast");
        if (pc && pc.signalingState !== "stable") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error("Error setting remote description for answer:", err);
          }
        }
      }
    };

    // Handle ICE Candidates
    const handleIceCandidate = async ({ candidate, senderSocketId }) => {
      const pc = isTeacher
        ? peerConnectionsRef.current.get(senderSocketId) || peerConnectionsRef.current.get("broadcast")
        : studentPeerConnectionRef.current;

      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding WebRTC ICE candidate:", err);
        }
      }
    };

    // Handle Teacher Mic Mute status updates
    const handleTeacherMicState = ({ isMuted: muted }) => {
      setIsTeacherMuted(muted);
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("teacher-mic-state", handleTeacherMicState);

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("teacher-mic-state", handleTeacherMicState);
    };
  }, [socket, isTeacher, classroomId]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
      {/* Hidden Audio element for student reception */}
      {!isTeacher && <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              isTeacher
                ? isBroadcasting
                  ? isMuted
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600 animate-pulse"
                  : "bg-background text-ink-muted border border-border"
                : audioConnected
                ? isTeacherMuted
                  ? "bg-amber-100 text-amber-600"
                  : "bg-emerald-100 text-emerald-600 animate-pulse"
                : "bg-background text-ink-muted border border-border"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isTeacher
                    ? isMuted
                      ? "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z M3 3l18 18"
                      : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    : "M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.314M6.343 9.657L10 6v12l-3.657-3.657H3V9.657h3.343z"
                }
              />
            </svg>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink leading-tight">
              {isTeacher ? "Teacher Audio Stream" : "Live Teacher Voice Stream"}
            </h4>
            <p className="text-xs text-ink-muted leading-tight mt-0.5">
              {isTeacher ? (
                isBroadcasting ? (
                  isMuted ? (
                    <span className="text-amber-600 font-medium">Microphone Muted</span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Broadcasting Live Audio
                    </span>
                  )
                ) : (
                  "Click below to start broadcasting your voice to students"
                )
              ) : audioConnected ? (
                isTeacherMuted ? (
                  <span className="text-amber-600 font-medium">Teacher Mic is Muted</span>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Listening to Live Broadcast
                  </span>
                )
              ) : (
                "Waiting for teacher to start audio broadcast..."
              )}
            </p>
          </div>
        </div>

        {/* Teacher Audio Control Buttons */}
        {isTeacher && (
          <div className="flex items-center gap-2">
            {isBroadcasting ? (
              <>
                <button
                  onClick={toggleMicMute}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border ${
                    isMuted
                      ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                      : "bg-surface text-ink border-border hover:bg-background"
                  }`}
                >
                  {isMuted ? "Unmute Mic" : "Mute Mic"}
                </button>
                <button
                  onClick={stopTeacherBroadcast}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition"
                >
                  Stop Audio
                </button>
              </>
            ) : (
              <button
                onClick={startTeacherBroadcast}
                className="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition shadow-xs flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Start Audio
              </button>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

export default LiveAudio;
