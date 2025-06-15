import { NextRequest, NextResponse } from "next/server";
import { proofStore } from "@/lib/proof-store";

// This should reference the same store as the main capture endpoint
// For now, we'll use a simple approach to get the latest proof data
export async function GET(req: NextRequest) {
  try {
    // Get the latest proof data from the shared store
    const latestProof = proofStore.getLatest();

    if (!latestProof) {
      return NextResponse.json(
        { error: "No proof data available" },
        { status: 404 }
      );
    }

    console.log("Returning latest proof data:", latestProof);
    return NextResponse.json(latestProof);
  } catch (error) {
    console.error("Error fetching latest proof data:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest proof data" },
      { status: 500 }
    );
  }
}
