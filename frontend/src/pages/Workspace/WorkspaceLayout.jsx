import React, { useState, useEffect } from "react";
import { useParams, NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Modal from "../../components/Modal";

function WorkspaceLayout() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchNoteDetails() {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get(`/notes/${id}`);
        if (!response.data) {
          throw new Error("Document not found");
        }
        setNote(response.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load document workspace.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchNoteDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-6">
        <svg
          className="animate-spin h-10 w-10 text-primary mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm font-medium text-ink-muted animate-pulse">
          Opening study workspace...
        </p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="text-danger mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-ink mb-1">Couldn't open workspace</h3>
        <p className="text-sm text-ink-muted mb-6 max-w-sm">
          {error || "The document you requested does not exist or has been deleted."}
        </p>
        <Link
          to="/library"
          className="bg-primary text-white px-4 py-2 text-sm font-semibold rounded hover:bg-primary-hover transition duration-150"
        >
          Back to Library
        </Link>
      </div>
    );
  }

  const tabClass = ({ isActive }) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition duration-150 whitespace-nowrap ${
      isActive
        ? "border-primary text-primary"
        : "border-transparent text-ink-muted hover:text-ink hover:border-border"
    }`;

  return (
    <div className="min-h-screen bg-background font-sans text-ink flex flex-col">
      {/* Workspace Header Panel */}
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Back Arrow + Note Name */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/library"
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-background rounded transition shrink-0 cursor-pointer"
              title="Back to library"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <h1
              className="font-bold text-lg text-ink truncate max-w-[250px] sm:max-w-md"
              title={note.title}
            >
              {note.title}
            </h1>
          </div>

          {/* View PDF Inline Modal Button */}
          <button
            onClick={() => setIsViewerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-background border border-border hover:bg-border/40 text-ink transition duration-150 cursor-pointer"
          >
            <span>View PDF</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        </div>

        {/* Tab Navigation Menu (Horizontally Scrollable) */}
        <div className="max-w-5xl mx-auto px-6 overflow-x-auto border-t border-border/50">
          <nav className="flex space-x-6 min-w-max">
            <NavLink to={`/document/${id}/summary`} className={tabClass}>
              Summary
            </NavLink>
            <NavLink to={`/document/${id}/chat`} className={tabClass}>
              AI Chat
            </NavLink>
            <NavLink to={`/document/${id}/flashcards`} className={tabClass}>
              Flashcards
            </NavLink>
            <NavLink to={`/document/${id}/quiz`} className={tabClass}>
              Quiz
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Nested Tab View Content Area */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col">
        <Outlet context={{ note }} />
      </div>

      {/* PDF Viewer Inline Modal */}
      <Modal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={note.title}
      >
        <div className="flex flex-col h-[70vh] space-y-4">
          <div className="flex justify-between items-center text-xs text-ink-muted">
            <span>Secure PDF Document Preview</span>
            <a
              href={note.pdfUrl.replace(/^http:/, "https:")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Open in New Tab ↗
            </a>
          </div>
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(note.pdfUrl.replace(/^http:/, "https:"))}&embedded=true`}
            title={note.title}
            className="w-full flex-grow border border-border rounded bg-neutral-900"
          />
        </div>
      </Modal>
    </div>
  );
}

export default WorkspaceLayout;
