-- 1. Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the embeddings table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(768) -- Matches Gemini Embedding dimensions
);

-- 3. Create an index for fast cosine similarity search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);