import React, { useState, useEffect, useRef } from "react";

function LiveChat({ classroomId, socket, currentUser, initialMessages = [], teacherUserId = null }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Sync initial messages if prop changes
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket listener for real-time incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket]);

  // Send message handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !classroomId) return;

    socket.emit("send-message", { classroomId, text: text.trim() }, (res) => {
      if (res && !res.success) {
        console.error("Failed to send message:", res.message);
      }
    });

    setText("");
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 4.418 9 8z" />
          </svg>
          <span className="font-semibold text-ink text-sm">Classroom Live Chat</span>
        </div>
        <span className="text-xs text-ink-muted bg-background px-2.5 py-1 rounded-full border border-border">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Messages List Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[250px] max-h-[450px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink">No messages yet</p>
            <p className="text-xs text-ink-muted">Start the conversation with your class!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSelf = currentUser && (msg.senderId === currentUser._id || msg.senderId?._id === currentUser._id);
            const isTeacherSender = teacherUserId && (msg.senderId === teacherUserId || msg.senderId?._id === teacherUserId);

            return (
              <div
                key={msg._id || idx}
                className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-semibold text-ink leading-none">
                    {isSelf ? "You" : msg.senderName}
                  </span>
                  {isTeacherSender && (
                    <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Teacher
                    </span>
                  )}
                  <span className="text-[10px] text-ink-muted leading-none">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-sm break-words shadow-xs ${
                    isSelf
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-background text-ink border border-border rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-surface border-t border-border flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3.5 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-ink"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span>Send</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default LiveChat;
