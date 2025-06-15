"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { backendService } from "@/lib/backend-service";

export default function VerifyPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string>("");

  // Function to clean CID by removing special characters
  const cleanCid = (cid: string): string => {
    // Remove any non-alphanumeric characters from CID
    // IPFS CIDs should only contain letters and numbers
    return cid.replace(/[^a-zA-Z0-9]/g, "");
  };

  // Function to validate if a string looks like a valid IPFS CID
  const isValidCid = (cid: string): boolean => {
    // Basic validation: CID should start with known prefixes and have reasonable length
    const validPrefixes = ["Qm", "baf", "bag", "bah", "bai", "baj"];
    const hasValidPrefix = validPrefixes.some((prefix) =>
      cid.startsWith(prefix)
    );
    const hasValidLength = cid.length >= 40 && cid.length <= 100; // Reasonable CID length range
    return hasValidPrefix && hasValidLength;
  };

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

        // Create video URL for preview
        const url = URL.createObjectURL(droppedFile);
        setVideoUrl(url);

        verifyFile(droppedFile);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Create video URL for preview
      const url = URL.createObjectURL(selectedFile);
      setVideoUrl(url);

      verifyFile(selectedFile);
    }
  };

  const verifyFile = async (file: File) => {
    setIsVerifying(true);
    setVerificationResult(null);
    setError("");

    try {
      // Call the backend decrypt service
      const result = await backendService.decryptVideo(file);
      console.log("Decryption result:", result);

      // Check if we have any extracted data
      const hasBorderData = result.border_data && result.border_data.trim();
      const hasStegoData = result.stego_data && result.stego_data.trim();

      let extractedCid = null;
      let originalCid = null;
      let dataSource = "";
      let rawData = "";

      if (hasBorderData) {
        rawData = result.border_data.trim();
        dataSource = "border";

        // Extract CID from border data (look for STEGO: prefix)
        if (rawData.startsWith("STEGO:")) {
          originalCid = rawData.substring(6).trim();
        } else {
          originalCid = rawData;
        }
        extractedCid = cleanCid(originalCid);
      } else if (hasStegoData) {
        rawData = result.stego_data.trim();
        dataSource = "steganography";
        originalCid = rawData;
        extractedCid = cleanCid(rawData);
      }

      if (extractedCid && isValidCid(extractedCid)) {
        // Successful extraction with valid CID
        setVerificationResult({
          isValid: true,
          cid: extractedCid,
          originalCid: originalCid,
          dataSource: dataSource,
          rawData: rawData,
          timestamp: new Date().toISOString(),
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });
      } else if (extractedCid && !isValidCid(extractedCid)) {
        // Data found but doesn't look like valid CID
        setVerificationResult({
          isValid: false,
          error: `Extracted data doesn't appear to be a valid CID: ${extractedCid}`,
          originalCid: originalCid,
          dataSource: dataSource,
          rawData: rawData,
          timestamp: new Date().toISOString(),
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });
      } else {
        // No data found
        setVerificationResult({
          isValid: false,
          error: "No steganographic data found in video",
          dataSource: null,
          timestamp: new Date().toISOString(),
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setVerificationResult({
        isValid: false,
        error:
          error instanceof Error ? error.message : "Failed to verify video",
        timestamp: new Date().toISOString(),
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });
    } finally {
      setIsVerifying(false);
    }
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

                {videoUrl && (
                  <div className="mb-4">
                    <div className="font-bold uppercase text-xs text-gray-600 mb-2">
                      VIDEO PREVIEW
                    </div>
                    <video
                      controls
                      className="w-full border-2 border-gray-300 max-h-48"
                      src={videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

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
                    setError("");
                    // Clean up video URL
                    if (videoUrl) {
                      URL.revokeObjectURL(videoUrl);
                      setVideoUrl(null);
                    }
                    // Reset file input
                    const fileInput = document.getElementById(
                      "fileInput"
                    ) as HTMLInputElement;
                    if (fileInput) fileInput.value = "";
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
                        <div>{"> ANALYZING VIDEO FRAMES..."}</div>
                        <div>{"> SCANNING FOR BORDER STEGANOGRAPHY..."}</div>
                        <div>{"> CHECKING LSB STEGANOGRAPHIC DATA..."}</div>
                        <div>{"> EXTRACTING EMBEDDED INFORMATION..."}</div>
                        <div className="animate-pulse text-yellow-400">
                          {"> PROCESSING..."}
                        </div>
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
                            EXTRACTION METHOD
                          </div>
                          <div className="bg-gray-100 p-2 border-2 border-gray-300 font-bold">
                            {verificationResult.dataSource === "border"
                              ? "BORDER STEGANOGRAPHY"
                              : "LSB STEGANOGRAPHY"}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                            VERIFICATION LOG
                          </div>
                          <div className="bg-black text-green-400 p-3 font-mono text-xs">
                            <div>{"> Analyzing video frames... ✅"}</div>
                            <div>{`> Extracting ${verificationResult.dataSource} data... ✅`}</div>
                            <div>{"> Parsing embedded information... ✅"}</div>
                            <div>{"> CID successfully extracted ✅"}</div>
                          </div>
                        </div>

                        <div>
                          <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                            EXTRACTED CID
                          </div>
                          <div className="bg-green-50 p-3 border-2 border-green-300 break-all text-xs font-mono">
                            <div className="font-bold text-green-800 mb-1">
                              IPFS CID:
                            </div>
                            <div className="text-green-600 mb-2">
                              {verificationResult.cid}
                            </div>
                            {verificationResult.originalCid &&
                              verificationResult.originalCid !==
                                verificationResult.cid && (
                                <div className="text-xs text-blue-600 mb-2 bg-blue-50 p-1 rounded">
                                  ℹ️ Special characters removed from extracted
                                  data
                                  <div className="font-mono text-gray-500 mt-1">
                                    Original: {verificationResult.originalCid}
                                  </div>
                                </div>
                              )}
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  verificationResult.cid
                                );
                                // Could add toast notification here
                              }}
                              className="text-xs py-1 px-2 bg-green-600 text-white border-2 border-green-700 font-bold uppercase hover:bg-green-700 transition-colors"
                            >
                              COPY CID
                            </Button>
                          </div>
                        </div>

                        {verificationResult.rawData &&
                          verificationResult.rawData !==
                            verificationResult.cid && (
                            <div>
                              <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                                RAW EXTRACTED DATA
                              </div>
                              <div className="bg-gray-100 p-2 border-2 border-gray-300 break-all text-xs">
                                {verificationResult.rawData}
                              </div>
                            </div>
                          )}

                        <div>
                          <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                            EXTRACTION TIMESTAMP
                          </div>
                          <div className="bg-gray-100 p-2 border-2 border-gray-300 text-xs">
                            {new Date(
                              verificationResult.timestamp
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {!verificationResult.isValid && (
                      <div className="bg-black text-red-400 p-4 font-mono text-sm">
                        <div>{"> ERROR: No steganographic data found"}</div>
                        <div>{"> Video may not contain DeeperTruth proof"}</div>
                        <div>{"> Or may be corrupted/tampered with"}</div>
                        {verificationResult.error && (
                          <div className="mt-2 text-yellow-400">
                            {`> Details: ${verificationResult.error}`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error display */}
                    {error && (
                      <div className="border-4 border-red-600 bg-red-50 p-4">
                        <h3 className="font-bold uppercase text-red-800 mb-2">
                          BACKEND ERROR
                        </h3>
                        <p className="text-red-600 font-mono text-sm">
                          {error}
                        </p>
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
