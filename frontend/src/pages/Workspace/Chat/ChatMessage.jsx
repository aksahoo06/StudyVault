import React from "react";

function ChatMessage({ message, isTyping = false }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className="flex gap-2.5 max-w-[85%] items-start">
        {/* Left AI Badge for Assistant */}
        {!isUser && (
          <div className="bg-accent/15 text-accent text-xs font-extrabold h-7 w-7 rounded-full flex items-center justify-center shrink-0 border border-accent/25 shadow-xs">
            AI
          </div>
        )}

        <div
          className={`rounded-lg px-4 py-2.5 text-sm shadow-2xs leading-relaxed ${
            isUser
              ? "bg-primary text-white"
              : "bg-surface border border-border text-ink"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1 py-1">
              <span className="w-2.5 h-2.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2.5 h-2.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2.5 h-2.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Sources List block */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                Sources:
              </span>
              {message.sources.map((src, index) => (
                <span
                  key={index}
                  className="bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold px-2 py-0.5 rounded-sm"
                  title={`Source score: ${(src.score * 100).toFixed(0)}%`}
                >
                  Page {src.pageNumber || "Unknown"}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
