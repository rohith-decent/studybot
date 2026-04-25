# Step 2 Setup Guide

This guide will help you set up Step 2 (The Ingestion Service) and test it locally.

## Prerequisites

- ✅ Next.js project initialized (already done)
- ✅ Dependencies installed (already done)
- Node.js 16+ (verify with `node --version`)

## Step-by-Step Setup

### 1. **Set Up Supabase**

If you don't have a Supabase account:
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up and create a new project
4. Wait for the database to initialize (~30 seconds)

### 2. **Create the Database Schema**

1. In Supabase dashboard, go to the **SQL Editor**
2. Click "+ New Query"
3. Copy and paste this SQL:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create a helper function for similarity search
CREATE FUNCTION match_documents (
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.0,
  match_count int DEFAULT 10
) RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity float
) AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > similarity_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

4. Click "Run" to execute

### 3. **Get Supabase Credentials**

In Supabase dashboard:
1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** (in "Project URL" field)
   - **Service Role Key** (in "Project API keys" section, under "service_role")

### 4. **Get Gemini API Key**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **"Create API key"**
4. Copy the key

### 5. **Configure Environment Variables**

1. In project root, create (or update) `.env.local`:

```bash
# Copy from Supabase dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# From Google AI Studio
GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ Important:** Never commit `.env.local` to Git. It's already in `.gitignore`.

### 6. **Start Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see:
- Upload button on the left sidebar
- Chat area on the right (placeholder for now)
- "No messages yet" message

### 7. **Test the Upload**

1. Find a PDF file on your computer (or download a sample)
2. Click **"Upload PDF"** button
3. Select the PDF
4. Wait for upload to complete

**Expected result:**
- ✅ Green success message appears
- ✅ File appears in "Uploaded Files" list with chunk count
- ✅ A message appears in chat: "Successfully uploaded..."

**In Supabase:**
- Go to dashboard → **Table Editor** → `documents`
- You should see new rows (one per chunk)
- Each row has `content`, `embedding` (vector), and `metadata`

### 8. **Troubleshooting**

#### Error: "GEMINI_API_KEY environment variable is not set"
- Make sure `.env.local` file exists in project root
- Verify the key name is exactly `GEMINI_API_KEY`
- Restart dev server after adding env vars

#### Error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
- Check you're using **Service Role Key**, not public/anon key
- Verify URLs in `.env.local` match your Supabase project

#### Upload fails silently
- Check browser console for errors (F12)
- Check terminal for server errors
- Try a smaller PDF file

#### "Only PDF files are supported"
- Make sure you're selecting a `.pdf` file
- Some files might have wrong extension

#### Embeddings fail / "Error embedding chunk"
- Verify Gemini API key is valid
- Check [Gemini quota](https://makersuite.google.com/app/apikey) is not exceeded
- Try with a smaller PDF

---

## What Just Happened?

When you uploaded a PDF, this pipeline executed:

1. **File Upload** → `app/page.tsx` sends FormData to API
2. **API Endpoint** → `app/api/ingest/route.ts` receives file
3. **PDF Extraction** → `services/vector-store.ts` extracts text with `pdfjs-dist`
4. **Text Chunking** → Split into 1000-char chunks with 200-char overlap
5. **Embedding Generation** → Each chunk sent to Gemini embedding model → 768-D vector
6. **Database Save** → Vectors stored in Supabase `documents` table with metadata

**Result:** Your PDF is now "searchable" - any question you ask will be converted to a vector and matched against these chunks using cosine similarity (Step 3).

---

## What's Next?

**Step 3: The RAG API Route (The Logic)**
- Create endpoint that searches stored documents
- Streams AI responses based on document context
- This makes the chat interface actually work!

---

## Quick Reference

| File | Purpose |
|------|---------|
| `lib/gemini.ts` | Gemini API setup |
| `services/vector-store.ts` | PDF → Embeddings pipeline |
| `app/api/ingest/route.ts` | Upload endpoint |
| `app/page.tsx` | UI for testing |
| `.env.local` | Secret credentials (not committed) |

---

## Verifying Ingestion in Supabase

1. Go to Supabase dashboard
2. **Table Editor** → click `documents`
3. Should see rows with:
   - `id`: auto-increment
   - `content`: chunk of text from PDF
   - `embedding`: array of 768 numbers
   - `metadata`: JSON with `filename`, `pageNumber`, `chunkIndex`, `uploadedAt`
   - `created_at`: timestamp

Each PDF creates multiple rows (one per chunk). The `embedding` column is the key - it's a 768-dimensional vector that represents the meaning of that chunk.

---

**You're all set!** The ingestion pipeline is ready. Move on to Step 3 when ready.
