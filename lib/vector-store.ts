import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabase } from "./supabase";

// Initialize Gemini Embeddings (768 dimensions)
const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "text-embedding-004",
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

// Initialize Supabase Vector Store
export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "documents",
  // LangChain automatically uses these defaults:
  // pkey: "id",
  // vectorColumnName: "embedding",
  // contentColumnName: "content",
  // metadataColumnName: "metadata",
});