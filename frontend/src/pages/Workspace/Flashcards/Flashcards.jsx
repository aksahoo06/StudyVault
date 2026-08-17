import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import Flashcard from "./Flashcard";
import ProgressBar from "../../../components/ProgressBar";
import Button from "../../../components/Button";
import EmptyState from "../../../components/EmptyState";

function Flashcards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  // Try to load existing or generate new on first access
  const fetchOrGenerateFlashcards = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.post(`/ai/flashcards/${id}`);
      const set = response.data.flashcardSet;
      if (set && set.cards && set.cards.length > 0) {
        setCards(set.cards);
        localStorage.setItem(`flashcards_${id}`, JSON.stringify(set.cards));
      } else {
        throw new Error("No flashcards returned.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to build flashcards. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem(`flashcards_${id}`);
    if (cached) {
      try {
        setCards(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse cached flashcards:", err);
      }
    }
  }, [id]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto w-full text-center py-16 flex flex-col items-center justify-center">
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
          Analyzing note contents & building flashcards...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto w-full text-center py-12">
        <div className="bg-red-50 border border-red-200 text-danger p-4 rounded-lg mb-6">
          <p className="text-sm font-medium">{error}</p>
        </div>
        <Button variant="primary" onClick={fetchOrGenerateFlashcards}>
          Try Again
        </Button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto w-full">
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
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          }
          title="Create Recall Flashcards"
          description="Let AI generate 10 customized Q&A study cards from your document to practice active recall."
          actionLabel="Generate Flashcards"
          onAction={fetchOrGenerateFlashcards}
        />
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-lg mx-auto w-full text-center bg-surface border border-border rounded-xl p-8 shadow-xs">
        <div className="bg-teal-50 text-accent h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Workspace Complete</h2>
        <p className="text-sm text-ink-muted mb-8 leading-relaxed">
          You've reviewed all {cards.length} flashcards for this document note. Great job!
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={handleRestart}>
            Review Again
          </Button>
          <Button variant="primary" onClick={() => navigate("/library")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-lg mx-auto w-full space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-ink-muted">
          <span>Flashcard Review</span>
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
        </div>
        <ProgressBar current={currentIndex + 1} total={cards.length} />
      </div>

      {/* Card Body */}
      <Flashcard
        card={currentCard}
        isFlipped={isFlipped}
        onToggleFlip={() => setIsFlipped(!isFlipped)}
      />

      {/* Card Navigation Controls */}
      <div className="flex justify-between gap-4 pt-2">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1 py-2 text-xs"
        >
          ← Previous
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          className="flex-1 py-2 text-xs font-semibold"
        >
          {currentIndex === cards.length - 1 ? "Finish" : "Next →"}
        </Button>
      </div>
    </div>
  );
}

export default Flashcards;
