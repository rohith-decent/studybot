import { NextRequest, NextResponse } from "next/server";
import { ingestPDF } from "@/services/vector-store";

/**
 * POST /api/ingest
 * Handles PDF file uploads and ingestion
 * Expects FormData with a file field containing the PDF
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds

/**
 * POST /api/ingest
 * Handles PDF file uploads and ingestion
 * Expects FormData with a file field containing the PDF
 */
export async function POST(request: NextRequest) {
  console.log("Received ingestion request");
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.warn("No file provided in request");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name} (${file.size} bytes)`);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Limit file size (e.g., 10MB) to prevent server strain
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ingest the PDF
    const result = await ingestPDF(buffer, file.name);

    if (!result.success) {
      console.error(`Ingestion failed for ${file.name}: ${result.message}`);
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    console.log(`Ingestion successful for ${file.name}`);
    return NextResponse.json({
      success: true,
      filename: file.name,
      chunksCreated: result.chunksCreated,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in POST /api/ingest:", error);
    return NextResponse.json(
      {
        error: "Internal server error during ingestion",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
