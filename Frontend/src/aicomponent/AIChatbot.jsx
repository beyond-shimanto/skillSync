import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { apiContext } from "../ApiContext";
import "./AIChatbot.css";

export function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const { accessToken } = useContext(apiContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    // Add user message to chat
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
      // Prepare messages in the format the backend expects
      const messagesForAI = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await axios.post(
        "http://localhost:5000/ai/chat",
        { messages: messagesForAI },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const aiMessage = {
          role: "assistant",
          content: response.data.message,
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
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
    <div className="ai-chatbot-container">
      <div className="ai-chatbot-header">
        <h2>AI Chatbot Assistant</h2>
        {messages.length > 0 && (
          <button onClick={clearChat} className="clear-btn">
            Clear Chat
          </button>
        )}
      </div>

      <div className="ai-chatbot-messages">
        {messages.length === 0 && (
          <div className="ai-chatbot-welcome">
            <p>Welcome! Start chatting with the AI assistant.</p>
            <p className="ai-chatbot-subtitle">
              Ask me anything and I'll do my best to help!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-message ${
              message.role === "user" ? "user-message" : "ai-message-content"
            }`}
          >
            <div className="message-bubble">
              <p>{message.content}</p>
            </div>
          </div>
        ))}

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

        {error && (
          <div className="ai-error-message">
            <p>Error: {error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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
  );
}
