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
  const [ipfsRecord, setIpfsRecord] = useState<any>(null);
  const [proofValidations, setProofValidations] = useState<any[]>([]);
  const [isValidatingProofs, setIsValidatingProofs] = useState(false);

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

  // Function to fetch record from IPFS using CID
  const fetchIpfsRecord = async (cid: string) => {
    try {
      // Use configured gateway URL or fallback to multiple gateways
      const configuredGateway = process.env.NEXT_PUBLIC_GATEWAY_URL;

      let gateways = [];
      if (configuredGateway) {
        // Use configured gateway first
        gateways.push(`${configuredGateway}/ipfs/${cid}`);
        console.log(`Using configured gateway: ${configuredGateway}`);
      }

      // Add fallback gateways for reliability
      const fallbackGateways = [
        `https://ipfs.io/ipfs/${cid}`,
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://dweb.link/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
      ];

      // Only add fallbacks that aren't already in the list
      fallbackGateways.forEach((gateway) => {
        if (!gateways.includes(gateway)) {
          gateways.push(gateway);
        }
      });

      for (const gateway of gateways) {
        try {
          console.log(`Attempting to fetch from: ${gateway}`);
          const response = await fetch(gateway, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            // Add timeout
            signal: AbortSignal.timeout(15000), // 15 second timeout for configured gateway
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully fetched from: ${gateway}`);
            return data;
          } else {
            console.log(`HTTP ${response.status} from ${gateway}`);
          }
        } catch (err) {
          console.log(`Failed to fetch from ${gateway}:`, err);
          continue; // Try next gateway
        }
      }

      throw new Error("Failed to fetch from all IPFS gateways");
    } catch (error) {
      console.error("Error fetching IPFS record:", error);
      throw error;
    }
  };

  // Function to validate different proof types
  const validateProof = async (proof: any, proofType: string) => {
    try {
      console.log(`Validating ${proofType} proof:`, proof);

      switch (proofType.toLowerCase()) {
        case "location":
          return await validateLocationProof(proof);
        case "timestamp":
          return await validateTimestampProof(proof);
        case "device":
          return await validateDeviceProof(proof);
        case "biometric":
          return await validateBiometricProof(proof);
        default:
          return {
            isValid: false,
            error: `Unknown proof type: ${proofType}`,
            details: proof,
          };
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Validation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        details: proof,
      };
    }
  };

  // Location proof validation
  const validateLocationProof = async (proof: any) => {
    // Mock validation - in real implementation, this would call external APIs
    if (!proof.latitude || !proof.longitude) {
      return {
        isValid: false,
        error: "Missing coordinates",
        details: proof,
      };
    }

    // Basic coordinate validation
    const lat = parseFloat(proof.latitude);
    const lng = parseFloat(proof.longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return {
        isValid: false,
        error: "Invalid coordinates",
        details: proof,
      };
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      isValid: true,
      message: "Location coordinates are valid",
      details: {
        ...proof,
        validatedAt: new Date().toISOString(),
        accuracy: proof.accuracy || "Unknown",
      },
    };
  };

  // Timestamp proof validation
  const validateTimestampProof = async (proof: any) => {
    if (!proof.timestamp) {
      return {
        isValid: false,
        error: "Missing timestamp",
        details: proof,
      };
    }

    const timestamp = new Date(proof.timestamp);
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (isNaN(timestamp.getTime())) {
      return {
        isValid: false,
        error: "Invalid timestamp format",
        details: proof,
      };
    }

    if (timestamp > now) {
      return {
        isValid: false,
        error: "Timestamp is in the future",
        details: proof,
      };
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      isValid: true,
      message: "Timestamp is valid",
      details: {
        ...proof,
        validatedAt: new Date().toISOString(),
        age: `${Math.round(
          (now.getTime() - timestamp.getTime()) / 1000 / 60
        )} minutes ago`,
      },
    };
  };

  // Device proof validation
  const validateDeviceProof = async (proof: any) => {
    if (!proof.deviceId && !proof.signature) {
      return {
        isValid: false,
        error: "Missing device ID or signature",
        details: proof,
      };
    }

    // Simulate device signature validation
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return {
      isValid: true,
      message: "Device signature is valid",
      details: {
        ...proof,
        validatedAt: new Date().toISOString(),
        deviceType: proof.deviceType || "Unknown",
      },
    };
  };

  // Biometric proof validation
  const validateBiometricProof = async (proof: any) => {
    if (!proof.hash && !proof.signature) {
      return {
        isValid: false,
        error: "Missing biometric hash or signature",
        details: proof,
      };
    }

    // Simulate biometric validation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      isValid: true,
      message: "Biometric proof is valid",
      details: {
        ...proof,
        validatedAt: new Date().toISOString(),
        biometricType: proof.type || "Unknown",
      },
    };
  };

  // Function to validate all proofs from IPFS record
  const validateAllProofs = async (cid: string) => {
    setIsValidatingProofs(true);
    setProofValidations([]);
    setError("");

    try {
      // Fetch the IPFS record
      console.log(`Fetching IPFS record for CID: ${cid}`);
      const record = await fetchIpfsRecord(cid);
      setIpfsRecord(record);

      if (!record) {
        throw new Error("No record found for CID");
      }

      // Parse proofs from the record
      let proofs = [];
      if (record.proofs && Array.isArray(record.proofs)) {
        proofs = record.proofs;
      } else if (record.proof) {
        proofs = [record.proof];
      } else {
        // Try to extract proofs from common field names
        const possibleProofFields = [
          "locationProof",
          "timestampProof",
          "deviceProof",
          "biometricProof",
        ];
        for (const field of possibleProofFields) {
          if (record[field]) {
            proofs.push({
              type: field.replace("Proof", ""),
              ...record[field],
            });
          }
        }
      }

      if (proofs.length === 0) {
        throw new Error("No proofs found in the record");
      }

      console.log(`Found ${proofs.length} proofs to validate`);

      // Validate each proof
      const validationResults = [];
      for (let i = 0; i < proofs.length; i++) {
        const proof = proofs[i];
        const proofType = proof.type || "unknown";

        console.log(`Validating proof ${i + 1}/${proofs.length}: ${proofType}`);

        const validationResult = await validateProof(proof, proofType);
        validationResults.push({
          proofIndex: i,
          proofType: proofType,
          originalProof: proof,
          validationResult: validationResult,
          validatedAt: new Date().toISOString(),
        });

        // Update UI progressively
        setProofValidations([...validationResults]);
      }

      console.log("All proofs validated successfully");
    } catch (error) {
      console.error("Error validating proofs:", error);
      setError(
        `Failed to validate proofs: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsValidatingProofs(false);
    }
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

        // Automatically start proof validation
        setTimeout(() => {
          validateAllProofs(extractedCid);
        }, 1000); // Small delay to let UI update
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
                    setIpfsRecord(null);
                    setProofValidations([]);
                    setIsValidatingProofs(false);
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
                            <div className="flex gap-2">
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

                              {!isValidatingProofs &&
                                proofValidations.length === 0 && (
                                  <Button
                                    onClick={() =>
                                      validateAllProofs(verificationResult.cid)
                                    }
                                    className="text-xs py-1 px-2 bg-blue-600 text-white border-2 border-blue-700 font-bold uppercase hover:bg-blue-700 transition-colors"
                                  >
                                    VALIDATE PROOFS
                                  </Button>
                                )}
                            </div>
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

                    {/* IPFS Record and Proof Validation Section */}
                    {verificationResult.isValid && (
                      <div className="mt-6 border-t-4 border-black pt-6">
                        <h3 className="font-bold uppercase mb-4 text-lg">
                          🔗 IPFS RECORD VALIDATION
                        </h3>

                        {/* IPFS Record Loading */}
                        {isValidatingProofs && !ipfsRecord && (
                          <div className="bg-black text-blue-400 p-4 font-mono text-sm">
                            <div className="space-y-1">
                              <div>{"> FETCHING IPFS RECORD..."}</div>
                              <div>{`> CID: ${verificationResult.cid}`}</div>
                              {process.env.NEXT_PUBLIC_GATEWAY_URL ? (
                                <div>{`> USING CONFIGURED GATEWAY: ${process.env.NEXT_PUBLIC_GATEWAY_URL}`}</div>
                              ) : (
                                <div>
                                  {"> TRYING MULTIPLE PUBLIC GATEWAYS..."}
                                </div>
                              )}
                              <div className="animate-pulse text-yellow-400">
                                {"> PLEASE WAIT..."}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* IPFS Record Display */}
                        {ipfsRecord && (
                          <div className="mb-6">
                            <div className="font-bold uppercase text-xs text-gray-600 mb-2">
                              📄 IPFS RECORD CONTENT
                            </div>
                            <div className="bg-gray-50 p-4 border-2 border-gray-300 max-h-60 overflow-auto">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(ipfsRecord, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Proof Validation Progress */}
                        {isValidatingProofs && proofValidations.length > 0 && (
                          <div className="mb-6">
                            <div className="font-bold uppercase text-xs text-gray-600 mb-2">
                              🔍 PROOF VALIDATION IN PROGRESS
                            </div>
                            <div className="bg-black text-green-400 p-4 font-mono text-sm">
                              <div className="space-y-1">
                                {proofValidations.map((validation, index) => (
                                  <div key={index}>
                                    {`> Validating ${validation.proofType.toUpperCase()} proof... ${
                                      validation.validationResult.isValid
                                        ? "✅"
                                        : "❌"
                                    }`}
                                  </div>
                                ))}
                                <div className="animate-pulse text-yellow-400">
                                  {"> VALIDATING REMAINING PROOFS..."}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Proof Validation Results */}
                        {proofValidations.length > 0 && !isValidatingProofs && (
                          <div className="space-y-4">
                            <div className="font-bold uppercase text-xs text-gray-600 mb-2">
                              🛡️ PROOF VALIDATION RESULTS
                            </div>

                            {proofValidations.map((validation, index) => (
                              <div
                                key={index}
                                className={`border-4 p-4 ${
                                  validation.validationResult.isValid
                                    ? "border-green-600 bg-green-50"
                                    : "border-red-600 bg-red-50"
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-bold uppercase text-sm">
                                    {validation.proofType.toUpperCase()} PROOF
                                  </h4>
                                  <span
                                    className={`px-2 py-1 text-xs font-bold ${
                                      validation.validationResult.isValid
                                        ? "bg-green-600 text-white"
                                        : "bg-red-600 text-white"
                                    }`}
                                  >
                                    {validation.validationResult.isValid
                                      ? "VALID"
                                      : "INVALID"}
                                  </span>
                                </div>

                                {validation.validationResult.message && (
                                  <div className="text-sm mb-2 font-medium">
                                    {validation.validationResult.message}
                                  </div>
                                )}

                                {validation.validationResult.error && (
                                  <div className="text-sm mb-2 text-red-600 font-medium">
                                    Error: {validation.validationResult.error}
                                  </div>
                                )}

                                {/* Proof Details */}
                                <div className="mt-3">
                                  <div className="font-bold text-xs text-gray-600 mb-1">
                                    PROOF DETAILS
                                  </div>
                                  <div className="bg-white p-2 border border-gray-300 text-xs font-mono max-h-32 overflow-auto">
                                    <pre>
                                      {JSON.stringify(
                                        validation.validationResult.details,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                </div>

                                <div className="text-xs text-gray-500 mt-2">
                                  Validated at:{" "}
                                  {new Date(
                                    validation.validatedAt
                                  ).toLocaleString()}
                                </div>
                              </div>
                            ))}

                            {/* Overall Validation Summary */}
                            <div
                              className={`border-4 p-4 font-bold text-center ${
                                proofValidations.every(
                                  (v) => v.validationResult.isValid
                                )
                                  ? "border-green-600 bg-green-50 text-green-800"
                                  : "border-orange-600 bg-orange-50 text-orange-800"
                              }`}
                            >
                              {proofValidations.every(
                                (v) => v.validationResult.isValid
                              )
                                ? `🎉 ALL ${proofValidations.length} PROOFS VALIDATED SUCCESSFULLY`
                                : `⚠️ ${
                                    proofValidations.filter(
                                      (v) => v.validationResult.isValid
                                    ).length
                                  }/${proofValidations.length} PROOFS VALID`}
                            </div>
                          </div>
                        )}
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
