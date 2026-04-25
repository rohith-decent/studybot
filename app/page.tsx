"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Send, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface UploadedFile {
  name: string;
  chunks: number;
  uploadedAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatus({
        type: "error",
        message: "Please select a PDF file",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadStatus({
          type: "error",
          message: data.error || "Upload failed",
        });
      } else {
        setUploadStatus({
          type: "success",
          message: `Uploaded ${file.name} with ${data.chunksCreated} chunks`,
        });
        setUploadedFiles([
          ...uploadedFiles,
          {
            name: file.name,
            chunks: data.chunksCreated,
            uploadedAt: new Date().toLocaleString(),
          },
        ]);

        // Add system message to chat
        setMessages([
          ...messages,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Successfully uploaded and processed "${file.name}" with ${data.chunksCreated} chunks. You can now ask questions about this document!`,
          },
        ]);
      }
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // TODO: Connect to chat API endpoint in Step 3
    // For now, show a placeholder response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "This feature will be connected in Step 3 (The RAG API Route). For now, this is a placeholder response.",
        },
      ]);
    }, 500);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">StudyBot</h1>
          <p className="text-xs text-gray-500 mt-1">AI Study Assistant</p>
        </div>

        {/* Upload Section */}
        <div className="p-4 border-b border-gray-200">
          <label className="flex flex-col">
            <span className="mb-2 text-sm font-semibold text-gray-700">
              Upload Source
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Upload size={18} />
              {isUploading ? "Uploading..." : "Upload PDF"}
            </button>
          </label>
        </div>

        {/* Status Messages */}
        {uploadStatus.type && (
          <div
            className={`m-4 p-3 rounded-lg flex gap-2 items-start ${uploadStatus.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            {uploadStatus.type === "success" ? (
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm">{uploadStatus.message}</span>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Uploaded Files
            </h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-gray-100 rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-600" />
                    <span className="font-medium truncate">{file.name}</span>
                  </div>
                  <div className="text-gray-600">
                    {file.chunks} chunks • {file.uploadedAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          <p className="text-sm text-gray-500">
            {uploadedFiles.length === 0
              ? "Upload a PDF to get started"
              : `${uploadedFiles.length} file(s) loaded`}
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm">
                  Upload a PDF file to get started, then ask questions about it.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ Chat feature will be connected in Step 3. For now, you can test the PDF upload functionality.
          </p>
        </div>
      </main>
    </div>
  );
}
