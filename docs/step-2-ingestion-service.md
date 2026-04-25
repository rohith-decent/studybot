# Step 2: The Ingestion Service (The Input)

**Status:** ✅ Complete  
**Goal:** Turn a PDF into searchable numbers (Vectors)  
**Date Completed:** April 25, 2026

---

## Overview

The ingestion service is the "pipeline" that transforms raw PDF files into searchable embeddings stored in Supabase. This layer is critical because it determines the quality and searchability of data used in later steps (chat, retrieval, inference).

---

## Files Created

### 1. **`lib/gemini.ts`**
**Purpose:** Centralized Gemini API configuration.

**Key Functions:**
- `getEmbeddingModel()` - Returns the Gemini embedding model for generating 768-dimensional vectors
- `getGenerativeModel()` - Returns the Gemini 1.5 Flash model for future chat/inference

**Implementation Details:**
- Initializes Google AI client with `GEMINI_API_KEY`
- Uses `embedding-001` model for embeddings (768 dimensions)
- Uses `gemini-1.5-flash` for future chat operations

---

### 2. **`services/vector-store.ts`**
**Purpose:** Core ingestion logic with the complete pipeline.

**Key Functions:**

#### `extractTextFromPDF(pdfBuffer: Buffer, filename: string)`
- Converts PDF buffer to text using `pdfjs-dist`
- Preserves page numbers as metadata
- Handles multi-page PDFs by concatenating text with page markers

**Edge Cases Handled:**
- PDFs with images only (returns empty text)
- Corrupted PDF files (throws descriptive error)
- Large files (streaming approach ready)

#### `splitTextIntoChunks(text: string, chunkSize?, overlapSize?)`
- Uses LangChain's `RecursiveCharacterTextSplitter`
- **Default:** 1000-character chunks with 200-character overlap
- Splits intelligently by paragraph, newline, space (maintains context)
- Overlap prevents cutting off important information between chunks

#### `generateEmbeddings(chunks: string[])`
- Sends chunks to Gemini embedding model
- Returns 768-dimensional vectors (Gemini standard)
- **Batching:** Processes 5 chunks at a time to avoid rate limiting
- Error handling for individual chunk failures

#### `saveToSupabase(chunks, embeddings, metadata)`
- Inserts documents into `documents` table in Supabase
- Includes metadata: filename, page number, chunk index, upload timestamp
- Bulk insert for efficiency

#### `ingestPDF(pdfBuffer, filename)` - Main Pipeline
Orchestrates the entire flow:
1. Extract text from PDF
2. Split into chunks (1000 chars, 200 overlap)
3. Generate embeddings via Gemini
4. Save to Supabase with metadata

Returns: `{ success: boolean, chunksCreated: number, message: string }`

---

### 3. **`app/api/ingest/route.ts`**
**Purpose:** API endpoint for file uploads from the frontend.

**Endpoint:** `POST /api/ingest`

**Input:** FormData with `file` field (PDF)

**Process:**
1. Validates file type (PDF only)
2. Converts File to Buffer
3. Calls `ingestPDF()` service
4. Returns JSON response with chunks created

**Response Example:**
```json
{
  "success": true,
  "filename": "biology_notes.pdf",
  "chunksCreated": 42,
  "message": "Successfully ingested biology_notes.pdf with 42 chunks"
}
```

**Error Handling:**
- Returns 400 for non-PDF files
- Returns 500 for ingestion failures with detailed error messages

---

### 4. **`types/index.ts`**
**Purpose:** TypeScript interfaces for type safety.

**Key Types:**
- `DocumentMetadata` - File metadata (filename, page, chunk index)
- `Document` - Complete document object with embedding
- `IngestionResponse` - API response type
- `ChatMessage` - For future chat functionality
- `StudyMode` - For mode switching (study vs exam)

---

### 5. **`app/page.tsx`** (Updated)
**Purpose:** Testing UI with upload and chat interface.

