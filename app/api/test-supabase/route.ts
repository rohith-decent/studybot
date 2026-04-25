import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Test 1: Check if we can connect & list tables
    const { data: tables, error: tablesError } = await supabase
      .from("documents")
      .select("id")
      .limit(1);

    if (tablesError) {
      // If table doesn't exist yet, that's okay for now
      if (tablesError.code === "42P01") {
        return NextResponse.json({
          status: "partial-success",
          message: "Connected to Supabase, but 'documents' table not found yet. Run the SQL setup script.",
          error: tablesError
        });
      }
      throw tablesError;
    }

    // Test 2: Try a simple insert (will be rolled back automatically in real usage, but safe for testing)
    const { data: insertData, error: insertError } = await supabase
      .from("documents")
      .insert({
        content: "test-connection-only",
        metadata: { test: true, timestamp: new Date().toISOString() }
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // Clean up the test row
    await supabase.from("documents").delete().eq("id", insertData.id);

    return NextResponse.json({
      status: "success",
      message: "✅ Supabase connection + CRUD operations working!",
      sampleRow: tables[0] || null
    });

  } catch (error: any) {
    console.error("Supabase Test Failed:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: error.message || String(error),
        code: error.code || null
      }, 
      { status: 500 }
    );
  }
}