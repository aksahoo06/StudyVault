import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import DocumentCard from "../components/DocumentCard";
import UploadModal from "../components/UploadModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Button from "../components/Button";

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const navigate = useNavigate();

  async function loadDashboardData() {
    setIsLoading(true);
    setError("");
    try {
      const [statsRes, notesRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/notes"),
      ]);
      setStats(statsRes.data);
      // Sort notes by newest first and take top 3
      const sortedNotes = (notesRes.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentNotes(sortedNotes.slice(0, 3));
    } catch (err) {
      console.error(err);
      setError("Couldn't load your dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenDoc = (id) => {
    navigate(`/document/${id}/summary`);
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/notes/${id}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
  };

  return (
    <AppLayout>
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg flex items-center justify-between mb-8">
          <span className="text-sm font-medium">{error}</span>
          <Button variant="secondary" className="py-1 px-3 text-xs" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            Welcome back, {user?.name || "Student"}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {stats ? `${stats.totalPDFs} documents uploaded` : "Loading docs..."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="text-xs py-1.5" onClick={() => navigate("/library")}>
            Browse Library
          </Button>
          <Button
            variant="primary"
            className="text-xs py-1.5"
            onClick={() => setIsUploadOpen(true)}
          >
            Upload PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="h-6 bg-border w-48 rounded animate-pulse" />
          <LoadingSkeleton count={3} />
        </div>
      ) : recentNotes.length === 0 ? (
        /* Empty Library State */
        <div className="py-12">
          <EmptyState
            icon={
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            title="No documents yet"
            description="Upload your first study note or lecture slides to get started with summaries, flashcards, and interactive chat."
            actionLabel="Upload PDF"
            onAction={() => setIsUploadOpen(true)}
          />
        </div>
      ) : (
        /* Main Dashboard sections */
        <div className="space-y-10">
          {/* Continue Studying */}
          <div>
            <h2 className="text-lg font-bold text-ink mb-4">Continue studying</h2>
            {/* Snap horizontal scroll layout on mobile */}
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x md:grid md:grid-cols-3 md:overflow-visible">
              {recentNotes.map((note) => (
                <div key={note._id} className="w-[85vw] shrink-0 snap-center md:w-auto">
                  <DocumentCard
                    document={note}
                    onOpen={handleOpenDoc}
                    onDelete={handleDeleteDoc}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity log */}
          <div>
            <h2 className="text-lg font-bold text-ink mb-4">Recent activity</h2>
            <div className="bg-surface border border-border rounded-lg overflow-hidden divide-y divide-border">
              {recentNotes.map((note, index) => {
                const ageHours = Math.max(1, index * 2 + 1);
                return (
                  <div
                    key={note._id}
                    className="flex items-center justify-between p-4 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-accent bg-teal-50 p-2 rounded">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <p className="text-ink truncate">
                        You processed RAG embeddings for{" "}
                        <span className="font-semibold">{note.title}</span>
                      </p>
                    </div>
                    <span className="text-xs text-ink-muted shrink-0 ml-4">
                      {ageHours} {ageHours === 1 ? "hour" : "hours"} ago
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={loadDashboardData}
      />
    </AppLayout>
  );
}

export default DashboardPage;