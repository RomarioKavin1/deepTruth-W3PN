import {
  IVerifyResponse,
  verifyCloudProof,
} from "@worldcoin/idkit-core/backend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const proof = await req.json();
    const app_id = "app_6e916a8a4112922b1f33c7f899762c3d" as `app_${string}`;
    const action = "verify-humanity";

    const verifyRes = (await verifyCloudProof(
      proof,
      app_id,
      action
    )) as IVerifyResponse;

    if (verifyRes.success) {
      // This is where you should perform backend actions if the verification succeeds
      // Such as, setting a user as "verified" in a database
      return NextResponse.json(verifyRes, { status: 200 });
    } else {
      // This is where you should handle errors from the World ID /verify endpoint.
      // Usually these errors are due to a user having already verified.
      return NextResponse.json(verifyRes, { status: 400 });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
