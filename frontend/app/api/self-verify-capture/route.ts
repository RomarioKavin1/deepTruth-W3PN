import { NextRequest, NextResponse } from "next/server";
import { proofStore } from "@/lib/proof-store";

export async function POST(req: NextRequest) {
  try {
    const { proof, publicSignals } = await req.json();

    if (!proof || !publicSignals) {
      return NextResponse.json(
        { message: "Proof and publicSignals are required" },
        { status: 400 }
      );
    }

    console.log("Captured Self proof data:");
    console.log("Proof:", JSON.stringify(proof, null, 2));
    console.log("Public Signals:", JSON.stringify(publicSignals, null, 2));

    // Generate a unique key for this proof session
    const proofKey = `proof_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store the proof data using shared store
    const capturedData = {
      proof: proof,
      publicSignals: publicSignals,
      timestamp: new Date().toISOString(),
    };

    proofStore.set(proofKey, capturedData);

    // Forward to the real Self verification endpoint
    const realEndpoint = "https://deep-truth-w3-pn.vercel.app/api/self-verify";

    const response = await fetch(realEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ proof, publicSignals }),
    });

    const result = await response.json();

    if (response.ok && result.status === "success") {
      // Store the proof data in sessionStorage via the response
      // The frontend can access this via a custom header or response body
      return NextResponse.json({
        ...result,
        // Include the original proof data that we captured
        capturedProof: {
          proof: proof,
          publicSignals: publicSignals,
        },
        proofKey: proofKey, // Include the key for potential future retrieval
      });
    } else {
      // Forward the error response
      return NextResponse.json(result, { status: response.status });
    }
  } catch (error) {
    console.error("Error in self-verify-capture:", error);
    return NextResponse.json(
      {
        status: "error",
        result: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve stored proof data
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const proofKey = url.searchParams.get("key");

  if (!proofKey) {
    return NextResponse.json({ error: "Proof key required" }, { status: 400 });
  }

  const storedData = proofStore.get(proofKey);

  if (!storedData) {
    return NextResponse.json(
      { error: "Proof data not found" },
      { status: 404 }
    );
  }

  // Clean up after retrieval
  proofStore.delete(proofKey);

  return NextResponse.json(storedData);
}
