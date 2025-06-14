"use client";
import { useState, useEffect } from "react";

interface SelfProofData {
  [key: string]: any; // Flexible structure to match whatever Self library provides
}

const SelfSuccessPage = () => {
  const [proofData, setProofData] = useState<SelfProofData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    cid: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    // Retrieve proof data from sessionStorage
    const storedProof = sessionStorage.getItem("self_proof");
    const storedUserId = sessionStorage.getItem("self_user_id");
    const verificationSuccess = sessionStorage.getItem(
      "self_verification_success"
    );

    console.log("🔍 Checking sessionStorage:");
    console.log("- self_proof:", storedProof);
    console.log("- self_user_id:", storedUserId);
    console.log("- self_verification_success:", verificationSuccess);

    if (storedProof) {
      try {
        const parsedProof = JSON.parse(storedProof);
        setProofData(parsedProof);
        console.log("✅ Retrieved self proof data:", parsedProof);
      } catch (error) {
        console.error("❌ Error parsing self proof data:", error);
      }
    } else if (verificationSuccess === "true") {
      // If verification was successful but no proof data, create a placeholder
      console.log("⚠️ Verification successful but no proof data found");
      const placeholderData = {
        message: "Self verification completed successfully",
        timestamp: new Date().toISOString(),
        userId: storedUserId,
        note: "Proof data structure from Self library was not captured",
      };
      setProofData(placeholderData);
    }

    if (storedUserId) {
      setUserId(storedUserId);
    }

    setLoading(false);
  }, []);

  const clearData = () => {
    sessionStorage.removeItem("self_proof");
    sessionStorage.removeItem("self_user_id");
    sessionStorage.removeItem("self_verification_success");
    setProofData(null);
    setUserId(null);
  };

  const goBack = () => {
    window.location.href = "/self";
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
          type: "self",
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🛂 Self Passport Verification Successful!
            </h1>
            <p className="text-gray-600">
              Your passport has been verified cryptographically with Self
            </p>
          </div>

          {proofData ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Self Proof Data
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <p className="text-sm bg-white p-2 rounded border font-mono">
                      {userId
                        ? `${userId.substring(0, 8)}...${userId.substring(
                            userId.length - 8
                          )}`
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Type
                    </label>
                    <p className="text-sm bg-white p-2 rounded border">
                      Self Passport Verification
                    </p>
                  </div>
                </div>

                {/* Display key fields if they exist */}
                {proofData.proof && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Zero-Knowledge Proof
                    </h3>
                    <div className="space-y-4">
                      {proofData.proof.protocol && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Protocol
                          </label>
                          <p className="text-sm bg-white p-2 rounded border font-mono">
                            {proofData.proof.protocol}
                          </p>
                        </div>
                      )}

                      {proofData.proof.a && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proof Component A
                          </label>
                          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                            {proofData.proof.a.map(
                              (value: string, index: number) => (
                                <div key={index} className="break-all">
                                  <span className="text-gray-600">
                                    [{index}]
                                  </span>{" "}
                                  {value}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {proofData.proof.c && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proof Component C
                          </label>
                          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                            {proofData.proof.c.map(
                              (value: string, index: number) => (
                                <div key={index} className="break-all">
                                  <span className="text-gray-600">
                                    [{index}]
                                  </span>{" "}
                                  {value}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Public Signals */}
                {proofData.publicSignals && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Public Signals ({proofData.publicSignals.length} total)
                    </h3>
                    <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-64 overflow-auto">
                      <div className="space-y-1">
                        {proofData.publicSignals.map(
                          (signal: string, index: number) => (
                            <div key={index} className="break-all">
                              <span className="text-gray-600">[{index}]</span>{" "}
                              {signal}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw JSON Data */}
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
                  Verify Another Passport
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
                It looks like you arrived here without completing a Self
                passport verification, or the proof data wasn't stored properly.
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

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            🔒 About This Proof
          </h3>
          <div className="text-blue-700 space-y-2 text-sm">
            <p>
              • This zero-knowledge proof was generated from your passport data
            </p>
            <p>
              • The proof components cryptographically verify your identity
              without revealing personal details
            </p>
            <p>
              • Public signals contain encoded verification parameters and
              constraints
            </p>
            <p>
              • This data demonstrates successful Self passport verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfSuccessPage;
