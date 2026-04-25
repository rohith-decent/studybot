import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

/**
 * Get the embedding model instance.
 * Configured to 768 dimensions to match the Supabase 'vector(768)' column.
 */
export function getEmbeddingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  return new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    modelName: "gemini-embedding-001",
    // Option B: Specifically request 768 dimensions to fit your SQL schema
    outputDimensionality: 768,
  });
}

/**
 * Get the generative model instance (Gemini 1.5 Flash).
 */
export function getGenerativeModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  return new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: "gemini-1.5-flash",
    temperature: 0.7,
  });
}

/**
 * TEST BLOCK: Run this with '.\node_modules\.bin\ts-node-esm lib/gemini.ts'
 * This only executes when the file is run directly.
 */
if (process.argv[1]?.endsWith("gemini.ts")) {
  (async () => {
    try {
      console.log("--- Starting Connection Test ---");
      const model = getEmbeddingModel();
      
      console.log("Requesting 768-dim embedding from Gemini...");
      const res = await model.embedQuery("Hello Studybot");
      
      console.log("✅ Success!");
      console.log("Vector length:", res.length);
      console.log("Sample (first 3):", res.slice(0, 3));
      
      if (res.length !== 768) {
        console.warn(`⚠️ Warning: Expected 768 dimensions, got ${res.length}. Check outputDimensionality setting.`);
      }
    } catch (error) {
      console.error("❌ Test failed:");
      console.error(error);
    }
  })();
}