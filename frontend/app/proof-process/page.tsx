"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProofProcessPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "anonymity";

  const tierSteps = {
    anonymity: [{ name: "WORLD ID VERIFICATION", status: "pending" }],
    pseudoAnon: [
      { name: "WORLD ID VERIFICATION", status: "pending" },
      { name: "WALLET SIGNATURE", status: "pending" },
    ],
    identity: [
      { name: "WORLD ID VERIFICATION", status: "pending" },
      { name: "WALLET SIGNATURE", status: "pending" },
      { name: "SELF PROTOCOL DID", status: "pending" },
    ],
  };

  const [steps, setSteps] = useState(tierSteps[tier as keyof typeof tierSteps]);

  useEffect(() => {
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setSteps((prev) =>
          prev.map((step, idx) =>
            idx === i ? { ...step, status: "completed" } : step
          )
        );
        setCurrentStep(i + 1);
        setProgress(((i + 1) / steps.length) * 100);
      }

      // Final processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsComplete(true);
    };

    processSteps();
  }, [steps.length]);

  return (
    <div className="min-h-screen bg-gray-100 font-mono">
      {/* Header */}
      <header className="border-b-4 border-black bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold uppercase tracking-wider">
            DEEPERTRUTH
          </div>
          <div className="text-sm font-bold uppercase tracking-wide">
            PROOF GENERATION
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-8 text-center">
            GENERATING PROOF
          </h1>

          {/* Progress Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`border-4 p-6 transition-all ${
                  step.status === "completed"
                    ? "border-green-600 bg-green-50"
                    : currentStep === idx
                    ? "border-black bg-white animate-pulse"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 border-2 flex items-center justify-center font-bold ${
                        step.status === "completed"
                          ? "border-green-600 bg-green-600 text-white"
                          : currentStep === idx
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-gray-300"
                      }`}
                    >
                      {step.status === "completed" ? "✓" : idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold uppercase">{step.name}</h3>
                      <p className="text-sm text-gray-600 font-mono">
                        {step.status === "completed"
                          ? "VERIFIED"
                          : currentStep === idx
                          ? "PROCESSING..."
                          : "PENDING"}
                      </p>
                    </div>
                  </div>

                  {currentStep === idx && step.status !== "completed" && (
                    <div className="font-mono text-xs text-gray-500">
                      <div className="animate-pulse">PROCESSING...</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="border-4 border-black bg-white p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold uppercase text-sm">
                  EMBEDDING STEGOPROOF
                </span>
                <span className="font-mono text-sm">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="border-2 border-black bg-gray-200 h-4">
                <div
                  className="bg-black h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="border-4 border-black bg-black text-green-400 p-4 font-mono text-sm mb-8">
            <div className="space-y-1">
              <div>{"> INITIALIZING CRYPTOGRAPHIC PIPELINE..."}</div>
              <div>{"> GENERATING STEGANOGRAPHIC PAYLOAD..."}</div>
              {currentStep > 0 && (
                <div>{"> WORLD ID NULLIFIER EMBEDDED ✓"}</div>
              )}
              {currentStep > 1 && <div>{"> WALLET SIGNATURE EMBEDDED ✓"}</div>}
              {currentStep > 2 && <div>{"> DID CREDENTIAL EMBEDDED ✓"}</div>}
              {isComplete && (
                <>
                  <div>{"> UPLOADING TO IPFS..."}</div>
                  <div>
                    {"> CID: QmX7Hd9K2pL8vN3mR5tY6wZ1aB4cE7fG9hJ0kL2mN5oP8qR"}
                  </div>
                  <div className="text-white">
                    {"> PROOF GENERATION COMPLETE ✓"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Continue Button */}
          {isComplete && (
            <div className="text-center">
              <Link
                href={`/result?tier=${tier}&cid=QmX7Hd9K2pL8vN3mR5tY6wZ1aB4cE7fG9hJ0kL2mN5oP8qR`}
              >
                <Button className="px-12 py-6 bg-black text-white border-4 border-black font-bold uppercase text-lg hover:bg-white hover:text-black transition-colors">
                  VIEW RESULT
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
