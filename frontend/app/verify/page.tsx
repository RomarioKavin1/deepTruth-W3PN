"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("video/")) {
        setFile(droppedFile);
        verifyFile(droppedFile);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      verifyFile(selectedFile);
    }
  };

  const verifyFile = async (file: File) => {
    setIsVerifying(true);
    setVerificationResult(null);

    // Simulate verification process
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock verification result
    const mockResult = {
      isValid: Math.random() > 0.3, // 70% chance of valid
      tier: "identity",
      cid: "QmX7Hd9K2pL8vN3mR5tY6wZ1aB4cE7fG9hJ0kL2mN5oP8qR",
      timestamp: new Date().toISOString(),
      worldIdValid: true,
      walletValid: true,
      didValid: true,
      hash: "0x7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730",
    };

    setVerificationResult(mockResult);
    setIsVerifying(false);
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
            VERIFICATION
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-8 text-center">
            VERIFY VIDEO AUTHENTICITY
          </h1>

          {!file && (
            <div className="mb-8">
              <div
                className={`border-4 border-dashed p-16 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-black bg-gray-50"
                    : "border-gray-400 hover:border-black hover:bg-gray-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <div className="space-y-4">
                  <div className="text-6xl">📁</div>
                  <div>
                    <h2 className="text-2xl font-bold uppercase mb-2">
                      DROP VIDEO HERE TO VERIFY AUTHENTICITY
                    </h2>
                    <p className="text-gray-600 font-mono">
                      OR CLICK TO SELECT FILE
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    SUPPORTED: MP4, MOV, AVI • MAX 100MB
                  </div>
                </div>

                <input
                  id="fileInput"
                  type="file"
                  accept="video/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {file && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* File Info */}
              <div className="border-4 border-black bg-white p-6">
                <h2 className="font-bold uppercase mb-4 border-b-2 border-black pb-2">
                  FILE INFORMATION
                </h2>

                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      FILENAME
                    </div>
                    <div className="bg-gray-100 p-2 border-2 border-gray-300 break-all">
                      {file.name}
                    </div>
                  </div>

                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      SIZE
                    </div>
                    <div className="bg-gray-100 p-2 border-2 border-gray-300">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>

                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      TYPE
                    </div>
                    <div className="bg-gray-100 p-2 border-2 border-gray-300">
                      {file.type}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setFile(null);
                    setVerificationResult(null);
                  }}
                  className="w-full mt-4 bg-white text-black border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors"
                >
                  SELECT DIFFERENT FILE
                </Button>
              </div>

              {/* Verification Results */}
              <div className="border-4 border-black bg-white p-6">
                <h2 className="font-bold uppercase mb-4 border-b-2 border-black pb-2">
                  VERIFICATION STATUS
                </h2>

                {isVerifying && (
                  <div className="space-y-4">
                    <div className="border-4 border-black bg-black text-green-400 p-4 font-mono text-sm">
                      <div className="space-y-1">
                        <div>{"> ANALYZING VIDEO FILE..."}</div>
                        <div>{"> EXTRACTING STEGANOGRAPHIC DATA..."}</div>
                        <div>{"> VERIFYING CRYPTOGRAPHIC SIGNATURES..."}</div>
                        <div className="animate-pulse">{"> PROCESSING..."}</div>
                      </div>
                    </div>
                  </div>
                )}

                {verificationResult && (
                  <div className="space-y-4">
                    <div
                      className={`border-4 p-4 font-bold text-center text-lg ${
                        verificationResult.isValid
                          ? "border-green-600 bg-green-50 text-green-800"
                          : "border-red-600 bg-red-50 text-red-800"
                      }`}
                    >
                      {verificationResult.isValid
                        ? "✅ VALID PROOF"
                        : "❌ INVALID / TAMPERED"}
                    </div>

                    {verificationResult.isValid && (
                      <div className="space-y-3 font-mono text-sm">
                        <div>
                          <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                            PRIVACY TIER
                          </div>
                          <div className="bg-gray-100 p-2 border-2 border-gray-300 font-bold">
                            {verificationResult.tier.toUpperCase()}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                            VERIFICATION LOG
                          </div>
                          <div className="bg-black text-green-400 p-3 font-mono text-xs">
                            <div>{"> Checking hash... ✅"}</div>
                            <div>{"> CID match ✅"}</div>
                            <div>{"> WorldID nullifier valid ✅"}</div>
                            <div>{"> Wallet signature verified ✅"}</div>
                            <div>{"> DID credential valid ✅"}</div>
                          </div>
                        </div>

                        <div>
                          <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                            IPFS CID
                          </div>
                          <div className="bg-gray-100 p-2 border-2 border-gray-300 break-all text-xs">
                            {verificationResult.cid}
                          </div>
                        </div>
                      </div>
                    )}

                    {!verificationResult.isValid && (
                      <div className="bg-black text-red-400 p-4 font-mono text-sm">
                        <div>
                          {"> ERROR: No valid steganographic proof found"}
                        </div>
                        <div>
                          {
                            "> This video may be tampered or not created with DeeperTruth"
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
