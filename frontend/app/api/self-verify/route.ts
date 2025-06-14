import { NextRequest, NextResponse } from "next/server";
import { SelfBackendVerifier, getUserIdentifier } from "@selfxyz/core";

export async function POST(req: NextRequest) {
  try {
    const { proof, publicSignals } = await req.json();

    if (!proof || !publicSignals) {
      return NextResponse.json(
        { message: "Proof and publicSignals are required" },
        { status: 400 }
      );
    }

    console.log("Received proof data:");
    console.log("Proof:", JSON.stringify(proof, null, 2));
    console.log("Public Signals:", JSON.stringify(publicSignals, null, 2));

    // Extract user ID from the proof
    const userId = await getUserIdentifier(publicSignals);
    console.log("Extracted userId:", userId);

    // IMPORTANT: Both scope and endpoint must exactly match the frontend
    const scope = "deeptruth-app"; // Same as frontend
    const endpoint = "https://remo.crevn.xyz/api/self-verify";
    const mockPassport = true;

    // Initialize and configure the verifier
    const selfBackendVerifier = new SelfBackendVerifier(
      scope,
      endpoint,
      "hex",
      mockPassport
    );

    // Set minimum age requirement (same as frontend)
    selfBackendVerifier.setMinimumAge(18);

    console.log("Backend verifier configured with:");
    console.log("- Scope:", scope);
    console.log("- Endpoint:", endpoint);
    console.log("- Minimum Age: 18");

    // Verify the proof
    const result = await selfBackendVerifier.verify(proof, publicSignals);

    console.log("Verification result:", JSON.stringify(result, null, 2));

    if (result.isValid) {
      // Log the verification details
      console.log("✅ Verification successful!");
      console.log("User ID:", result.userId);
      console.log("Nullifier:", result.nullifier);
      console.log("Credential Subject:", result.credentialSubject);

      // In a real app, you would:
      // 1. Store the nullifier to prevent reuse
      // 2. Save user verification status to database
      // 3. Associate verification with user account

      // Return successful verification response with original proof data
      return NextResponse.json({
        status: "success",
        result: true,
        userId: result.userId,
        nullifier: result.nullifier,
        credentialSubject: result.credentialSubject,
        verificationDetails: result.isValidDetails,
        // Include the original proof data that was sent to this API
        originalProof: {
          proof: proof,
          publicSignals: publicSignals,
        },
      });
    } else {
      console.log("❌ Verification failed:");
      console.log("Details:", result.isValidDetails);
      console.log("Error:", result.error);

      // Return failed verification response with detailed error info
      return NextResponse.json(
        {
          status: "error",
          result: false,
          message: `Verification failed: ${result.error}`,
          details: result.isValidDetails,
          debugInfo: {
            frontendScope: scope,
            backendScope: scope,
            endpoint: endpoint,
            userId: result.userId,
            application: result.application,
            error: result.error,
            scopeMatch: scope === "deeptruth-app",
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying Self proof:", error);
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
