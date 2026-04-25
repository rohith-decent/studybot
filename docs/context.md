# AI Study Assistant (RAG-Bot)
**Internal Project Name:** studybot 
**Status:** Architecture Phase (MVP)  
**Single Source of Truth for AI Agents & Developers**

## 1. Project Summary
A serverless, high-performance RAG (Retrieval-Augmented Generation) application designed to help students transform dense study materials into actionable insights. It focuses on summarization, automated quiz generation, and "exam-solving" by mapping question papers against source notes.

---

## 2. Core User Actions & Modes
The application operates in two distinct functional "Modes" to provide specialized context to the LLM.

### **A. Global Actions**
* **Source Input:** Upload `.pdf`, `.docx`, or `.pptx` files.
* **General Chat:** Ask questions about the uploaded content or general academic topics.
* **Export:** Download a generated PDF containing the AI's findings.

### **B. Mode: Study Mode**
* **Summarization:** Generate high-level overviews of documents.
* **Cheat Sheets:** Automated extraction of formulas, key dates, or definitions into a grid view.
* **Revision Cards:** Generation of flashcards in `{ Question, Answer }` JSON format for active recall.

### **C. Mode: Exam/Q&A Mode**
* **QP Mapping:** Upload a "Question Paper" (QP) alongside "Source Notes."
* **Contextual Solving:** The bot answers the QP using *only* the provided source notes, citing the exact page or section.
* **Answer Highlighting:** (Planned) Visual indicators of where answers were found in the source.

---

## 3. The Tech Stack
To maintain a **zero-cost** deployment for the MVP, the following stack is mandatory:

* **Framework:** Next.js 15+ (App Router).
* **Language:** TypeScript (Strict Mode).
* **LLM:** Gemini 1.5 Flash (via Google AI Studio).
* **Vector Database:** Supabase + `pgvector`.
* **Orchestration:** LangChain.js & Vercel AI SDK.
* **PDF Logic:** `pdf-lib` for generating/modifying export files.
* **Deployment:** Vercel (Serverless).

---

## 4. Data Flow Architecture

### **Phase I: Ingestion (The Memory)**
1.  **Client:** User uploads file → Sent to `/api/ingest`.
2.  **Server:** `LangChain` parses text and splits it into chunks (~1000 tokens).
3.  **Embedding:** Chunks are sent to Gemini Embedding Model → Converted to **768-dimension vectors**.
4.  **Storage:** Vectors + Text Metadata (filename, page #) are stored in Supabase.

### **Phase II: Retrieval & Inference (The Brain)**
1.  **Query:** User asks a question → Converted to a vector.
2.  **Search:** Supabase performs a cosine similarity search to find the most relevant chunks.
3.  **Prompt:** Context chunks + User Query are wrapped in a System Prompt.
4.  **Stream:** Gemini generates a response; Vercel AI SDK streams it to the UI.

---

## 5. Development Guidelines (Multi-Developer)
To ensure code quality and prevent merge conflicts:

* **Branching:** No direct pushes to `main`. Use `feat/`, `fix/`, or `docs/` prefixes.
* **Variables:** All API keys must reside in `.env.local` and never be committed.
* **UI Components:** Use **Tailwind CSS** and **Lucide-React** for icons. Keep components atomic (small, reusable).
* **Type Safety:** Define interfaces for all JSON outputs (e.g., `interface Flashcard { q: string, a: string }`).

---

## 6. Documentation Protocol (Instruction to Agents)
To maintain a scalable codebase, we follow a **Feature-Based Documentation** rule:

> **CRITICAL INSTRUCTION:** For every feature completed (e.g., "PDF Upload", "Flashcard Generation", "Supabase Setup"), the lead developer/agent **MUST** create a corresponding `.md` file in the `/docs/` directory.
>
> **The file must include:**
> 1. **Feature Name.**
> 2. **Technical Implementation:** (Which functions/files were created).
> 3. **Challenges/Edge Cases:** (e.g., "PDFs over 10MB timeout on Vercel").
> 4. **Future Improvements.**

---

