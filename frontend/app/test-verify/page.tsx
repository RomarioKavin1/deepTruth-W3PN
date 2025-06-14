"use client";
import { useState } from "react";

interface ProofData {
  verification_level: string;
  credential_type: string;
  proof: string;
  nullifier_hash: string;
  merkle_root: string;
}

interface VerificationResult {
  status: number;
  success: boolean;
  data: Record<string, unknown>;
}

const TestVerifyPage = () => {
  const [proofData, setProofData] = useState<ProofData>({
    verification_level: "orb",
    credential_type: "orb",
    proof: "",
    nullifier_hash: "",
    merkle_root: "",
  });

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof ProofData, value: string) => {
    setProofData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Sending proof data:", proofData);

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proofData),
      });

      const data = await response.json();

      console.log("Response status:", response.status);
      console.log("Response data:", data);

      setResult({
        status: response.status,
        success: response.ok,
        data: data,
      });
    } catch (err) {
      console.error("Error verifying proof:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    setProofData({
      verification_level: "orb",
      credential_type: "orb",
      proof:
        "0x290f2c6b2fa3438307841d231085bfe564980e8be41f36db226966e9d63c47fd8e89c25c0d009d66700b10a84beb45fa3",
      nullifier_hash:
        "0x255243621a57d769e48015daa5cb85c6861959274a0ef640f025e9e51c9306c3",
      merkle_root:
        "0x21ed51602596a46d2b5015158346821c8924e4d8be09e2c7b8195f67fbc6c789",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Manual World ID Proof Verification
          </h1>

          <div className="mb-6">
            <button
              onClick={fillSampleData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Fill Sample Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Level
                </label>
                <input
                  type="text"
                  value={proofData.verification_level}
                  onChange={(e) =>
                    handleInputChange("verification_level", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="orb"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential Type
                </label>
                <input
                  type="text"
                  value={proofData.credential_type}
                  onChange={(e) =>
                    handleInputChange("credential_type", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="orb"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof
              </label>
              <textarea
                value={proofData.proof}
                onChange={(e) => handleInputChange("proof", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nullifier Hash
              </label>
              <input
                type="text"
                value={proofData.nullifier_hash}
                onChange={(e) =>
                  handleInputChange("nullifier_hash", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merkle Root
              </label>
              <input
                type="text"
                value={proofData.merkle_root}
                onChange={(e) =>
                  handleInputChange("merkle_root", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition-colors"
            >
              {loading ? "Verifying..." : "Verify Proof"}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6">
              <div
                className={`p-4 rounded-md border ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  Verification Result
                </h3>
                <div className="space-y-2">
                  <p>
                    <strong>Status:</strong> {result.status}
                  </p>
                  <p>
                    <strong>Success:</strong>{" "}
                    {result.success ? "✅ Yes" : "❌ No"}
                  </p>
                  <div>
                    <strong>Response Data:</strong>
                    <pre className="mt-2 bg-gray-100 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Instructions
            </h3>
            <ol className="text-blue-700 space-y-1 list-decimal list-inside">
              <li>
                Click &ldquo;Fill Sample Data&rdquo; to populate with your proof
                data
              </li>
              <li>Or manually enter the proof values from your console</li>
              <li>
                Click &ldquo;Verify Proof&rdquo; to test the verification
                endpoint
              </li>
              <li>Check the result to see if the proof is valid</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVerifyPage;
