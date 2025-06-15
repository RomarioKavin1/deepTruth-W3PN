import { NextRequest, NextResponse } from "next/server";

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

    // Store the proof data in a way that can be accessed by the frontend
    // We'll use a simple approach - store in a global variable or use a better solution
    // For now, we'll forward to the real endpoint and include the original data in response

    // Forward to the real Self verification endpoint
    const realEndpoint = "https://remo.crevn.xyz/api/self-verify";

    const response = await fetch(realEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ proof, publicSignals }),
    });

    const result = await response.json();

    if (response.ok && result.status === "success") {
      // Return success with the original proof data included
      return NextResponse.json({
        ...result,
        // Include the original proof data that we captured
        capturedProof: {
          proof: proof,
          publicSignals: publicSignals,
        },
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
