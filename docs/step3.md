# Step 3: The RAG API Route (The Logic)

## Overview
This step focuses on creating the "Brain" of the StudyBot application. We will build a Next.js API route that utilizes **Retrieval-Augmented Generation (RAG)**. 
RAG is a technique where an AI model is provided with context retrieved from a database (our Supabase vector store) before it generates an answer. This ensures the AI answers based *only* on the uploaded documents, reducing hallucinations and making it highly specific to the user's study material.

**Goal:** Create a backend endpoint (`app/api/chat/route.ts`) that answers questions based on the stored data.

---

## The Workflow of the RAG API

When a user asks a question in the chat interface, the following sequence of events occurs in our API route:

1. **Receive the Request:** The API route receives a POST request containing the user's chat history (`messages`) and the current application mode (`Study` or `Exam`).
2. **Extract the Query:** We isolate the user's latest message to understand what they are asking.
3. **Generate an Embedding:** We convert the user's query into a mathematical vector (embedding) using the Gemini embedding model. This vector represents the semantic meaning of the question.
4. **Similarity Search (Retrieval):** We take this query vector and send it to our Supabase database. Supabase uses the `pgvector` extension to compare this vector against all the document chunk vectors we saved in Step 2. It returns the top most relevant text chunks.
5. **Construct the Prompt (Augmentation):** We build a comprehensive system prompt for the Gemini 1.5 Flash model (or similar fast model). This prompt includes:
   - Instructions based on the current `mode` (e.g., summarize and create flashcards, or strictly answer the question).
   - The relevant context retrieved from Supabase.
6. **Generate the Response (Generation):** We send the constructed prompt to the Gemini model.
7. **Stream the Output:** Instead of waiting for the entire response to generate, we use the Vercel AI SDK to stream the words back to the frontend in real-time, providing a ChatGPT-like typing experience.

---

## Step-by-Step Implementation Details

### 1. Set Up the API Route Structure
In Next.js App Router, API routes are defined in `route.ts` files within the `app/api` directory.
- **Action:** Create the file `app/api/chat/route.ts`.
- **Purpose:** This file will export a `POST` function to handle incoming chat requests.

### 2. Parse the Incoming Request
We need to extract the variables sent from the frontend.
- **Action:** Read the JSON body of the request to get the `messages` array and the `mode`.
- **Knowledge:** The Vercel AI SDK expects the `messages` array in a specific format (`{ role: 'user' | 'assistant', content: string }`).

### 3. Generate the Query Embedding
Before we can search our database, we need to convert the user's text query into a vector.
- **Action:** Call the embedding model (e.g., `text-embedding-004`) with the user's query.
- **Knowledge:** The embedding model must be the exact same model used during Step 2 (Ingestion) so the vectors are in the same semantic space.

### 4. Query Supabase for Context
We need to find the chunks of text in our database that are most similar to the user's query.
- **Action:** Use the Supabase client to call the RPC (Remote Procedure Call) function we created in Step 1 (e.g., `match_documents`). Pass the query embedding and a similarity threshold/limit.
- **Knowledge:** `match_documents` will perform a cosine similarity search and return the matching document chunks. We will concatenate the text from these chunks to form our `context`.

### 5. Construct the Mode-Specific System Prompt
The behavior of the AI changes based on the selected mode.
- **Study Mode Prompt:** Instruct the AI to act as a helpful tutor. Ask it to provide a comprehensive summary of the topic based on the context, and optionally, generate study flashcards (Questions and Answers) formatted as a JSON block.
- **Exam Mode Prompt:** Instruct the AI to act as a strict examiner. It must answer the user's query *exclusively* using the provided context. If the answer isn't in the context, it should state that it doesn't know.

### 6. Stream the Response using Vercel AI SDK
To provide a fast and interactive user experience, we stream the response.
- **Action:** Use the Vercel AI SDK's `streamText` function along with the `@ai-sdk/google` provider.
- **Knowledge:** Pass the system prompt (containing the context) and the user's messages to the model. Return the result using `result.toDataStreamResponse()`. This connects the backend streaming directly to the frontend's `useChat` hook.

---

## Required Dependencies
To build this step, you will need the following npm packages installed:
* `@ai-sdk/google`: The Vercel AI SDK provider for Google Gemini.
* `ai`: The core Vercel AI SDK for streaming and chat interfaces.
* `@supabase/supabase-js`: The Supabase client for database interactions.

## Security Considerations
* **Never expose your API keys to the frontend.** Ensure that your Supabase Service Role Key and Gemini API keys are only accessed within the server-side `route.ts` file via environment variables.
