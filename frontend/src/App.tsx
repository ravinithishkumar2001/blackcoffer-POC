// frontend/src/App.tsx
import React, { useState } from "react";
import axios from "axios";
import "./App.css";

type Role = "user" | "assistant";

interface ChatMessage {
  role: Role;
  content: string;
}

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const newMessages: ChatMessage[] = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post<{ messages: ChatMessage[] }>(
        `${API_BASE}/api/chat`,
        { messages: newMessages },
        { headers: { "Content-Type": "application/json" } }
      );

      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Error contacting backend. Check console/logs.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <h1 className="title">LangGraph Research Assistant</h1>

        <div className="messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`message-bubble ${m.role === "user" ? "user" : "assistant"}`}
            >
              <div className="message-role">
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="message-content">{m.content}</div>
            </div>
          ))}
          {loading && <div className="status">Thinking...</div>}
        </div>

        <div className="input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a research question about LangGraph, Ollama, RAG..."
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
