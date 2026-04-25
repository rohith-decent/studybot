"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import Sidebar from "@/components/Sidebar";
import ChatSection from "@/components/ChatSection";

export default function Home() {
  const [mode, setMode] = useState<'Study' | 'Exam'>('Study');
  const [files, setFiles] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input }, { body: { mode } });
    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        mode={mode} 
        setMode={setMode} 
        files={files} 
        setFiles={setFiles} 
      />
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <ChatSection 
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          mode={mode}
        />
      </main>
    </div>
  );
}
