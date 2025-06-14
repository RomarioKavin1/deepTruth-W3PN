import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import {
  ANONYMITY_TIERS_ADDRESS,
  ANONYMITY_TIERS_ABI,
} from "@/utils/contractConfig";

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get("uuid");

    if (!uuid) {
      return NextResponse.json({ error: "UUID is required" }, { status: 400 });
    }

    const result = await publicClient.readContract({
      address: ANONYMITY_TIERS_ADDRESS,
      abi: ANONYMITY_TIERS_ABI,
      functionName: "getPseudonymousRecord",
      args: [uuid],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching pseudonymous record:", error);
    return NextResponse.json(
      { error: "Failed to fetch pseudonymous record" },
      { status: 500 }
    );
  }
}
