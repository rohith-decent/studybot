import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { getEmbeddingModel } from '@/lib/gemini';

// Initialize Supabase with Service Role for backend access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { messages, mode } = await req.json();
    
    const coreMessages = messages.map((m: any) => {
      let textContent = m.content;
      if (!textContent && m.parts) {
        textContent = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n');
      }
      return { role: m.role, content: textContent || '' };
    });

    const lastMessage = coreMessages[coreMessages.length - 1].content;

    // 1. Get the 3072-dimension embedding using your verified model
    const embeddingModel = getEmbeddingModel();
    const queryEmbedding = await embeddingModel.embedQuery(lastMessage);

    // 2. Perform the Similarity Search
    const { data: chunks, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // We used 0.1 in tests, 0.3 is better for quality
      match_count: 5,
    });

    if (error) throw error;

    // 3. Prepare the Context
    const context = chunks
      ?.map((chunk: any) => chunk.content)
      .join("\n\n---\n\n") || "No relevant information found in the documents.";

    // 4. Construct the System Prompt based on Mode
    let systemPrompt = "";
    if (mode === 'Study') {
      systemPrompt = `You are a helpful AI Tutor. Use the following document context to explain concepts.
      
      CONTEXT:
      ${context}
      
      GOAL: Provide a clear summary of the answer. Then, at the very end, generate 3 study flashcards in this JSON format:
      { "flashcards": [{ "q": "Question", "a": "Answer" }] }`;
    } else {
      systemPrompt = `You are a strict Exam Proctor. Answer the user's question ONLY using the provided context. 
      If the answer is not in the context, say "I cannot find this in your study materials."
      
      CONTEXT:
      ${context}
      
      Strictly avoid using outside knowledge.`;
    }

    // 5. Stream the response back to your Frontend
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("RAG API Route Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}