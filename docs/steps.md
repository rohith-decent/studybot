To get your MVP running today, we will follow a **Bottom-Up** approach. We build the "Brain" and "Memory" first, then the "Body" (UI). 

Each of these steps is designed to be "One Prompt" tasks for an AI coding assistant or a single focused development session.

---

### Step 1: Database & Memory Layer (The Foundation)
**Goal:** Enable your app to "remember" and search through text.
* **Action:** Setup Supabase and the Vector Table.
* **The "One-Prompt" Task:** > "Create a SQL migration script for Supabase to enable `pgvector`. Create a table named `documents` with columns for `id` (primary key), `content` (text), `metadata` (jsonb), and `embedding` (vector, 768 dimensions). Also, create a function and an index for performing cosine similarity searches on the embedding column."

---

### Step 2: The Ingestion Service (The Input)
**Goal:** Turn a PDF into searchable numbers (Vectors).
* **Action:** Create the PDF parsing and embedding logic in `services/vector-store.ts`.
* **The "One-Prompt" Task:** > "Using LangChain.js and the Gemini Embedding model, write a TypeScript service that takes a PDF file buffer, splits the text into 1000-character chunks with a 200-character overlap, generates embeddings for each chunk, and saves them into the Supabase `documents` table. Include metadata like filename and page number."

---

### Step 3: The RAG API Route (The Logic)
**Goal:** Create a backend endpoint that answers questions based on the stored data.
* **Action:** Create `app/api/chat/route.ts`.
* **The "One-Prompt" Task:** > "Write a Next.js App Router POST API route that: 1. Takes a user query and a 'mode' (Study or Exam). 2. Embeds the query. 3. Performs a similarity search in Supabase. 4. Constructs a system prompt for Gemini 1.5 Flash. If 'Study Mode', ask for a summary and flashcards in JSON. If 'Exam Mode', answer the query strictly using the provided context. 5. Streams the response back using Vercel AI SDK."

---

### Step 4: The Core Layout & Sidebar (The Skeleton)
**Goal:** Build the UI structure with the mode toggle and upload button.
* **Action:** Build `app/layout.tsx` and a Sidebar component.
* **The "One-Prompt" Task:** > "Create a Next.js layout with a sidebar and a main chat area using Tailwind CSS. The sidebar should have an 'Upload Source' button (input type file), a toggle switch between 'Study Mode' and 'Exam Mode', and a list to show uploaded filenames. Use Lucide-React for icons and ensure it is responsive."

---

### Step 5: The Chat & Display Interface (The Interaction)
**Goal:** Handle the messaging and display structured data (like flashcards).
* **Action:** Build `components/chat/ChatWindow.tsx`.
* **The "One-Prompt" Task:** > "Create a React chat component that uses the `useChat` hook from Vercel AI SDK. It should render user and assistant messages. If the assistant's message contains a JSON block with flashcards, parse it and display it as a grid of interactive cards. Add a 'Download Summary' button that appears only after a source is processed."

---

### Step 6: The Export Feature (The Output)
**Goal:** Generate the downloadable "solved" study material.
* **Action:** Create `services/pdf-service.ts`.
* **The "One-Prompt" Task:** > "Write a TypeScript function using `pdf-lib` that takes a string of text (the AI's summary or exam answers) and generates a new PDF document. The PDF should have a clear title, formatted headers, and body text. Provide an endpoint to trigger this download from the frontend."

---

### Step 7: Deployment & Environment
**Goal:** Make the app live.
* **Action:** Connect GitHub to Vercel.
* **The "One-Prompt" Task:** > "Explain the exact list of Environment Variables I need to add to Vercel for this project to work, including the format for the Supabase URL, Service Role Key, and Gemini API Key."

---

### Priority Order Summary:
1.  **Step 1 & 2 (Data In):** If you can't save data, you have nothing to chat with.
2.  **Step 3 (Brain):** Verify the AI can actually "see" the data you saved.
3.  **Step 4 & 5 (UI):** Make it usable for the user.
4.  **Step 6 (Value Add):** The download feature completes the "Study Assistant" loop.

**Which step would you like the specific code for first?**