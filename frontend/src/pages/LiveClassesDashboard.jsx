import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import api from "../services/api";

function LiveClassesDashboard() {
  const [activeClasses, setActiveClasses] = useState([]);
  const [recentEndedClasses, setRecentEndedClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const fetchClassrooms = async () => {
    try {
      setIsLoading(true);
      const [activeRes, recentRes] = await Promise.all([
        api.get("/classrooms/active"),
        api.get("/classrooms/recent"),
      ]);
      setActiveClasses(activeRes.data || []);
      setRecentEndedClasses(recentRes.data || []);
    } catch (err) {
      console.error("Error fetching classrooms:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setIsCreating(true);
      setErrorMessage("");
      const res = await api.post("/classrooms", { className: newClassName.trim() });
      setIsModalOpen(false);
      setNewClassName("");
      if (res.data && res.data._id) {
        navigate(`/live/${res.data._id}`);
      }
    } catch (err) {
      console.error("Error creating classroom:", err);
      setErrorMessage(err.response?.data?.message || "Failed to create classroom.");
    } finally {
      setIsCreating(false);
    }
  };

  const formatElapsedMinutes = (startTime) => {
    if (!startTime) return "0 mins";
    const mins = Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 60000));
    return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border p-6 rounded-2xl shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Live Classroom Hub
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">
              Interactive Live Classes
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Join active real-time classrooms or host your own 15-minute whiteboarding session with audio & live chat.
            </p>
          </div>
          <div>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Live Class</span>
            </Button>
          </div>
        </div>

        {/* Active Classrooms Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <span>Active Live Classes</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {activeClasses.length} Live
              </span>
            </h2>
            <button
              onClick={fetchClassrooms}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-surface border border-border rounded-xl animate-pulse p-5 flex flex-col justify-between" />
              ))}
            </div>
          ) : activeClasses.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-ink">No Active Live Classes Right Now</h3>
              <p className="text-sm text-ink-muted mt-1 max-w-md mx-auto">
                Be the first to launch a live classroom! Click "Create Live Class" to invite students.
              </p>
              <div className="mt-4">
                <Button onClick={() => setIsModalOpen(true)} variant="secondary">
                  Host a Class Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeClasses.map((cls) => (
                <Card key={cls._id} className="flex flex-col justify-between p-5 hover:border-primary/50 transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        LIVE
                      </span>
                      <span className="text-xs text-ink-muted">
                        Started {formatElapsedMinutes(cls.startTime)}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-ink line-clamp-1 mb-1">{cls.className}</h3>
                    <p className="text-xs text-ink-muted flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Teacher: <span className="font-medium text-ink">{cls.creatorUserId?.name || "Instructor"}</span>
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      15m Max Session
                    </span>
                    <Button
                      onClick={() => navigate(`/live/${cls._id}`)}
                      className="text-xs py-1.5 px-3"
                    >
                      Join Class
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Ended Classes Section */}
        <div>
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <span>Recent Completed Classes</span>
            <span className="text-xs text-ink-muted font-normal">(Last 3 Ended Sessions)</span>
          </h2>

          {recentEndedClasses.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-5 text-center text-sm text-ink-muted">
              No recent classroom history available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentEndedClasses.map((cls) => (
                <div key={cls._id} className="bg-surface border border-border rounded-xl p-4 opacity-80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Ended
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      {formatDate(cls.endedAt || cls.updatedAt)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-ink line-clamp-1">{cls.className}</h4>
                  <p className="text-xs text-ink-muted mt-1">
                    Teacher: {cls.creatorUserId?.name || "Instructor"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Live Classroom */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Live Classroom"
      >
        <form onSubmit={handleCreateClassroom} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Classroom Name / Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Advanced Operating Systems - Lecture 4"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errorMessage}
            </p>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Live Class Features:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>15-minute max duration auto-expiration.</li>
              <li>Real-time HTML Canvas whiteboard with drawing tools.</li>
              <li>One-way WebRTC teacher audio stream & interactive chat.</li>
              <li>Automatic temporary data wipe upon session end.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !newClassName.trim()}
            >
              {isCreating ? "Launching..." : "Launch Class"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

export default LiveClassesDashboard;
