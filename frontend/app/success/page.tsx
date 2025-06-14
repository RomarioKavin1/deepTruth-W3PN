"use client";
import { useState, useEffect } from "react";

interface ProofData {
  verification_level?: string;
  credential_type?: string;
  proof?: string;
  nullifier_hash?: string;
  merkle_root?: string;
  [key: string]: string | number | boolean | undefined; // More specific than any
}

const SuccessPage = () => {
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    cid: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    // Retrieve proof data from sessionStorage
    const storedProof = sessionStorage.getItem("worldid_proof");
    if (storedProof) {
      try {
        const parsedProof = JSON.parse(storedProof);
        setProofData(parsedProof);
        console.log("Retrieved proof data:", parsedProof);
      } catch (error) {
        console.error("Error parsing proof data:", error);
      }
    }
    setLoading(false);
  }, []);

  const clearData = () => {
    sessionStorage.removeItem("worldid_proof");
    setProofData(null);
  };

  const goBack = () => {
    window.location.href = "/world";
  };

  const uploadToIPFS = async () => {
    if (!proofData) {
      alert("No proof data to upload");
      return;
    }

    try {
      setUploading(true);
      const response = await fetch("/api/upload-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofData: proofData,
          type: "worldid",
        }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      setUploadResult(result);
      console.log("Upload successful:", result);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload proof to IPFS");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proof data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎉 World ID Verification Successful!
            </h1>
            <p className="text-gray-600">
              Your identity has been verified with World ID
            </p>
          </div>

          {proofData ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Proof Data
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Level
                    </label>
                    <p className="text-sm bg-white p-2 rounded border">
                      {proofData.verification_level || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credential Type
                    </label>
                    <p className="text-sm bg-white p-2 rounded border">
                      {proofData.credential_type || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proof
                    </label>
                    <p className="text-sm bg-white p-2 rounded border break-all">
                      {proofData.proof || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nullifier Hash
                    </label>
                    <p className="text-sm bg-white p-2 rounded border break-all">
                      {proofData.nullifier_hash || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Merkle Root
                    </label>
                    <p className="text-sm bg-white p-2 rounded border break-all">
                      {proofData.merkle_root || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Raw JSON Data
                  </h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(proofData, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={goBack}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Verify Another Identity
                </button>

                <button
                  onClick={uploadToIPFS}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-md transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload to IPFS"}
                </button>

                <button
                  onClick={clearData}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Clear Data
                </button>
              </div>

              {uploadResult && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    🎉 Successfully Uploaded to IPFS!
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        CID
                      </label>
                      <p className="text-sm bg-white p-2 rounded border font-mono break-all">
                        {uploadResult.cid}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        IPFS URL
                      </label>
                      <a
                        href={uploadResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-white p-2 rounded border block break-all text-blue-600 hover:text-blue-800 underline"
                      >
                        {uploadResult.url}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Proof Data Found
              </h2>
              <p className="text-gray-600 mb-6">
                It looks like you arrived here without completing a World ID
                verification.
              </p>
              <button
                onClick={goBack}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Start Verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
