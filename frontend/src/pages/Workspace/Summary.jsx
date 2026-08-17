import React, { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import api from "../../services/api";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import LoadingSkeleton from "../../components/LoadingSkeleton";

function Summary() {
  const { id } = useParams();
  const { note } = useOutletContext();
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load summary from localStorage if it exists
    const cached = localStorage.getItem(`summary_${id}`);
    if (cached) {
      setSummary(cached);
    }
  }, [id]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Use RAG chat endpoint to request a detailed summary of the PDF note
      const response = await api.post("/chat", {
        noteId: id,
        message: "Summarize this entire document in detail. Structure it with clear headers and bullet points. Focus on key terms.",
      });

      const generatedSummary = response.data.answer;
      setSummary(generatedSummary);
      localStorage.setItem(`summary_${id}`, generatedSummary);
    } catch (err) {
      console.error(err);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  // Zero-dependency simple Markdown-like parser for structured UI display
  const renderSummaryContent = (text) => {
    if (!text) return null;

    const lines = text.split("\n");
    let inList = false;
    const elements = [];

    // Helper to format bold text (**text**)
    const formatBold = (str) => {
      const parts = str.split(/\*\*([^*]+)\*\*/g);
      return parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-ink">
            {part}
          </strong>
        ) : (
          part
        )
      );
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith("# ")) {
        inList = false;
        elements.push(
          <h2 key={idx} className="text-xl font-bold text-ink mt-6 mb-3 border-b border-border pb-1">
            {formatBold(trimmed.substring(2))}
          </h2>
        );
      }
      // Heading 2
      else if (trimmed.startsWith("## ")) {
        inList = false;
        elements.push(
          <h3 key={idx} className="text-lg font-bold text-ink mt-5 mb-2.5">
            {formatBold(trimmed.substring(3))}
          </h3>
        );
      }
      // Heading 3
      else if (trimmed.startsWith("### ")) {
        inList = false;
        elements.push(
          <h4 key={idx} className="text-base font-bold text-ink mt-4 mb-2">
            {formatBold(trimmed.substring(4))}
          </h4>
        );
      }
      // Bullet list items
      else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        elements.push(
          <li key={idx} className="list-disc pl-5 ml-4 text-sm leading-relaxed text-ink mb-1.5">
            {formatBold(trimmed.substring(2))}
          </li>
        );
      }
      // Numbered list items
      else if (/^\d+\.\s/.test(trimmed)) {
        inList = true;
        const textContent = trimmed.replace(/^\d+\.\s/, "");
        elements.push(
          <li key={idx} className="list-decimal pl-5 ml-4 text-sm leading-relaxed text-ink mb-1.5">
            {formatBold(textContent)}
          </li>
        );
      }
      // Empty lines
      else if (trimmed === "") {
        inList = false;
        elements.push(<div key={idx} className="h-2" />);
      }
      // Regular paragraphs
      else {
        inList = false;
        elements.push(
          <p key={idx} className="text-sm sm:text-base leading-relaxed text-ink mb-3.5">
            {formatBold(trimmed)}
          </p>
        );
      }
    });

    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Top Header controls when summary is loaded */}
      {summary && !isLoading && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-ink">AI Summary</h2>
          <Button
            variant="secondary"
            className="text-xs py-1 px-3"
            onClick={handleRegenerate}
          >
            Regenerate Summary
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg flex items-center justify-between mb-6">
          <span className="text-sm font-medium">{error}</span>
          <Button variant="secondary" className="py-1 px-3 text-xs" onClick={handleGenerate}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="line" count={12} />
          <p className="text-xs text-ink-muted text-center animate-pulse pt-4">
            Generating summary using document context...
          </p>
        </div>
      ) : !summary ? (
        /* Empty State */
        <EmptyState
          icon={
            <svg
              className="w-12 h-12 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="No summary generated yet"
          description="Read a quick, clean summary of your study note. We will extract key headings and formulas automatically."
          actionLabel="Generate Summary"
          onAction={handleGenerate}
        />
      ) : (
        /* Summary Content Column */
        <article className="bg-surface border border-border rounded-lg p-6 sm:p-8 shadow-xs">
          {renderSummaryContent(summary)}
        </article>
      )}
    </div>
  );
}

export default Summary;
