"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TierSelectionPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const tiers = {
    anonymity: {
      name: "ANONYMITY",
      icon: "🔒",
      features: ["✓ PROOF OF HUMANITY", "✕ WALLET", "✕ DID"],
      description: "WORLD ID VERIFICATION ONLY",
    },
    pseudoAnon: {
      name: "PSEUDO-ANONYMITY",
      icon: "🕶️",
      features: ["✓ WORLD ID", "✓ WALLET SIGNATURE", "✕ DID"],
      description: "INHERITS ANONYMITY + WALLET LINKING",
    },
    identity: {
      name: "IDENTITY",
      icon: "🪪",
      features: ["✓ EVERYTHING ABOVE", "✓ DID VIA SELF PROTOCOL"],
      description: "FULL VERIFIABLE CREDENTIALS",
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 font-mono">
      {/* Header */}
      <header className="border-b-4 border-black bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold uppercase tracking-wider"
          >
            DEEPERTRUTH
          </Link>
          <div className="text-sm font-bold uppercase tracking-wide">
            TIER SELECTION
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-8 text-center">
            SELECT PRIVACY TIER
          </h1>

          {/* Venn Diagram Concept */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Tier Selection */}
            <div className="space-y-4">
              {Object.entries(tiers).map(([key, tier]) => (
                <div
                  key={key}
                  className={`border-4 border-black bg-white p-6 cursor-pointer transition-all ${
                    selectedTier === key
                      ? "bg-black text-white"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedTier(key)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-2xl">{tier.icon}</div>
                    <div>
                      <h3 className="font-bold uppercase text-lg">
                        {tier.name}
                      </h3>
                      <p className="text-sm font-mono opacity-75">
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  <div className="font-mono text-sm space-y-1">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <span className="w-4 text-center mr-2">
                          {feature.startsWith("✓") ? "✓" : "✕"}
                        </span>
                        <span
                          className={
                            feature.startsWith("✓") ? "" : "opacity-50"
                          }
                        >
                          {feature.substring(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Details */}
            <div className="border-4 border-black bg-white p-8">
              <h2 className="font-bold uppercase text-lg mb-4 border-b-2 border-black pb-2">
                TECHNICAL SPECS
              </h2>

              {selectedTier ? (
                <div className="font-mono text-sm space-y-4">
                  <div>
                    <div className="font-bold uppercase mb-2">
                      SELECTED: {tiers[selectedTier as keyof typeof tiers].name}
                    </div>
                    <div className="bg-gray-100 p-4 border-2 border-gray-300">
                      <pre className="text-xs leading-relaxed">
                        {selectedTier === "anonymity" &&
                          `ANONYMITY:
  ✓ World ID Nullifier
  ✓ Zero-Knowledge Proof
  ✓ Steganographic Embedding
  ✕ Wallet Signature
  ✕ DID Credential

PRIVACY: MAXIMUM
VERIFIABILITY: BASIC`}

                        {selectedTier === "pseudoAnon" &&
                          `PSEUDO-ANONYMITY:
  ✓ World ID Nullifier
  ✓ Wallet Signature (ECDSA)
  ✓ Steganographic Embedding
  ✓ On-chain Verification
  ✕ DID Credential

PRIVACY: HIGH
VERIFIABILITY: ENHANCED`}

                        {selectedTier === "identity" &&
                          `IDENTITY:
  ✓ World ID Nullifier
  ✓ Wallet Signature (ECDSA)
  ✓ Self Protocol DID
  ✓ Verifiable Credentials
  ✓ Full Audit Trail

PRIVACY: CONTROLLED
VERIFIABILITY: MAXIMUM`}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 font-mono text-sm">
                  SELECT A TIER TO VIEW TECHNICAL DETAILS
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-16 text-center">
            <Link href={selectedTier ? `/camera?tier=${selectedTier}` : "#"}>
              <Button
                className={`px-12 py-6 font-bold uppercase text-lg border-4 transition-colors ${
                  selectedTier
                    ? "bg-black text-white border-black hover:bg-white hover:text-black"
                    : "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                }`}
                disabled={!selectedTier}
              >
                CONTINUE TO CAMERA
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
