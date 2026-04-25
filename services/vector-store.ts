import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getSupabase } from "@/lib/supabase";
import { getEmbeddingModel } from "@/lib/gemini";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.js";

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
    console.log(`Extracting text from ${filename} using direct pdfjs-dist@3.4.120...`);
    
    // Convert Buffer to Uint8Array
    const data = new Uint8Array(pdfBuffer);
    
    // Load the PDF document
    // disableWorker: true is often better for simple Node.js environments
    const loadingTask = (pdfjs as any).getDocument({
      data,
      disableWorker: true,
      verbosity: 0,
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    let fullText = "";
    
    // Iterate through pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
        
      fullText += `\n[Page ${i}]\n${pageText}`;
      
      // Manual cleanup for each page
      if (page.cleanup) page.cleanup();
    }
    
    // Final cleanup
    await pdf.destroy();

    console.log(`Successfully extracted ${fullText.length} characters from ${filename}`);
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${filename}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Split text into chunks with overlap
 * Uses LangChain's RecursiveCharacterTextSplitter for intelligent chunking
 * @param text - The full text to split
 * @param chunkSize - Size of each chunk in characters (default: 1000)
 * @param overlapSize - Overlap between chunks in characters (default: 200)
 * @returns Array of text chunks
 */
export async function splitTextIntoChunks(
  text: string,
  chunkSize: number = 1000,
  overlapSize: number = 200
): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlapSize,
    separators: ["\n\n", "\n", " ", ""],
  });

  const chunks = await splitter.splitText(text);
  return chunks;
}

/**
 * Generate embeddings for text chunks using Gemini
 * Processes in batches to avoid rate limits and timeouts
 * @param chunks - Array of text chunks
 * @returns Array of embeddings (768-dimensional vectors)
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const embeddingModel = getEmbeddingModel();
  const batchSize = 5; // Small batches for reliability
  const allEmbeddings: number[][] = [];

  try {
    console.log(`Generating embeddings for ${chunks.length} chunks in batches of ${batchSize}...`);
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(chunks.length / batchSize)}...`);
      
      const batchEmbeddings = await embeddingModel.embedDocuments(batch);
      allEmbeddings.push(...batchEmbeddings);
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return allEmbeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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
  const supabase = getSupabase();
  const { error } = await (supabase
    .from("documents") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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
    
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        chunksCreated: 0,
        message: `No readable text found in ${filename}. It might be an image-based PDF or encrypted.`,
      };
    }
    
    console.log(`Extracted ${text.length} characters from PDF`);

    // Step 2: Split text into chunks
    console.log("Splitting text into chunks...");
    const chunks = await splitTextIntoChunks(text, 1000, 200);
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
