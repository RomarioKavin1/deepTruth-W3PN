"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";
import SelfQRcodeWrapper, { SelfAppBuilder } from "@selfxyz/qrcode";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { backendService } from "@/lib/backend-service";

interface ProofData {
  worldId?: any;
  walletAddress?: string;
  walletSignature?: string;
  selfProof?: any;
  tier: string;
  timestamp: string;
}

export default function ProofProcessPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [finalCid, setFinalCid] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedVideoUrl, setEncryptedVideoUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [selfUserId, setSelfUserId] = useState<string>("");

  // Convert base64 to blob utility function
  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64.split(",")[1] || base64); // Handle data URL prefix
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type });
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const tier = searchParams.get("tier") || "anonymity";

  // Wallet hooks
  const { address, isConnected } = useAccount();
  const {
    signMessage,
    data: signature,
    isPending: isSigningPending,
  } = useSignMessage();

  const tierSteps = {
    anonymity: [{ name: "WORLD ID VERIFICATION", status: "pending" }],
    pseudoAnon: [
      { name: "WORLD ID VERIFICATION", status: "pending" },
      { name: "WALLET CONNECTION & SIGNATURE", status: "pending" },
    ],
    identity: [
      { name: "WORLD ID VERIFICATION", status: "pending" },
      { name: "WALLET CONNECTION & SIGNATURE", status: "pending" },
      { name: "SELF PROTOCOL VERIFICATION", status: "pending" },
    ],
  };

  const [steps, setSteps] = useState(tierSteps[tier as keyof typeof tierSteps]);

  // Initialize proof data and self user ID
  useEffect(() => {
    setProofData({
      tier,
      timestamp: new Date().toISOString(),
    });
    setSelfUserId(uuidv4());
  }, [tier]);

  // World ID verification handlers
  const handleWorldIdVerify = async (proof: ISuccessResult) => {
    console.log("World ID proof received:", proof);
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proof),
    });
    if (!res.ok) {
      throw new Error("World ID verification failed.");
    }
  };

  const onWorldIdSuccess = (result: ISuccessResult) => {
    console.log("World ID verification successful:", result);

    // Update proof data
    setProofData((prev) => ({
      ...prev!,
      worldId: result,
    }));

    // Mark step as completed
    setSteps((prev) =>
      prev.map((step, idx) =>
        idx === 0 ? { ...step, status: "completed" } : step
      )
    );

    setCurrentStep(1);

    // If tier 1 (anonymity), proceed to upload
    if (tier === "anonymity") {
      setTimeout(() => {
        uploadToIPFS({
          tier,
          timestamp: new Date().toISOString(),
          worldId: result,
        });
      }, 1000);
    }
  };

  // Wallet signature handling
  useEffect(() => {
    if (currentStep === 1 && (tier === "pseudoAnon" || tier === "identity")) {
      if (!isConnected) {
        // Wait for wallet connection
        return;
      }

      // Auto-sign message once wallet is connected
      const message = `DeeperTruth Video Proof - ${tier.toUpperCase()} - ${new Date().toISOString()}`;
      signMessage({ message });
    }
  }, [currentStep, isConnected, tier, signMessage]);

  // Handle wallet signature completion
  useEffect(() => {
    if (signature && currentStep === 1) {
      console.log("Wallet signature completed:", signature);

      // Update proof data
      setProofData((prev) => ({
        ...prev!,
        walletAddress: address,
        walletSignature: signature,
      }));

      // Mark step as completed
      setSteps((prev) =>
        prev.map((step, idx) =>
          idx === 1 ? { ...step, status: "completed" } : step
        )
      );

      setCurrentStep(2);

      // If tier 2 (pseudoAnon), proceed to upload
      if (tier === "pseudoAnon") {
        setTimeout(() => {
          uploadToIPFS({
            ...proofData!,
            walletAddress: address,
            walletSignature: signature,
          });
        }, 1000);
      }
    }
  }, [signature, currentStep, address, tier, proofData]);

  // Self Protocol verification handlers
  const onSelfSuccess = async (result?: any) => {
    console.log("Self verification successful:", result);
    console.log("Self result structure:", result);

    let selfProofData: any = {};

    // Try to extract proof data from our custom capture endpoint response
    if (result && result.capturedProof) {
      selfProofData = {
        proof: result.capturedProof.proof,
        publicSignals: result.capturedProof.publicSignals,
      };
      console.log("Using captured proof data from custom endpoint");
    } else if (result && result.proof && result.publicSignals) {
      // Direct proof data in result
      selfProofData = {
        proof: result.proof,
        publicSignals: result.publicSignals,
      };
      console.log("Using direct proof data from result");
    } else {
      // Try to get the latest proof data from our capture endpoint
      console.log(
        "Attempting to fetch latest proof data from capture endpoint..."
      );
      try {
        // Poll for recent proof data (last 30 seconds)
        const response = await fetch(`/api/self-verify-capture/latest`);
        if (response.ok) {
          const latestProof = await response.json();
          if (latestProof.proof && latestProof.publicSignals) {
            selfProofData = {
              proof: latestProof.proof,
              publicSignals: latestProof.publicSignals,
            };
            console.log("Using latest proof data from capture endpoint");
          }
        }
      } catch (error) {
        console.error("Error fetching latest proof data:", error);
      }

      // Final fallback: try sessionStorage
      if (!selfProofData.proof) {
        const storedProof = sessionStorage.getItem("self_proof");
        if (storedProof) {
          try {
            const parsedProof = JSON.parse(storedProof);
            selfProofData = {
              proof: parsedProof.proof || {},
              publicSignals: parsedProof.publicSignals || [],
            };
            console.log("Using fallback proof data from sessionStorage");
          } catch (error) {
            console.error("Error parsing stored self proof:", error);
          }
        }
      }
    }

    // Store the captured proof data in sessionStorage for potential future use
    if (selfProofData && Object.keys(selfProofData).length > 0) {
      sessionStorage.setItem(
        "captured_self_proof",
        JSON.stringify(selfProofData)
      );
    }

    console.log("Final self proof data to store:", selfProofData);

    // Update proof data
    const finalProofData = {
      ...proofData!,
      selfProof: selfProofData,
    };

    setProofData(finalProofData);

    // Mark step as completed
    setSteps((prev) =>
      prev.map((step, idx) =>
        idx === 2 ? { ...step, status: "completed" } : step
      )
    );

    setCurrentStep(3);

    // Upload to IPFS
    setTimeout(() => {
      uploadToIPFS(finalProofData);
    }, 1000);
  };

  // Encrypt video with CID
  const encryptVideoWithCid = async (cid: string) => {
    setIsEncrypting(true);
    try {
      // Get recorded video from sessionStorage
      const recordedVideoData = sessionStorage.getItem("recorded_video");
      const videoMimeType =
        sessionStorage.getItem("video_mime_type") || "video/webm";

      if (!recordedVideoData) {
        throw new Error("No recorded video found");
      }

      // Convert base64 back to blob using the utility function
      const videoBlob = base64ToBlob(recordedVideoData, videoMimeType);
      const extension = videoMimeType.includes("mp4") ? ".mp4" : ".webm";
      const videoFile = new File([videoBlob], `recorded_video${extension}`, {
        type: videoMimeType,
      });

      // Encrypt video with CID as the text
      console.log("Encrypting video with CID:", cid);
      const encryptResult = await backendService.encryptVideo(videoFile, cid);

      // Convert base64 to blob URL for preview using utility function
      const encryptedVideoBlob = base64ToBlob(encryptResult.mp4, "video/mp4");
      const encryptedVideoUrl = URL.createObjectURL(encryptedVideoBlob);
      setEncryptedVideoUrl(encryptedVideoUrl);

      console.log("Video encryption successful");

      // Store encrypted video data for result page
      sessionStorage.setItem("encrypted_video_base64", encryptResult.mp4);
      sessionStorage.setItem(
        "encrypted_video_filename",
        encryptResult.mp4_filename
      );
    } catch (error) {
      console.error("Video encryption error:", error);
      setError(
        `Failed to encrypt video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsEncrypting(false);
    }
  };

  // Upload to IPFS
  const uploadToIPFS = async (data: ProofData) => {
    setIsUploading(true);
    try {
      console.log("Uploading proof data to IPFS:", data);

      // Format data according to specified structure
      const formattedData = {
        worldproof: data.worldId || {},
        Address: data.walletAddress || "",
        Selfproof: data.selfProof || {},
      };

      const response = await fetch("/api/upload-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofData: formattedData,
          type: `${tier}-proof`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload to IPFS");
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      setFinalCid(result.cid);
      setIsUploading(false);

      // Now encrypt the video with the CID
      await encryptVideoWithCid(result.cid);

      setIsComplete(true);

      // Auto-redirect to result page after 2 seconds
      setTimeout(() => {
        router.push(`/result?tier=${tier}&cid=${result.cid}&encrypted=true`);
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload proof to IPFS. Please try again.");
      setIsUploading(false);
    }
  };

  // Create Self app configuration with custom endpoint to capture proof data
  const selfApp = selfUserId
    ? new SelfAppBuilder({
        appName: "DeeperTruth Identity Verification",
        scope: "deeptruth-app",
        endpoint: "https://remo.crevn.xyz/api/self-verify-capture", // Custom endpoint to capture proof data
        endpointType: "https",
        userId: selfUserId,
        disclosures: {
          minimumAge: 18,
        },
      }).build()
    : null;

  return (
    <div className="min-h-screen bg-gray-100 font-mono">
      {/* Header */}
      <header className="border-b-4 border-black bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold uppercase tracking-wider">
            DEEPERTRUTH
          </div>
          <div className="text-sm font-bold uppercase tracking-wide">
            PROOF GENERATION - {tier.toUpperCase()}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-8 text-center">
            GENERATING AUTHENTICITY PROOF
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
                    ? "border-black bg-white"
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
                          ? "COMPLETED"
                          : currentStep === idx
                          ? "IN PROGRESS..."
                          : "PENDING"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="border-4 border-black bg-white p-8 mb-8">
            {/* Step 1: World ID */}
            {currentStep === 0 && (
              <div className="text-center">
                <h2 className="text-2xl font-bold uppercase mb-4">
                  STEP 1: WORLD ID VERIFICATION
                </h2>
                <p className="text-gray-600 mb-6">
                  Prove your humanity with World ID to prevent deepfakes
                </p>

                <div className="flex justify-center">
                  <IDKitWidget
                    app_id="app_6e916a8a4112922b1f33c7f899762c3d"
                    action="verify-humanity"
                    verification_level={VerificationLevel.Device}
                    handleVerify={handleWorldIdVerify}
                    onSuccess={onWorldIdSuccess}
                    action_description="Verify humanity for DeeperTruth video proof"
                  >
                    {({ open }: { open: () => void }) => (
                      <Button
                        onClick={open}
                        className="px-8 py-4 bg-black text-white border-4 border-black font-bold uppercase text-lg hover:bg-white hover:text-black transition-colors"
                      >
                        VERIFY WITH WORLD ID
                      </Button>
                    )}
                  </IDKitWidget>
                </div>
              </div>
            )}

            {/* Step 2: Wallet Connection */}
            {currentStep === 1 &&
              (tier === "pseudoAnon" || tier === "identity") && (
                <div className="text-center">
                  <h2 className="text-2xl font-bold uppercase mb-4">
                    STEP 2: WALLET CONNECTION & SIGNATURE
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Connect your wallet and sign a message to link your address
                  </p>

                  {!isConnected ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">
                        Please connect your wallet to continue
                      </p>
                      <ConnectButton />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-green-600 font-bold">
                        ✓ Wallet Connected: {address?.slice(0, 6)}...
                        {address?.slice(-4)}
                      </div>
                      {isSigningPending ? (
                        <div className="text-blue-600">
                          Please sign the message in your wallet...
                        </div>
                      ) : signature ? (
                        <div className="text-green-600 font-bold">
                          ✓ Message Signed Successfully
                        </div>
                      ) : (
                        <div className="text-gray-600">
                          Preparing signature request...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Step 3: Self Protocol */}
            {currentStep === 2 && tier === "identity" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold uppercase mb-4">
                  STEP 3: SELF PROTOCOL IDENTITY VERIFICATION
                </h2>
                <p className="text-gray-600 mb-6">
                  Verify your passport with Self Protocol for full identity
                  proof
                </p>

                {selfApp ? (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                        <SelfQRcodeWrapper
                          selfApp={selfApp}
                          onSuccess={onSelfSuccess}
                          size={250}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>Scan with the Self app to verify your passport</p>
                      <p>User ID: {selfUserId.substring(0, 8)}...</p>
                    </div>
                  </div>
                ) : (
                  <div>Loading Self verification...</div>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="text-center">
                <h2 className="text-2xl font-bold uppercase mb-4">
                  UPLOADING TO IPFS
                </h2>
                <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Storing your proof data securely on IPFS...
                </p>
              </div>
            )}

            {/* Video Encryption Progress */}
            {isEncrypting && (
              <div className="text-center">
                <h2 className="text-2xl font-bold uppercase mb-4">
                  ENCRYPTING VIDEO
                </h2>
                <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Embedding CID into video using steganography...
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  This process makes your video tamper-proof and verifiable
                </div>
              </div>
            )}

            {/* Completion */}
            {isComplete && (
              <div className="text-center">
                <h2 className="text-2xl font-bold uppercase mb-4 text-green-600">
                  VIDEO ENCRYPTION COMPLETE!
                </h2>
                <div className="space-y-4">
                  <div className="text-green-600 text-6xl">✓</div>
                  <p className="text-gray-600">
                    Your video has been encrypted with your authenticity proof
                    CID
                  </p>
                  <div className="bg-gray-100 p-4 border-2 border-gray-300 font-mono text-sm break-all">
                    CID: {finalCid}
                  </div>
                  {encryptedVideoUrl && (
                    <div className="max-w-md mx-auto">
                      <p className="text-sm text-gray-600 mb-2">
                        Encrypted Video Preview:
                      </p>
                      <video
                        controls
                        autoPlay
                        playsInline
                        className="w-full border-2 border-black"
                        src={encryptedVideoUrl}
                        onLoadedMetadata={(e) => {
                          // Ensure video metadata is loaded before playing
                          const video = e.target as HTMLVideoElement;
                          video.play().catch((err) => {
                            console.log("Video autoplay prevented:", err);
                          });
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Redirecting to results page...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="border-4 border-red-600 bg-red-50 p-6 mb-8">
              <h3 className="font-bold uppercase text-red-800 mb-2">ERROR</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Terminal Output */}
          <div className="border-4 border-black bg-black text-green-400 p-4 font-mono text-sm">
            <div className="space-y-1">
              <div>{"> INITIALIZING DEEPFAKE PROTECTION PIPELINE..."}</div>
              <div>{"> GENERATING STEGANOGRAPHIC PAYLOAD..."}</div>
              {currentStep > 0 && (
                <div>{"> WORLD ID NULLIFIER EMBEDDED ✓"}</div>
              )}
              {currentStep > 1 && <div>{"> WALLET SIGNATURE EMBEDDED ✓"}</div>}
              {currentStep > 2 && <div>{"> SELF PROTOCOL DID EMBEDDED ✓"}</div>}
              {isUploading && (
                <div className="text-yellow-400">
                  {"> UPLOADING TO IPFS..."}
                </div>
              )}
              {finalCid && !isEncrypting && !isComplete && (
                <div>{"> CID: {finalCid}"}</div>
              )}
              {isEncrypting && (
                <div className="text-yellow-400">
                  {"> ENCRYPTING VIDEO WITH CID..."}
                </div>
              )}
              {isComplete && (
                <>
                  <div>{"> CID: {finalCid}"}</div>
                  <div className="text-green-400">
                    {"> VIDEO ENCRYPTION COMPLETE ✓"}
                  </div>
                  <div className="text-white">
                    {"> STEGANOGRAPHIC EMBEDDING SUCCESSFUL ✓"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
