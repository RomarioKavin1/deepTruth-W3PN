"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CameraAnimation from "@/components/CameraAnimation";

export default function CameraPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoMimeType, setVideoMimeType] = useState<string>("video/webm");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tier = searchParams.get("tier") || "anonymity";

  const tierLabels = {
    anonymity: "ANONYMITY MODE",
    pseudoAnon: "PSEUDO-ANON MODE",
    identity: "IDENTITY MODE",
  };

  const tierFeatures = {
    anonymity: [
      "World ID Proof of Humanity",
      "Nullifier Hash Generation",
      "Steganographic CID Embedding",
      "Anonymous IPFS Storage",
    ],
    pseudoAnon: [
      "World ID + Wallet Linking",
      "Address-Based Verification",
      "Enhanced Proof Embedding",
      "Traceable Authenticity",
    ],
    identity: [
      "Self Protocol Passport Verification",
      "Full Identity Proof Embedding",
      "Government-Grade Authentication",
      "Complete Audit Trail",
    ],
  };

  const tierUseCases = {
    anonymity:
      "Perfect for whistleblowers recording inside sensitive locations while proving humanity without revealing identity",
    pseudoAnon:
      "Ideal for content creators who want verifiable authenticity while maintaining some privacy protection",
    identity:
      "Essential for official announcements, government employees, or public figures requiring full identity verification",
  };

  // Camera initialization and cleanup
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const initializeCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1920,
            height: 1080,
            frameRate: 30,
          },
          audio: true,
        });

        currentStream = mediaStream;
        setStream(mediaStream);
        setIsInitialized(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    initializeCamera();

    // Cleanup function - CRITICAL for stopping camera
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // Additional cleanup on route change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    if (!stream) return;

    setIsRecording(true);
    setRecordingTime(0);
    setProcessingStage("");
    setRecordedChunks([]); // Reset chunks

    // Try to use MP4 if supported, following the same logic as your example
    let mimeType = "";
    if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    }

    console.log("Using MIME type:", mimeType);
    setVideoMimeType(mimeType || "video/webm");

    // Lower bitrate for better compatibility
    const bitrate = 1500000; // 1.5 Mbps

    const options = mimeType
      ? { mimeType, videoBitsPerSecond: bitrate }
      : undefined;

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        // We'll handle the video processing in stopRecording
        setProcessingStage("PROCESSING VIDEO...");
      };

      // Collect data frequently for smoother results (like in your example)
      mediaRecorder.start(100);
    } catch (error) {
      console.error("Error starting MediaRecorder:", error);
      setProcessingStage("Failed to start recording. Try a different browser.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle video processing after recording stops
  useEffect(() => {
    if (
      recordedChunks.length > 0 &&
      !isRecording &&
      processingStage === "PROCESSING VIDEO..."
    ) {
      const processVideo = async () => {
        // Create video blob from chunks, like in your example
        const videoBlob = new Blob(recordedChunks, { type: videoMimeType });

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          sessionStorage.setItem("recorded_video", reader.result as string);
          sessionStorage.setItem("video_tier", tier);
          sessionStorage.setItem("video_mime_type", videoMimeType);

          // Stop camera before navigation
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          router.push(`/proof-process?tier=${tier}`);
        };
        reader.readAsDataURL(videoBlob);
      };

      // Small delay to ensure recording is fully stopped
      setTimeout(processVideo, 500);
    }
  }, [
    recordedChunks,
    isRecording,
    processingStage,
    videoMimeType,
    tier,
    stream,
    router,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black font-mono text-white relative overflow-hidden">
      {/* Background Animation */}
      <CameraAnimation />

      {/* Header */}
      <header className="border-b-4 border-white bg-black p-4 relative z-10">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/tier-selection"
            className="text-xl font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black px-2 py-1 transition-colors"
          >
            ← BACK
          </Link>
          <div className="border-2 border-white px-4 py-2 text-sm font-bold uppercase tracking-wide">
            {tierLabels[tier as keyof typeof tierLabels]} ENABLED
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 p-8 h-[calc(100vh-80px)]">
        {/* Left Sidebar - Tier Info */}
        <div className="space-y-6">
          <div className="border-2 border-white bg-black/80 p-4">
            <h3 className="font-bold uppercase mb-3 border-b border-white pb-1">
              ACTIVE FEATURES
            </h3>
            <div className="space-y-2 text-sm">
              {tierFeatures[tier as keyof typeof tierFeatures].map(
                (feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{feature}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="border-2 border-white bg-black/80 p-4">
            <h3 className="font-bold uppercase mb-3 border-b border-white pb-1">
              USE CASE
            </h3>
            <div className="text-sm text-gray-300 leading-relaxed">
              {tierUseCases[tier as keyof typeof tierUseCases]}
            </div>
          </div>

          <div className="border-2 border-white bg-black/80 p-4">
            <h3 className="font-bold uppercase mb-3 border-b border-white pb-1">
              DEEPFAKE PROTECTION
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Steganography:</span>
                <span className="text-green-400">READY</span>
              </div>
              <div className="flex justify-between">
                <span>Proof Embedding:</span>
                <span className="text-green-400">LOADED</span>
              </div>
              <div className="flex justify-between">
                <span>IPFS Node:</span>
                <span className="text-green-400">CONNECTED</span>
              </div>
              <div className="flex justify-between">
                <span>Privacy Tier:</span>
                <span className="text-blue-400">{tier.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-white bg-black/80 p-4">
            <h3 className="font-bold uppercase mb-3 border-b border-white pb-1">
              RECORDING STATS
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{formatTime(recordingTime)}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolution:</span>
                <span>1920x1080</span>
              </div>
              <div className="flex justify-between">
                <span>Framerate:</span>
                <span>30 FPS</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span>H.264</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Video Feed */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="relative border-4 border-white max-w-full">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-4xl aspect-video bg-gray-900"
              />

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 font-bold border-2 border-white">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  REC {formatTime(recordingTime)}
                </div>
              )}

              {/* Anti-Deepfake Badge */}
              <div className="absolute top-4 right-4 bg-green-600 px-2 py-1 text-xs font-bold border-2 border-white">
                DEEPFAKE PROTECTION ACTIVE
              </div>

              {/* Camera Status */}
              {!isInitialized && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div>INITIALIZING CAMERA...</div>
                  </div>
                </div>
              )}

              {/* Processing Stage */}
              {processingStage && !isRecording && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                  <div className="text-center border-2 border-white p-6">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="font-bold">{processingStage}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-8">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!isInitialized}
                  className="w-24 h-24 bg-red-600 border-4 border-white font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50 rounded-full"
                >
                  START
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="w-24 h-24 bg-white text-black border-4 border-white font-bold uppercase hover:bg-gray-200 transition-colors rounded-full"
                >
                  STOP
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Technical Details */}
        <div className="space-y-6">
          <div className="border-2 border-white bg-black/80 p-4">
            <h3 className="font-bold uppercase mb-3 border-b border-white pb-1">
              SYSTEM STATUS
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Camera Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Audio Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Steganography Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Awaiting Recording</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-white bg-black/80 p-4">
            <h3 className="font-bold uppercase mb-3 border-b border-white pb-1">
              AUTHENTICITY PIPELINE
            </h3>
            <div className="space-y-3 text-xs">
              <div className="border border-gray-600 p-2">
                <div className="font-bold mb-1">1. VIDEO CAPTURE</div>
                <div className="text-gray-400">
                  Record authentic video + audio
                </div>
              </div>
              <div className="border border-gray-600 p-2">
                <div className="font-bold mb-1">2. PROOF GENERATION</div>
                <div className="text-gray-400">
                  Generate verification hash & CID
                </div>
              </div>
              <div className="border border-gray-600 p-2">
                <div className="font-bold mb-1">3. STEGANOGRAPHY</div>
                <div className="text-gray-400">
                  Embed proof invisibly in video
                </div>
              </div>
              <div className="border border-gray-600 p-2">
                <div className="font-bold mb-1">4. IPFS STORAGE</div>
                <div className="text-gray-400">
                  Store verification data securely
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-white bg-black/80 p-4">
            <h3 className="font-bold uppercase mb-3 border-b border-white pb-1">
              RECORDING TIPS
            </h3>
            <div className="text-xs space-y-2">
              <div>• Frame your subject clearly</div>
              <div>• Ensure good lighting conditions</div>
              <div>• Keep camera as steady as possible</div>
              <div>• Video will auto-process after recording</div>
              <div>• Don't close tab during recording/processing</div>
              <div>• Your video will be deepfake-proof</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
