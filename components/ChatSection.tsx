import { Send, User, Bot, Loader2, Download } from 'lucide-react';
import { type UIMessage as Message } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';

interface ChatSectionProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: any) => void;
  handleSubmit: (e: any) => void;
  isLoading: boolean;
  mode: 'Study' | 'Exam';
}

function getMessageText(message: Message): string {
  if ('content' in message) return (message as any).content;
  if (!message.parts) return '';
  return message.parts
    .filter((p: any) => p.type === 'text')
    .map((p: any) => p.text)
    .join('\n');
}

function renderMessageContent(content: string) {
  // Check if there is a JSON block for flashcards (with or without markdown ticks)
  const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/) || content.match(/({[\s\S]*"flashcards"[\s\S]*})/);
  
  let textPart = content;
  let flashcards = null;

  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.flashcards) {
        flashcards = parsed.flashcards;
        textPart = content.replace(jsonMatch[0], '');
      }
    } catch (e) {
      // Ignore parse errors, it just means it wasn't valid JSON
    }
  }

  return (
    <div className="space-y-4">
      {textPart.trim() && <div className="whitespace-pre-wrap">{textPart.trim()}</div>}
      
      {flashcards && Array.isArray(flashcards) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-2">
          <div className="col-span-full">
            <span className="font-bold text-[10px] uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">Study Flashcards Generated</span>
          </div>
          {flashcards.map((fc: any, i: number) => (
            <div key={i} className="bg-white border border-indigo-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400 group-hover:bg-indigo-500 transition-colors"></div>
              <p className="font-semibold text-gray-800 text-sm mb-2">{fc.q}</p>
              <div className="h-px bg-gray-100 w-full mb-2"></div>
              <p className="text-gray-600 text-sm">{fc.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatSection({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading, 
  mode 
}: ChatSectionProps) {
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Info */}
      <div className="px-6 py-4 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Session Chat</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            {mode === 'Study' ? 'Mode: Comprehensive Learning' : 'Mode: Strict Exam Testing'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider animate-pulse bg-indigo-50 px-3 py-1.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
            </div>
          )}
          <button className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors border border-gray-200 px-3 py-2 rounded-lg bg-white hover:bg-indigo-50 hover:border-indigo-200 shadow-sm">
            <Download className="w-4 h-4" /> Download Summary
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/50"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-500">
            <div className={`p-5 rounded-2xl shadow-sm ${mode === 'Study' ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100'}`}>
              <Bot className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl tracking-tight">I'm ready to help!</h3>
              <p className="text-gray-500 max-w-sm mx-auto text-sm mt-2 leading-relaxed">
                {mode === 'Study' 
                  ? "Ask me anything about your document and I'll summarize it and even create flashcards for you." 
                  : "Ask a question and I'll test your knowledge based strictly on the source material."}
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const contentText = getMessageText(m);
          
          return (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              {m.role !== 'user' && (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ring-1 ${mode === 'Study' ? 'bg-indigo-600 ring-indigo-700' : 'bg-red-600 ring-red-700'}`}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm ring-1 ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none ring-indigo-700/50' 
                  : 'bg-white text-gray-800 rounded-tl-none ring-gray-200'
              }`}>
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{contentText}</div>
                ) : (
                  renderMessageContent(contentText)
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ring-1 ring-gray-200">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Bar */}
      <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-center">
          <input
            className="w-full pl-6 pr-16 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all text-[15px] shadow-inner placeholder-gray-400"
            value={input}
            placeholder={mode === 'Study' ? "Ask a study question..." : "Take the exam..."}
            onChange={handleInputChange}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-[0.2em] font-semibold">
          Powered by Gemini 1.5 Flash • Vector Search Enabled
        </p>
      </div>
    </div>
  );
}