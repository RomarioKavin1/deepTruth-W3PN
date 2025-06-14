import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/utils/config";

export async function POST(request: NextRequest) {
  try {
    const { proofData, type } = await request.json();

    if (!proofData || !type) {
      return NextResponse.json(
        { error: "Proof data and type are required" },
        { status: 400 }
      );
    }

    // Create a JSON file from the proof data
    const jsonString = JSON.stringify(proofData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], `${type}-proof-${Date.now()}.json`, {
      type: "application/json",
    });

    // Upload to Pinata
    const { cid } = await pinata.upload.public.file(file);
    const url = await pinata.gateways.public.convert(cid);

    return NextResponse.json(
      {
        cid,
        url,
        type,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Pinata upload error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
