import React from "react";
import Button from "../../../components/Button";

function Flashcard({ card, isFlipped, onToggleFlip }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-8 shadow-xs min-h-[220px] flex flex-col justify-between items-center text-center">
      {/* Question section */}
      <div className="w-full flex-grow flex flex-col justify-center">
        <span className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">
          Question
        </span>
        <p className="text-base sm:text-lg font-semibold text-ink leading-relaxed break-words">
          {card.question}
        </p>
      </div>

      {/* Flip action or revealed answer */}
      <div className="w-full border-t border-border/50 pt-5 mt-5 flex flex-col items-center">
        {!isFlipped ? (
          <Button
            variant="secondary"
            className="text-xs py-1.5 px-4"
            onClick={onToggleFlip}
          >
            Show Answer
          </Button>
        ) : (
          <div className="w-full animate-fade-in">
            <span className="text-[10px] font-bold text-success uppercase tracking-wider block mb-2">
              Answer
            </span>
            <p className="text-sm sm:text-base text-ink leading-relaxed break-words font-medium">
              {card.answer}
            </p>
            <button
              onClick={onToggleFlip}
              className="text-xs text-ink-muted hover:text-ink underline mt-4 cursor-pointer focus:outline-none"
            >
              Hide Answer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Flashcard;