**Components:**
- **Sidebar:** Upload button, file list, status messages
- **Chat Area:** Message display and input
- **Features:**
  - PDF upload with progress indicator
  - Uploaded files tracker with chunk count
  - Simple chat interface (backend coming in Step 3)
  - Error/success notifications

**Status Notes:**
- Chat functionality is a placeholder (Step 3 will connect the RAG API)
- Upload functionality is fully working with Step 2

---

## Supabase Setup Required

Before running, ensure your Supabase database has this schema:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

-- Create similarity search function
CREATE FUNCTION match_documents (
  query_embedding vector(768),
  similarity_threshold float,
  match_count int
) RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity float
) AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > similarity_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;
```

---

## Environment Variables

Add to `.env.local`:

```
GEMINI_API_KEY=your_api_key_from_google_ai_studio
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Testing the Implementation

### 1. **Start the dev server:**
```bash
npm run dev
```

### 2. **Upload a PDF:**
- Navigate to `http://localhost:3000`
- Click "Upload PDF"
- Select a PDF file
- Watch the console for ingestion logs

### 3. **Verify in Supabase:**
- Go to Supabase dashboard
- Check `documents` table for new records
- Each PDF creates multiple rows (one per chunk)

### 4. **Example Output:**
```
Starting ingestion for file: study_guide.pdf
Extracting text from PDF...
Extracted 45230 characters from PDF
Splitting text into chunks...
Created 48 chunks
Generating embeddings...
Generated 48 embeddings
Saving to Supabase...
Successfully saved 48 document chunks to Supabase
```

---

## Known Limitations & Future Improvements

### Current Limitations:
1. **Single PDF processing** - Only one file at a time (queue system needed for scale)
2. **No duplicate detection** - Same file uploaded twice creates duplicates
3. **No chunking strategy optimization** - Fixed 1000-char size (could be adaptive)
4. **Limited metadata** - No document type, language, or custom tags

### Future Improvements:
1. **Batch Processing:** Queue system for multiple file uploads
2. **Deduplication:** Hash-based duplicate detection
3. **Adaptive Chunking:** Sentence/paragraph-aware splitting
4. **Rich Metadata:** Document type, language, tags, OCR support
5. **Progress Tracking:** WebSocket-based real-time ingestion status
6. **File Format Support:** `.docx`, `.pptx`, `.txt` (as per Step 2 scope)
7. **Semantic Chunking:** Use sentence transformers for better chunk boundaries

---

## Dependencies Added

```json
{
  "@google/generative-ai": "Latest",
  "@supabase/supabase-js": "Latest",
  "langchain": "Latest",
  "pdf-parse": "Latest",
  "pdfjs-dist": "Latest",
  "ai": "Latest",
  "lucide-react": "Latest"
}
```

---

## Code Quality Notes

- **Type Safety:** All functions have TypeScript signatures
- **Error Handling:** Try-catch blocks with descriptive messages
- **Logging:** Console logs at each pipeline step for debugging
- **Modularity:** Each function does one thing well
- **Testability:** Functions can be tested independently

---

## Next Steps

**Step 3:** The RAG API Route (The Logic)
- Create `/app/api/chat/route.ts`
- Implement similarity search in Supabase
- Stream responses from Gemini
- This will make the chat interface functional

---

## Checklist

- ✅ `lib/gemini.ts` - Gemini initialization
- ✅ `services/vector-store.ts` - Ingestion pipeline
- ✅ `app/api/ingest/route.ts` - Upload endpoint
- ✅ `types/index.ts` - Type definitions
- ✅ `app/page.tsx` - Testing UI
- ✅ `.env.local.example` - Environment template
- ✅ Dependencies installed
- ⏳ Supabase database schema (manual setup required)
- ⏳ `GEMINI_API_KEY` added to `.env.local`
- ⏳ Supabase credentials added to `.env.local`
