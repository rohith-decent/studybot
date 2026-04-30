import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Fetching models...");
    // The listModels method is on the genAI instance in some versions, 
    // or you might need to use the rest API.
    // For simplicity, let's try to just check one model specifically.
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error);
    } else {
      console.log("Available Models:");
      data.models.forEach(m => console.log(`- ${m.name}`));
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

listModels();
