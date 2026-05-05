import { useState, useRef, useEffect, useContext } from "react";
import ReactMarkdown from "react-markdown";
import { apiContext } from "../ApiContext";
import aiLogo from "./ai_logo-removebg-preview.png";
import "./AIChatbot.css";

export function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const { accessToken, api } = useContext(apiContext); // ✅ cleaned

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage = {
      role: "user",
      content: inputValue,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);
    setError("");

    try {
      const messagesForAI = updatedMessages.map((msg) => ({
        role: msg.role,
        content: String(msg.content || ""),
      }));

      const response = await api.post(
        "ai/chat",
        { messages: messagesForAI },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("AI response:", response.data);

      if (response.data.success) {
        const aiMessage = {
          role: "assistant",
          content: String(response.data.message || ""), // ✅ safe string
        };

        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setError(response.data.error || "Failed to get response from AI");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
    setInputValue("");
  };

  return (
    <>
      {!open && (
        <button
          className="ai-chat-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open AI chat"
        >
          <img src={aiLogo} alt="AI logo" className="ai-chat-launcher-logo" />
        </button>
      )}

      {open && (
        <div className="ai-chat-floating-window">
          <div className="ai-chatbot-container">
            {/* Header */}
            <div className="ai-chatbot-header">
              <div className="ai-chatbot-logo-title">
                <img src={aiLogo} alt="AI logo" className="ai-chatbot-logo" />
                <div>
                  <h2>AI Assistant</h2>
                  <p className="ai-chatbot-tag">Tap to chat anytime</p>
                </div>
              </div>

              <div className="ai-chatbot-header-actions">
                {messages.length > 0 && (
                  <button onClick={clearChat} className="clear-btn">
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="ai-chat-close-btn"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="ai-chatbot-messages">
              {messages.length === 0 && (
                <div className="ai-chatbot-welcome">
                  <p>Welcome! Start chatting with the AI assistant.</p>
                  <p className="ai-chatbot-subtitle">
                    Ask me anything and I'll help!
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`ai-message ${
                    message.role === "user"
                      ? "user-message"
                      : "ai-message-content"
                  }`}
                >
                  <div className="message-bubble">
                    {message.role === "user" ? (
                      <p>{String(message.content)}</p>
                    ) : (
                      <div className="markdown-content">
                        {message.content ? (
                          <ReactMarkdown>
                            {String(message.content)}
                          </ReactMarkdown>
                        ) : (
                          <p>...</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="ai-message ai-message-content">
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="ai-error-message">
                  <p>Error: {error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="ai-chatbot-form">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="ai-chatbot-input"
              />

              <button type="submit" disabled={loading} className="ai-send-btn">
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}