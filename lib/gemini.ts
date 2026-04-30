import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

/**
 * Get the embedding model instance.
 * Using gemini-embedding-001 which defaults to 3072 dimensions.
 */
export function getEmbeddingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  return new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    modelName: "gemini-embedding-001",
    // We removed outputDimensionality to allow the full 3072-dim high-res vector
  });
}

/**
 * Get the generative model instance (Gemini 1.5 Flash).
 * Used for the actual chat response generation.
 */
export function getGenerativeModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  return new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: "gemini-2.0-flash",
    temperature: 0.7,
  });
}

/**
 * TEST BLOCK: Run this with '.\node_modules\.bin\ts-node-esm lib/gemini.ts'
 * Verifies that the model is responding with the correct vector size.
 */
if (process.argv[1]?.endsWith("gemini.ts")) {
  (async () => {
    try {
      console.log("--- Starting Connection Test ---");
      const model = getEmbeddingModel();
      
      console.log("Requesting embedding from Gemini...");
      const res = await model.embedQuery("Hello Studybot");
      
      console.log("✅ Success!");
      console.log("Vector length:", res.length);
      console.log("Sample (first 3):", res.slice(0, 3));
      
      // Update check to 3072 to match your new Supabase schema
      if (res.length !== 3072) {
        console.warn(`⚠️ Warning: Expected 3072 dimensions, but got ${res.length}.`);
      } else {
        console.log("✨ Dimension match: 3072 verified.");
      }
    } catch (error) {
      console.error("❌ Test failed:");
      console.error(error);
    }
  })();
}

/**
 * EMERGENCY VERIFICATION BLOCK
 * Tests if Gemini and Supabase are talking to each other.
 */
export async function verifyRAG() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log("🔍 Testing RAG Flow...");
    const model = getEmbeddingModel();
    
    // Test with a generic query
    const testQuery = "What is this document about?";
    const embedding = await model.embedQuery(testQuery);

    console.log("📡 Querying Supabase match_documents...");
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.1, // Low threshold just to see if we get ANY data
      match_count: 3,
    });

    if (error) throw error;

    if (data && data.length > 0) {
      console.log(`✅ SUCCESS! Found ${data.length} relevant chunks.`);
      console.log("First Chunk Preview:", data[0].content.substring(0, 100));
    } else {
      console.log("⚠️ Connection works, but no matches found. Did you ingest the PDF yet?");
    }
  } catch (err) {
    console.error("❌ RAG Verification Failed:", err);
  }
}

// Automatically run if we execute this file directly
if (process.argv[1]?.endsWith("gemini.ts")) {
  verifyRAG();
}