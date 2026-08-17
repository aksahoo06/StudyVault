import React, { useState } from "react";

function ChatInput({ onSendMessage, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-surface p-4 flex gap-2">
      <input
        type="text"
        placeholder="Ask a question about this document..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        className="flex-grow border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer"
        aria-label="Send message"
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
            d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
          />
        </svg>
      </button>
    </form>
  );
}

export default ChatInput;
