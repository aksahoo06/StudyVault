import React from "react";

function QuizQuestion({ question, selectedOption, onSelectOption }) {
  const hasSelected = selectedOption !== null;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Question header */}
      <div>
        <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
          Multiple Choice Question
        </span>
        <h3 className="text-base sm:text-lg font-semibold text-ink leading-relaxed break-words">
          {question.question}
        </h3>
      </div>

      {/* Stacked Options */}
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === question.correctAnswer;
          const isWrongSelected = isSelected && !isCorrect;

          let btnClass =
            "w-full text-left px-4 py-3 border rounded text-sm transition duration-150 flex items-center justify-between font-medium cursor-pointer focus:outline-none";

          if (!hasSelected) {
            // Default hover styles when selectable
            btnClass +=
              " border-border hover:bg-background hover:border-ink-muted text-ink bg-surface";
          } else {
            // Evaluated colors once selected
            if (isCorrect) {
              btnClass += " border-success bg-green-50 text-green-800";
            } else if (isWrongSelected) {
              btnClass += " border-danger bg-red-50 text-red-800";
            } else {
              btnClass += " border-border opacity-60 text-ink bg-surface cursor-not-allowed";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => !hasSelected && onSelectOption(option)}
              disabled={hasSelected}
              className={btnClass}
            >
              <span className="break-words max-w-[90%]">{option}</span>

              {/* Status Icons */}
              {hasSelected && (
                <span className="shrink-0 ml-2">
                  {isCorrect && (
                    <svg
                      className="w-5 h-5 text-success"
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
                  )}
                  {isWrongSelected && (
                    <svg
                      className="w-5 h-5 text-danger"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuizQuestion;
