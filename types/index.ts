/**
 * Type definitions for the StudyBot application
 */

export interface DocumentMetadata {
  filename: string;
  pageNumber: number;
  chunkIndex: number;
  totalChunks: number;
  uploadedAt?: string;
}

export interface Document {
  id: string;
  content: string;
  embedding: number[];
  metadata: DocumentMetadata;
  created_at?: string;
}

export interface IngestionResponse {
  success: boolean;
  filename: string;
  chunksCreated: number;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface StudyMode {
  mode: "study" | "exam";
}
