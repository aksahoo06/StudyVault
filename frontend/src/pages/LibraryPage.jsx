import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import DocumentCard from "../components/DocumentCard";
import UploadModal from "../components/UploadModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Button from "../components/Button";

function LibraryPage() {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const navigate = useNavigate();

  async function fetchNotes() {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/notes");
      setNotes(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load your document library.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleOpenDoc = (id) => {
    navigate(`/document/${id}/summary`);
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    try {
      await api.delete(`/notes/${id}`);
      fetchNotes();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
  };

  // Client-side search filtering
  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg flex items-center justify-between mb-6">
          <span className="text-sm font-medium">{error}</span>
          <Button variant="secondary" className="py-1 px-3 text-xs" onClick={fetchNotes}>
            Retry
          </Button>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Your Library</h1>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 border border-border bg-surface rounded pl-9 pr-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <svg
              className="w-4 h-4 text-ink-muted absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <Button
            variant="primary"
            className="text-xs py-2"
            onClick={() => setIsUploadOpen(true)}
          >
            Upload PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={6} />
      ) : notes.length === 0 ? (
        /* Empty State (No uploads at all) */
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
          description="Click the button to upload a study PDF, notes, or research papers to start your workspace."
          actionLabel="Upload PDF"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : filteredNotes.length === 0 ? (
        /* No Match Search State */
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
          title="No documents match search"
          description={`We couldn't find any documents matching "${searchQuery}". Try editing the keyword.`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery("")}
        />
      ) : (
        /* Documents Grid Display */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <DocumentCard
              key={note._id}
              document={note}
              onOpen={handleOpenDoc}
              onDelete={handleDeleteDoc}
            />
          ))}
        </div>
      )}

      {/* Upload PDF Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchNotes}
      />
    </AppLayout>
  );
}

export default LibraryPage;
