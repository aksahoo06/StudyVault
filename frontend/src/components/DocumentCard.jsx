import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";

function DocumentCard({ document: doc, onOpen, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formattedDate = doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between h-44 relative">
      {/* Top Header Block */}
      <div className="flex justify-between items-start">
        {/* PDF Icon + Name Block */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="bg-red-50 text-red-600 p-2.5 rounded flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h4
              className="font-semibold text-base text-ink line-clamp-2 break-words leading-tight"
              title={doc.title}
            >
              {doc.title}
            </h4>
            <p className="text-xs text-ink-muted mt-1">{formattedDate}</p>
          </div>
        </div>

        {/* Dropdown Options Button */}
        <div className="relative shrink-0 ml-2" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-ink-muted hover:text-ink hover:bg-background rounded transition cursor-pointer"
            aria-label="Document options"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-28 bg-surface border border-border rounded shadow-lg z-30 py-1 animate-fade-in">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(doc._id);
                }}
                className="w-full text-left px-3.5 py-1.5 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer font-medium"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Button Footer */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-border/60">
        <Button
          variant="primary"
          className="flex-1 text-xs py-1.5"
          onClick={() => onOpen(doc._id)}
        >
          Open Study Vault
        </Button>
        <a
          href={doc.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs font-semibold rounded bg-surface text-ink border border-border hover:bg-background transition duration-150 flex items-center justify-center"
          title="Open original PDF in a new tab"
        >
          View PDF ↗
        </a>
      </div>
    </div>
  );
}

export default DocumentCard;
