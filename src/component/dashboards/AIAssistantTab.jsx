import React, { useRef, useState, useEffect } from "react";
import { FaPaperclip, FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";

const initialMessages = [
  { sender: "ai", text: "Hello! How can I assist you today?" },
];

const AIAssistantTab = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && !file) return;
    const newMsg = { sender: "user", text: input, file };
    setMessages([...messages, newMsg]);
    setInput("");
    setFile(null);
    // Simulate AI response
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        { sender: "ai", text: "This is a generated response." },
      ]);
    }, 1000);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="flex flex-col h-[70vh] sm:h-[80vh] max-h-[80vh] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm text-base whitespace-pre-line break-words ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-900 rounded-bl-none"
              }`}
            >
              <div className="flex items-center gap-2">
                {msg.sender === "ai" && (
                  <FaRobot className="text-xl text-blue-400" />
                )}
                {msg.sender === "user" && (
                  <FaUser className="text-xl text-white" />
                )}
                <span>{msg.text}</span>
              </div>
              {msg.file && (
                <div className="mt-2 text-xs text-gray-700 bg-gray-100 rounded p-2">
                  <FaPaperclip className="inline mr-1 text-gray-500" />
                  {msg.file.name}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {/* Prompt Input */}
      <form
        className="flex items-center gap-2 p-4 border-t bg-white"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <label className="flex items-center cursor-pointer">
          <FaPaperclip className="text-xl text-gray-500 hover:text-blue-500" />
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
          placeholder="Type your prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          Generate <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default AIAssistantTab;
