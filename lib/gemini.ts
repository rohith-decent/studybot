import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Centralizes Google Gemini API configuration.
 * This module initializes the connection to Gemini for embedding generation.
 * Uses LangChain integrations for better composability.
 */


/**
 * Get the embedding model instance
 * Uses Gemini's embedding-001 model for generating 768-dimensional vectors
 */
export function getEmbeddingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    model: "embedding-001",
  });
}

/**
 * Get the generative model instance (for future use in chat/inference)
 * Uses Gemini 1.5 Flash for streaming responses
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
