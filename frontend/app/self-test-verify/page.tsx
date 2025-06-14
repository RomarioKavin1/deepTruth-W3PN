"use client";
import { useState } from "react";

interface VerificationResult {
  status: number;
  success: boolean;
  data: Record<string, unknown>;
}

const SelfTestVerifyPage = () => {
  const [proofJson, setProofJson] = useState("");
  const [publicSignalsJson, setPublicSignalsJson] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted!"); // Debug log
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check if fields are empty
      if (!proofJson.trim() || !publicSignalsJson.trim()) {
        throw new Error("Please fill in both proof and public signals fields");
      }

      // Parse JSON inputs
      let parsedProof;
      let parsedPublicSignals;

      try {
        parsedProof = JSON.parse(proofJson);
        parsedPublicSignals = JSON.parse(publicSignalsJson);
      } catch {
        throw new Error("Invalid JSON format in proof or public signals");
      }

      const requestBody = {
        proof: parsedProof,
        publicSignals: parsedPublicSignals,
      };

      console.log("Sending Self proof data:", requestBody);

      const response = await fetch("/api/self-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
      console.error("Error verifying Self proof:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    console.log("Filling sample data..."); // Debug log
    // Using the actual proof data from your logs
    const sampleProof = {
      a: [
        "14925803677480670481423755315314771075030467970766820698032100455832394464548",
        "11917337606086039515848920253548985568876932658388307897200596564240979515729",
      ],
      b: [
        [
          "15953936877252310993589190434050449808935092859743595293068798314978524105584",
          "1612947652258420983099463188408330787150487399679996257181866430126193334082",
        ],
        [
          "19482415064013793617152643445203357243258837558366587474042631344242514748372",
          "2378074027863791596879018781980180303982007399514987364564230289236194092103",
        ],
      ],
      c: [
        "9385201786350996168064095753648915508616304563262609548953322617404505273852",
        "3742714443494248200083283927374567376651750155707758270990991723482023041326",
      ],
      protocol: "groth16",
      curve: "",
    };

    const samplePublicSignals = [
      "0",
      "0",
      "5917645764266387229099807922771871753544163856784761583567435202560",
      "0",
      "0",
      "0",
      "0",
      "11794454578101037995167214973125272232034182560311491884874539703101243012876",
      "1",
      "10814722823002651048642806287598455419587834556190100280513885521810362284318",
      "2",
      "5",
      "0",
      "6",
      "1",
      "4",
      "17359956125106148146828355805271472653597249114301196742546733402427978706344",
      "7420120618403967585712321281997181302561301414016003514649937965499789236588",
      "16836358042995742879630198413873414945978677264752036026400967422611478610995",
      "20870873843757527878887248187119483604000609137016473857889233767622733481592",
      "90944561783958271037105127760630730243",
    ];

    setProofJson(JSON.stringify(sampleProof, null, 2));
    setPublicSignalsJson(JSON.stringify(samplePublicSignals, null, 2));
    console.log("Sample data filled successfully!"); // Debug log
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Manual Self Proof Verification
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof (JSON)
              </label>
              <textarea
                value={proofJson}
                onChange={(e) => setProofJson(e.target.value)}
                rows={12}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white text-gray-900"
                placeholder='{"a": [...], "b": [...], "c": [...], "protocol": "groth16", "curve": ""}'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Signals (JSON Array)
              </label>
              <textarea
                value={publicSignalsJson}
                onChange={(e) => setPublicSignalsJson(e.target.value)}
                rows={8}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white text-gray-900"
                placeholder='["0", "0", "5917645764266387229099807922771871753544163856784761583567435202560", ...]'
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition-colors"
            >
              {loading ? "Verifying..." : "Verify Self Proof"}
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
                  Self Verification Result
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
                    <pre className="mt-2 bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
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
                Click &ldquo;Fill Sample Data&rdquo; to populate with sample
                Self proof data
              </li>
              <li>
                Or manually paste your proof and publicSignals JSON from the
                Self app
              </li>
              <li>
                Click &ldquo;Verify Self Proof&rdquo; to test the verification
                endpoint
              </li>
              <li>
                Check the result to see if the proof is valid and view detailed
                verification info
              </li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Current Configuration
            </h3>
            <div className="text-yellow-700 space-y-1 text-sm">
              <p>
                <strong>Endpoint:</strong> /api/self-verify
              </p>
              <p>
                <strong>Scope:</strong> deeptruth-app
              </p>
              <p>
                <strong>Minimum Age:</strong> 18
              </p>
              <p>
                <strong>Expected Disclosures:</strong> Name, Nationality
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfTestVerifyPage;
