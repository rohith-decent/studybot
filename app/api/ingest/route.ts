import { NextRequest, NextResponse } from "next/server";
import { ingestPDF } from "@/services/vector-store";

/**
 * POST /api/ingest
 * Handles PDF file uploads and ingestion
 * Expects FormData with a file field containing the PDF
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ingest the PDF
    const result = await ingestPDF(buffer, file.name);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

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
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
