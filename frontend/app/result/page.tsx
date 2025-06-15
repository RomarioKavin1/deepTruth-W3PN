"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "anonymity";
  const cid =
    searchParams.get("cid") ||
    "QmX7Hd9K2pL8vN3mR5tY6wZ1aB4cE7fG9hJ0kL2mN5oP8qR";
  const encrypted = searchParams.get("encrypted") === "true";

  const [encryptedVideoUrl, setEncryptedVideoUrl] = useState<string>("");
  const [encryptedVideoBase64, setEncryptedVideoBase64] = useState<string>("");
  const [encryptedVideoFilename, setEncryptedVideoFilename] =
    useState<string>("");

  useEffect(() => {
    if (encrypted) {
      // Get encrypted video data from sessionStorage
      const videoBase64 = sessionStorage.getItem("encrypted_video_base64");
      const filename = sessionStorage.getItem("encrypted_video_filename");

      if (videoBase64) {
        setEncryptedVideoBase64(videoBase64);
        setEncryptedVideoFilename(filename || "encrypted_video.mp4");

        // Convert base64 to blob URL for preview using proper method
        const videoBlob = base64ToBlob(videoBase64, "video/mp4");
        const videoUrl = URL.createObjectURL(videoBlob);
        setEncryptedVideoUrl(videoUrl);
      }
    }

    // Cleanup function
    return () => {
      if (encryptedVideoUrl) {
        URL.revokeObjectURL(encryptedVideoUrl);
      }
    };
  }, [encrypted]);

  const tierLabels = {
    anonymity: "ANONYMITY",
    pseudoAnon: "PSEUDO-ANONYMITY",
    identity: "IDENTITY",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Convert base64 to blob for video handling (same as your example)
  const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64);
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

  const downloadEncryptedVideo = () => {
    if (encryptedVideoBase64) {
      const videoBlob = base64ToBlob(encryptedVideoBase64, "video/mp4");

      const downloadUrl = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = encryptedVideoFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
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
            PROOF COMPLETE
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-8 text-center">
            {encrypted
              ? "VIDEO ENCRYPTED & AUTHENTICATED"
              : "VIDEO AUTHENTICATED"}
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Video Preview */}
            <div className="space-y-4">
              <div className="border-4 border-black bg-white p-4">
                <h2 className="font-bold uppercase mb-4 border-b-2 border-black pb-2">
                  ENCRYPTED VIDEO
                </h2>
                {encryptedVideoUrl ? (
                  <video
                    controls
                    className="w-full border-2 border-gray-300 aspect-video"
                    src={encryptedVideoUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="border-2 border-gray-300 bg-gray-900 aspect-video flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎥</div>
                      <div className="font-mono text-sm">VIDEO PREVIEW</div>
                      <div className="font-mono text-xs text-gray-400">
                        1920x1080 • 00:45
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={downloadEncryptedVideo}
                    disabled={!encryptedVideoBase64}
                    className="flex-1 bg-black text-white border-4 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    DOWNLOAD VIDEO
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(cid)}
                    className="bg-white text-black border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors px-4"
                  >
                    COPY CID
                  </Button>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <div className="border-4 border-black bg-white p-6">
                <h2 className="font-bold uppercase mb-4 border-b-2 border-black pb-2">
                  PROOF METADATA
                </h2>

                <div className="space-y-4 font-mono text-sm">
                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      IPFS CID
                    </div>
                    <div className="bg-gray-100 p-2 border-2 border-gray-300 break-all">
                      {cid}
                    </div>
                  </div>

                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      PRIVACY TIER
                    </div>
                    <div className="border-2 border-green-600 bg-green-50 p-2 font-bold">
                      {tierLabels[tier as keyof typeof tierLabels]}
                    </div>
                  </div>

                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      ENCRYPTION STATUS
                    </div>
                    <div className="border-2 border-green-600 bg-green-50 p-2 font-bold text-green-800">
                      ✅{" "}
                      {encrypted ? "STEGANOGRAPHICALLY ENCRYPTED" : "VERIFIED"}
                    </div>
                  </div>

                  {encrypted && (
                    <div>
                      <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                        EMBEDDED DATA
                      </div>
                      <div className="border-2 border-blue-600 bg-blue-50 p-2 font-bold text-blue-800">
                        🔒 CID INVISIBLY EMBEDDED
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      TIMESTAMP
                    </div>
                    <div className="bg-gray-100 p-2 border-2 border-gray-300">
                      {new Date().toISOString()}
                    </div>
                  </div>

                  <div>
                    <div className="font-bold uppercase text-xs text-gray-600 mb-1">
                      SIGNATURE HASH
                    </div>
                    <div className="bg-gray-100 p-2 border-2 border-gray-300 break-all text-xs">
                      0x7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-4 border-black bg-white p-6">
                <h2 className="font-bold uppercase mb-4 border-b-2 border-black pb-2">
                  ACTIONS
                </h2>

                <div className="space-y-3">
                  <Button className="w-full bg-white text-black border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors">
                    SHARE TO ARWEAVE
                  </Button>

                  <Link href="/verify">
                    <Button className="w-full bg-white text-black border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors">
                      VERIFY ANOTHER
                    </Button>
                  </Link>

                  <Link href="/">
                    <Button className="w-full bg-black text-white border-4 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors">
                      CREATE NEW PROOF
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
