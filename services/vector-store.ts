import { createClient } from "@supabase/supabase-js";
import { getEmbeddingModel } from "@/lib/gemini";
import * as pdfjsLib from "pdfjs-dist";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Interface for document chunk metadata
 */
export interface ChunkMetadata {
  filename: string;
  pageNumber: number;
  chunkIndex: number;
  totalChunks: number;
}

/**
 * Interface for embedding result
 */
export interface EmbeddingResult {
  text: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

/**
 * Extract text from PDF buffer
 * @param pdfBuffer - The PDF file as a Buffer
 * @param filename - Original filename for metadata
 * @returns Extracted text from the PDF
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    // Convert buffer to Uint8Array for pdfjs
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let fullText = "";

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += `\n[Page ${i + 1}]\n${pageText}`;
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${filename}`);
  }
}

/**
 * Split text into chunks with overlap
 * Custom implementation for recursive text splitting
 * @param text - The full text to split
 * @param chunkSize - Size of each chunk in characters (default: 1000)
 * @param overlapSize - Overlap between chunks in characters (default: 200)
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlapSize: number = 200
): string[] {
  const chunks: string[] = [];

  // Split by double newlines first (paragraphs)
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start new one
    if (
      currentChunk.length + paragraph.length + 2 > chunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());

      // Create overlap by including last 200 chars from previous chunk
      const overlapStart = Math.max(0, currentChunk.length - overlapSize);
      currentChunk = currentChunk.substring(overlapStart);
    }

    currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
  }

  // Add the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // If we got chunks smaller than ideal, try splitting sentences within chunks
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > chunkSize * 1.5) {
      // Split large chunks by sentences
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let subChunk = "";

      for (const sentence of sentences) {
        if (subChunk.length + sentence.length > chunkSize && subChunk.length > 0) {
          finalChunks.push(subChunk.trim());
          // Create overlap
          const overlapStart = Math.max(0, subChunk.length - overlapSize);
          subChunk = subChunk.substring(overlapStart) + sentence;
        } else {
          subChunk += sentence;
        }
      }

      if (subChunk.trim().length > 0) {
        finalChunks.push(subChunk.trim());
      }
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks.length > 0 ? finalChunks : [text];
}

/**
 * Generate embeddings for text chunks using Gemini
 * @param chunks - Array of text chunks
 * @returns Array of embeddings (768-dimensional vectors)
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const embeddingModel = getEmbeddingModel();
  const embeddings: number[][] = [];

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const batchEmbeddings = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const result = await embeddingModel.embedContent(chunk);
          return result.embedding.values;
        } catch (error) {
          console.error("Error embedding chunk:", error);
          throw error;
        }
      })
    );

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

/**
 * Save chunks and embeddings to Supabase
 * @param chunks - Array of text chunks
 * @param embeddings - Array of embeddings (768-dimensional vectors)
 * @param metadata - Metadata including filename and page number
 */
export async function saveToSupabase(
  chunks: string[],
  embeddings: number[][],
  metadata: { filename: string; pageNumber?: number }
): Promise<void> {
  const documents = chunks.map((chunk, index) => ({
    content: chunk,
    embedding: embeddings[index],
    metadata: {
      filename: metadata.filename,
      pageNumber: metadata.pageNumber || 1,
      chunkIndex: index,
      totalChunks: chunks.length,
      uploadedAt: new Date().toISOString(),
    },
  }));

  // Insert into Supabase
  const { error } = await supabase
    .from("documents")
    .insert(documents);

  if (error) {
    console.error("Error saving to Supabase:", error);
    throw new Error(`Failed to save documents to Supabase: ${error.message}`);
  }

  console.log(
    `Successfully saved ${documents.length} document chunks to Supabase`
  );
}

/**
 * Main ingestion pipeline
 * Takes a PDF buffer, extracts text, chunks it, generates embeddings, and saves to database
 * @param pdfBuffer - The PDF file as a Buffer
 * @param filename - Original filename for metadata
 * @returns Success status and chunk count
 */
export async function ingestPDF(
  pdfBuffer: Buffer,
  filename: string
): Promise<{
  success: boolean;
  chunksCreated: number;
  message: string;
}> {
  try {
    console.log(`Starting ingestion for file: ${filename}`);

    // Step 1: Extract text from PDF
    console.log("Extracting text from PDF...");
    const text = await extractTextFromPDF(pdfBuffer, filename);
    console.log(`Extracted ${text.length} characters from PDF`);

    // Step 2: Split text into chunks
    console.log("Splitting text into chunks...");
    const chunks = splitTextIntoChunks(text, 1000, 200);
    console.log(`Created ${chunks.length} chunks`);

    // Step 3: Generate embeddings
    console.log("Generating embeddings...");
    const embeddings = await generateEmbeddings(chunks);
    console.log(`Generated ${embeddings.length} embeddings`);

    // Step 4: Save to Supabase
    console.log("Saving to Supabase...");
    await saveToSupabase(chunks, embeddings, { filename });

    return {
      success: true,
      chunksCreated: chunks.length,
      message: `Successfully ingested ${filename} with ${chunks.length} chunks`,
    };
  } catch (error) {
    console.error("Error during PDF ingestion:", error);
    return {
      success: false,
      chunksCreated: 0,
      message: `Failed to ingest PDF: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
