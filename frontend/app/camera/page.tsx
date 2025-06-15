"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CameraPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "anonymity";

  const tierLabels = {
    anonymity: "ANONYMITY MODE",
    pseudoAnon: "PSEUDO-ANON MODE",
    identity: "IDENTITY MODE",
  };

  useEffect(() => {
    // Initialize camera
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => console.error("Camera access denied:", err));

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Simulate processing and redirect
    setTimeout(() => {
      window.location.href = `/proof-process?tier=${tier}`;
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black font-mono text-white">
      {/* Header */}
      <header className="border-b-4 border-white bg-black p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/tier-selection"
            className="text-xl font-bold uppercase tracking-wider text-white"
          >
            ← BACK
          </Link>
          <div className="border-2 border-white px-4 py-2 text-sm font-bold uppercase tracking-wide">
            {tierLabels[tier as keyof typeof tierLabels]} ENABLED
          </div>
        </div>
      </header>

      {/* Camera Interface */}
      <main className="relative h-[calc(100vh-80px)]">
        {/* Video Feed */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative border-4 border-white">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full max-w-4xl aspect-video bg-gray-900"
            />

            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white"></div>
                ))}
              </div>
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 font-bold">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                REC {formatTime(recordingTime)}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-8">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="w-20 h-20 bg-red-600 border-4 border-white font-bold uppercase hover:bg-red-700 transition-colors"
              >
                START
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="w-20 h-20 bg-white text-black border-4 border-white font-bold uppercase hover:bg-gray-200 transition-colors"
              >
                STOP
              </Button>
            )}
          </div>
        </div>

        {/* Technical Info */}
        <div className="absolute top-4 right-4 border-2 border-white bg-black p-4 font-mono text-xs">
          <div className="space-y-1">
            <div>RESOLUTION: 1920x1080</div>
            <div>FRAMERATE: 30 FPS</div>
            <div>CODEC: H.264</div>
            <div>TIER: {tier.toUpperCase()}</div>
            <div className="border-t border-white pt-1 mt-2">
              <div className="text-green-400">● CAMERA ACTIVE</div>
              <div className="text-green-400">● STEGO READY</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
