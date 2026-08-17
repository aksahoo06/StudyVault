import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/api";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import EmptyState from "../../../components/EmptyState";
import Button from "../../../components/Button";

function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const exampleChips = [
    "What is the main topic of this document?",
    "List the key definitions in this note.",
    "Can you summarize the most important page?",
  ];

  // Fetch Chat History
  async function fetchHistory() {
    setIsLoadingHistory(true);
    setError("");
    try {
      const response = await api.get(`/chat?noteId=${id}`);
      const conv = response.data.conversations?.[0];
      if (conv) {
        setConversationId(conv._id);
        // Translate roles to local client view if needed, but they are already user/assistant
        setMessages(conv.messages || []);
      } else {
        setMessages([]);
        setConversationId(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load chat history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, [id]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // 1. Append user message immediately
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setError("");

    try {
      // 2. POST to chat endpoint
      const response = await api.post("/chat", {
        noteId: id,
        message: text,
      });

      // 3. Append assistant response + sources metadata
      const assistantMsg = {
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If this was the first message, conversationId will be created in the DB.
      // Re-fetch history silently to bind conversationId for deletions.
      if (!conversationId) {
        const historyRes = await api.get(`/chat?noteId=${id}`);
        const conv = historyRes.data.conversations?.[0];
        if (conv) {
          setConversationId(conv._id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong answering that. Please try again.");
      // Append error message from assistant
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong while processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!conversationId) return;
    if (!window.confirm("Are you sure you want to clear your conversation history?")) return;

    try {
      await api.delete(`/chat/${conversationId}`);
      setMessages([]);
      setConversationId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to clear chat history.");
    }
  };

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-190px)] bg-surface border border-border rounded-lg overflow-hidden shadow-xs relative">
      {/* Top Header Control for Clear Chat */}
      {messages.length > 0 && (
        <div className="bg-surface px-6 py-2.5 border-b border-border flex justify-end shrink-0">
          <Button
            variant="secondary"
            className="text-xs py-1 px-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleClearHistory}
            disabled={!conversationId}
          >
            Clear History
          </Button>
        </div>
      )}

      {/* Messages Scroll Panel */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg
              className="animate-spin h-8 w-8 text-primary mb-2"
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
            <p className="text-xs text-ink-muted">Loading history...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat Welcome State */
          <div className="flex flex-col justify-center h-full min-h-[300px]">
            <EmptyState
              icon={
                <svg
                  className="w-10 h-10 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              }
              title="Ask anything about this document"
              description="Ask specific questions, ask for definitions, or search concepts. Gemini will answer using RAG and attribute sources."
            />
            {/* Quick Prompt Chips */}
            <div className="max-w-md mx-auto w-full mt-6 px-4">
              <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2 text-center">
                Suggested Prompts:
              </p>
              <div className="flex flex-col gap-2">
                {exampleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="text-left text-xs bg-surface border border-border rounded px-4 py-2 hover:bg-neutral-50 text-ink transition cursor-pointer font-medium"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {/* Loading typing indicator for assistant response */}
            {isSending && (
              <ChatMessage
                message={{ role: "assistant", content: "" }}
                isTyping={true}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Message panel */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
    </div>
  );
}

export default Chat;
