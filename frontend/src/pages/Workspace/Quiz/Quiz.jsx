import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import QuizQuestion from "./QuizQuestion";
import ProgressBar from "../../../components/ProgressBar";
import Button from "../../../components/Button";
import EmptyState from "../../../components/EmptyState";

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // Indexed by question index
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const fetchOrGenerateQuiz = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.post(`/ai/test/${id}`);
      const test = response.data.test;
      if (test && test.questions && test.questions.length > 0) {
        setQuestions(test.questions);
        localStorage.setItem(`quiz_${id}`, JSON.stringify(test.questions));
      } else {
        throw new Error("No quiz questions generated.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to build quiz test. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem(`quiz_${id}`);
    if (cached) {
      try {
        setQuestions(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse cached quiz:", err);
      }
    }
  }, [id]);

  const handleSelectOption = (option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
  };

  // Compute final test score
  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    return score;
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
          Reviewing document content & building multiple-choice quiz...
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
        <Button variant="primary" onClick={fetchOrGenerateQuiz}>
          Try Again
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
          title="Create Practice Quiz"
          description="Test your understanding with 5 multiple-choice questions dynamically generated from your note."
          actionLabel="Generate Quiz"
          onAction={fetchOrGenerateQuiz}
        />
      </div>
    );
  }

  if (isFinished) {
    const score = calculateScore();
    const isPassing = score >= questions.length / 2;

    return (
      <div className="max-w-lg mx-auto w-full bg-surface border border-border rounded-xl p-8 shadow-xs space-y-8">
        {/* Score Banner Header */}
        <div className="text-center">
          <div
            className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg ${
              isPassing
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {score}/{questions.length}
          </div>
          <h2 className="text-xl font-bold text-ink">Quiz Completed</h2>
          <p className="text-sm text-ink-muted mt-1">
            You scored {((score / questions.length) * 100).toFixed(0)}% on this quiz test.
          </p>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-1">
            Question Review
          </h3>
          <div className="space-y-3 divide-y divide-border">
            {questions.map((q, idx) => {
              const selected = selectedAnswers[idx];
              const isCorrect = selected === q.correctAnswer;

              return (
                <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink leading-tight">{q.question}</p>
                    <p className="text-xs text-ink-muted mt-1 leading-normal">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-success font-medium" : "text-danger font-medium"}>
                        {selected}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-success mt-0.5 leading-normal">
                        Correct answer: {q.correctAnswer}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0">
                    {isCorrect ? (
                      <span className="text-success font-bold text-base">✓</span>
                    ) : (
                      <span className="text-danger font-bold text-base">✗</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions panel */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1 py-2 text-xs" onClick={handleRestart}>
            Retake Quiz
          </Button>
          <Button variant="primary" className="flex-1 py-2 text-xs" onClick={() => navigate("/library")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOption = selectedAnswers[currentIndex] ?? null;
  const hasSelected = selectedOption !== null;

  return (
    <div className="max-w-lg mx-auto w-full space-y-6">
      {/* Quiz progress display */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-ink-muted">
          <span>Practice Test</span>
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </div>

      {/* Active Question Box */}
      <QuizQuestion
        question={currentQuestion}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
      />

      {/* Next Trigger panel */}
      {hasSelected && (
        <div className="flex justify-end animate-fade-in pt-2">
          <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto py-2 px-6">
            {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default Quiz;
