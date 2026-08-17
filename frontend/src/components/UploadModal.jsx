import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import Button from "./Button";
import ProgressBar from "./ProgressBar";
import api from "../services/api";

function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      if (!title) {
        // Strip .pdf extension for default title
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setError("");
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        if (!title) {
          setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
        setError("");
      } else {
        setError("Only PDF files are supported.");
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setTitle("");
    setProgress(0);
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setError("");
    setProgress(10); // Start progress indication

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("pdf", file);

    try {
      // 1. Upload to backend
      const response = await api.post("/notes/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // Scale progress to 90% (saving last 10% for final processing stage)
          setProgress(Math.min(90, Math.max(10, percentCompleted)));
        },
      });

      // 2. Processing (finalizing)
      setProcessing(true);
      setProgress(100);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Close modal and redirect to study workspace
      setTimeout(() => {
        handleClose();
        navigate(`/document/${response.data.note._id}/summary`);
      }, 800);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Upload failed. Please check the backend connection."
      );
      setUploading(false);
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle("");
    setUploading(false);
    setProcessing(false);
    setProgress(0);
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload PDF Note">
      <form onSubmit={handleUpload} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Document Title
          </label>
          <input
            type="text"
            placeholder="e.g. Database Normalisation Lecture 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            required
          />
        </div>

        {/* Drag and Drop Zone */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/60 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-background"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
            <svg
              className="w-10 h-10 text-ink-muted/80 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm font-medium text-ink">
              Drag & drop a PDF here, or click to browse
            </p>
            <p className="text-xs text-ink-muted mt-1">PDF files only (max 10MB)</p>
          </div>
        ) : (
          /* File Preview */
          <div className="border border-border rounded-lg p-4 bg-background flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-red-50 text-red-600 p-2 rounded shrink-0">
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
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate max-w-[200px]" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-ink-muted">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 text-ink-muted hover:text-ink hover:bg-border rounded transition cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <ProgressBar percentage={progress} />
            <p className="text-xs text-ink-muted text-center font-medium animate-pulse">
              {processing
                ? "Processing text and generating vectors..."
                : `Uploading PDF... ${progress}%`}
            </p>
          </div>
        )}

        {error && (
          <div className="text-danger text-sm font-medium text-center">{error}</div>
        )}

        {/* Modal Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          {!uploading && (
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={uploading}
            disabled={!file || !title.trim() || uploading}
          >
            {processing ? "Finished" : "Upload"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default UploadModal;
