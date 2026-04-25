import { FileText, Upload, GraduationCap, Sword, Settings, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  mode: 'Study' | 'Exam';
  setMode: (mode: 'Study' | 'Exam') => void;
  files: string[];
  setFiles: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function Sidebar({ mode, setMode, files, setFiles }: SidebarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
      
      setFiles((prev) => [...prev, file.name]);
    } catch (error: any) {
      console.error(error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-gray-900">StudyBot</h1>
      </div>

      {/* Mode Toggle */}
      <div className="mb-8">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
          Learning Mode
        </label>
        <div className="mt-3 p-1.5 bg-gray-100/80 rounded-xl flex gap-1 shadow-inner">
          <button 
            onClick={() => setMode('Study')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'Study' ? 'bg-white shadow text-indigo-600 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <GraduationCap className="w-4 h-4" /> Study
          </button>
          <button 
            onClick={() => setMode('Exam')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'Exam' ? 'bg-white shadow text-red-600 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <Sword className="w-4 h-4" /> Exam
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="flex-1 overflow-y-auto">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
          Your Sources
        </label>
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50/60 text-indigo-700 rounded-xl text-sm border border-indigo-100/50 shadow-sm">
              <FileText className="w-4 h-4 flex-shrink-0 opacity-70" />
              <span className="truncate font-medium">{file}</span>
            </div>
          ))}
          
          <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl mt-4 ${isUploading ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50 hover:border-indigo-300'} transition-all`}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-indigo-500 mb-2 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
            )}
            <span className="text-xs font-medium text-gray-500">
              {isUploading ? 'Processing Document...' : 'Upload PDF'}
            </span>
            <input type="file" className="hidden" accept=".pdf" onChange={handleUpload} disabled={isUploading} />
          </label>
          
          {uploadError && (
            <p className="text-xs font-medium text-red-500 text-center mt-2 px-1 bg-red-50 py-2 rounded-lg border border-red-100">{uploadError}</p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 mt-4">
        <button className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors w-full font-medium text-sm">
          <Settings className="w-5 h-5 opacity-70" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}