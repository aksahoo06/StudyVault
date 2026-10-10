import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Whiteboard from "../components/Whiteboard";
import LiveChat from "../components/LiveChat";
import LiveAudio from "../components/LiveAudio";
import Button from "../components/Button";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

function ClassroomPage() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [whiteboardState, setWhiteboardState] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [isClassEnded, setIsClassEnded] = useState(false);
  const [endReason, setEndReason] = useState("");

  // Teacher disconnect grace period state
  const [teacherDisconnected, setTeacherDisconnected] = useState(false);
  const [graceSeconds, setGraceSeconds] = useState(120);

  const socketRef = useRef(null);

  // Fetch initial classroom metadata
  const fetchClassroomDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/classrooms/${classroomId}`);
      const data = res.data;
      setClassroom(data);

      if (data.status === "ended") {
        setIsClassEnded(true);
        setEndReason("This classroom has already ended.");
      } else {
        const creatorId = data.creatorUserId?._id || data.creatorUserId;
        if (user && creatorId && user._id === creatorId) {
          setIsTeacher(true);
        }
      }
    } catch (err) {
      console.error("Error fetching classroom:", err);
      setErrorMsg("Classroom not found or failed to load.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      fetchClassroomDetails();
    }
  }, [classroomId]);

  // 15-Minute Countdown Timer
  useEffect(() => {
    if (!classroom || classroom.status === "ended" || isClassEnded) return;

    const interval = setInterval(() => {
      const startMs = new Date(classroom.startTime).getTime();
      const elapsedMs = Date.now() - startMs;
      const remainingMs = FIFTEEN_MINUTES_MS - elapsedMs;

      if (remainingMs <= 0) {
        setRemainingSeconds(0);
        setIsClassEnded(true);
        setEndReason("15-minute maximum class duration reached.");
        clearInterval(interval);
      } else {
        setRemainingSeconds(Math.floor(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [classroom, isClassEnded]);

  // 2-Minute Grace Countdown Timer for Teacher Disconnect
  useEffect(() => {
    if (!teacherDisconnected) return;

    const interval = setInterval(() => {
      setGraceSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [teacherDisconnected]);

  // Socket Connection & Event Listeners
  useEffect(() => {
    if (!classroomId) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Join room
    socket.emit("join-room", { classroomId });

    // Initial classroom state sync
    const handleInitState = (data) => {
      if (data.whiteboardState) setWhiteboardState(data.whiteboardState);
      if (data.chatMessages) setChatMessages(data.chatMessages);
      if (data.isTeacher !== undefined) setIsTeacher(data.isTeacher);
      if (data.status === "ended") {
        setIsClassEnded(true);
        setEndReason("Classroom ended.");
      }
    };

    // Teacher disconnect event
    const handleTeacherDisconnect = ({ gracePeriodSeconds }) => {
      setTeacherDisconnected(true);
      setGraceSeconds(gracePeriodSeconds || 120);
    };

    // Teacher reconnect event
    const handleTeacherReconnect = () => {
      setTeacherDisconnected(false);
      setGraceSeconds(120);
    };

    // Class ended event
    const handleClassEnded = ({ reason }) => {
      setIsClassEnded(true);
      setTeacherDisconnected(false);
      let readableReason = "Classroom ended by teacher.";
      if (reason === "max_duration_exceeded") {
        readableReason = "Maximum 15-minute class duration reached.";
      } else if (reason === "teacher_disconnected_timeout") {
        readableReason = "Teacher did not reconnect within the 2-minute grace period.";
      }
      setEndReason(readableReason);
    };

    socket.on("init-classroom-state", handleInitState);
    socket.on("teacher-disconnected", handleTeacherDisconnect);
    socket.on("teacher-reconnected", handleTeacherReconnect);
    socket.on("class-ended", handleClassEnded);

    return () => {
      socket.emit("leave-room", { classroomId });
      socket.off("init-classroom-state", handleInitState);
      socket.off("teacher-disconnected", handleTeacherDisconnect);
      socket.off("teacher-reconnected", handleTeacherReconnect);
      socket.off("class-ended", handleClassEnded);
    };
  }, [classroomId]);

  // Manual End Class handler (Teacher only)
  const handleEndClass = async () => {
    if (!isTeacher) return;
    try {
      if (socketRef.current) {
        socketRef.current.emit("end-class", { classroomId }, (res) => {
          if (res && res.success) {
            setIsClassEnded(true);
            setEndReason("You ended the classroom.");
          }
        });
      }
    } catch (err) {
      console.error("Error ending classroom:", err);
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-ink-muted">Connecting to Live Classroom...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (errorMsg || !classroom) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-16 bg-surface border border-border rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink">{errorMsg || "Classroom Not Found"}</h3>
          <Button onClick={() => navigate("/live-classes")} className="mt-4">
            Back to Live Hub
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-10">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/live-classes")}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-background rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-ink leading-tight">{classroom.className}</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
                {isTeacher && (
                  <span className="text-[11px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    You are Teacher
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted leading-tight mt-0.5">
                Teacher: <span className="font-medium text-ink">{classroom.creatorUserId?.name || "Instructor"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 15-Minute Countdown Badge */}
            <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-ink">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Action Buttons */}
            {isTeacher ? (
              <button
                onClick={handleEndClass}
                disabled={isClassEnded}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                End Class
              </button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => navigate("/live-classes")}
                className="text-xs py-1.5 px-3"
              >
                Leave Class
              </Button>
            )}
          </div>
        </div>

        {/* Teacher Disconnect Warning Banner */}
        {teacherDisconnected && !isClassEnded && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between text-amber-900 shadow-xs">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-bold">Teacher Connection Disrupted!</h4>
                <p className="text-xs text-amber-800">
                  The teacher disconnected. Waiting for reconnection within the 2-minute grace period.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono bg-amber-200 text-amber-900 px-3 py-1 rounded-lg border border-amber-300">
                {formatTimer(graceSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* Classroom Ended Modal / Overlay */}
        {isClassEnded && (
          <div className="bg-slate-900/80 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-ink">Classroom Has Ended</h3>
              <p className="text-sm text-ink-muted">{endReason}</p>
              <div className="bg-background border border-border rounded-lg p-3 text-xs text-ink-muted text-left">
                <p className="font-semibold text-ink mb-1">Temporary Data Cleanup:</p>
                <p>All whiteboard drawings and real-time chat messages have been purged securely.</p>
              </div>
              <Button onClick={() => navigate("/live-classes")} className="w-full">
                Return to Live Hub
              </Button>
            </div>
          </div>
        )}

        {/* Main Workspace Layout (Whiteboard & Audio on Left, Chat on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Main Stage (Whiteboard + Audio) */}
          <div className="lg:col-span-8 space-y-4">
            <Whiteboard
              classroomId={classroomId}
              socket={socketRef.current}
              isTeacher={isTeacher}
              initialState={whiteboardState}
            />
            <LiveAudio
              classroomId={classroomId}
              socket={socketRef.current}
              isTeacher={isTeacher}
            />
          </div>

          {/* Right Panel (Live Chat) */}
          <div className="lg:col-span-4 h-[600px] lg:h-[680px]">
            <LiveChat
              classroomId={classroomId}
              socket={socketRef.current}
              currentUser={user}
              initialMessages={chatMessages}
              teacherUserId={classroom.creatorUserId?._id || classroom.creatorUserId}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default ClassroomPage;
