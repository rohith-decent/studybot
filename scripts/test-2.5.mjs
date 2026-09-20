import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testGenerative() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    console.log("Testing Generative Model: gemini-2.5-flash");
    const result = await model.generateContent("Hello, respond with '2.5-flash verified' if you are working.");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("Error invoking model:", error);
  }
}

testGenerative();
