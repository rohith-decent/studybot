import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Centralizes Google Gemini API configuration.
 * This module initializes the connection to Gemini for embedding generation.
 */

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get the embedding model instance
 * Uses Gemini's embedding-001 model for generating 768-dimensional vectors
 */
export function getEmbeddingModel() {
  return genAI.getGenerativeModel({ model: "embedding-001" });
}

/**
 * Get the generative model instance (for future use in chat/inference)
 * Uses Gemini 1.5 Flash for streaming responses
 */
export function getGenerativeModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export default genAI;
