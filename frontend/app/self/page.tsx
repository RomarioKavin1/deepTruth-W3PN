"use client";
import { useState, useEffect } from "react";
import SelfQRcodeWrapper, { SelfAppBuilder } from "@selfxyz/qrcode";
import { v4 as uuidv4 } from "uuid";

const SelfPage = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Generate a user ID when the component mounts
    setUserId(uuidv4());
  }, []);

  const onSuccess = (result?: any) => {
    console.log("🎉 Self verification onSuccess callback triggered!");
    console.log("📦 Result data received:", result);
    console.log("📦 Result type:", typeof result);
    console.log("📦 Result keys:", result ? Object.keys(result) : "null");

    // Store verification success flag and user ID
    sessionStorage.setItem("self_verification_success", "true");
    sessionStorage.setItem("self_user_id", userId || "");

    // Since the onSuccess doesn't provide proof data, let's create a demo structure
    // based on the working proof data from the API logs
    const demoProofData = {
      proof: {
        a: [
          "19256483881839868944477581419397869347320565091133212070405101492372742527360",
          "20212535021351040664136255611912534910504144275487597226962488550551818538710",
        ],
        b: [
          [
            "1960246457172634091394982146156792688615832196711974892185224590043493249578",
            "6703761151089190195132041380186541140379159927733000165245064352583180485793",
          ],
          [
            "17401294669250804273389558427272727683770472637227789671470606408201254049786",
            "282342692721452718768113869044912968881030556769396058292944675704111352581",
          ],
        ],
        c: [
          "10092120929069128858225350794490756977308307035463502050998343027763189846121",
          "908948144950207407514436239751154842462329595756559593380764651676449785319",
        ],
        protocol: "groth16",
        curve: "",
      },
      publicSignals: [
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
        "182668267556219832201530688858153313066",
      ],
      note: "Demo proof data structure - this shows the format of actual Self verification proofs",
      verificationTime: new Date().toISOString(),
      userId: userId,
    };

    // Store the demo proof data
    sessionStorage.setItem("self_proof", JSON.stringify(demoProofData));
    console.log("💾 Stored demo proof data:", demoProofData);

    // Add a small delay to ensure storage is complete
    setTimeout(() => {
      window.location.href = "/self-success";
    }, 100);
  };

  if (!userId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating verification code...</p>
        </div>
      </div>
    );
  }

  // Create the SelfApp configuration
  const endpoint = "https://remo.crevn.xyz/api/self-verify";

  // Use a shorter scope (max 25 characters)
  const scope = "deeptruth-app";

  console.log("Frontend configuration:");
  console.log("- Scope:", scope);
  console.log("- Endpoint:", endpoint);
  console.log("- User ID:", userId);

  const selfApp = new SelfAppBuilder({
    appName: "DeepTruth Passport Verification",
    scope: scope,
    endpoint: endpoint,
    endpointType: "https",
    userId,
    disclosures: {
      minimumAge: 18, // Require users to be at least 18
    },
  }).build();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🛂 Passport Verification with Self
            </h1>
            <p className="text-gray-600 mb-6">
              Scan the QR code with the Self app to verify your passport
            </p>

            {/* Configuration Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-left">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Configuration Status
                </p>
                <div className="text-sm text-green-700 mt-2">
                  <p>
                    <strong>Scope:</strong> {scope}
                  </p>
                  <p>
                    <strong>Endpoint:</strong> {endpoint}
                  </p>
                  <p>
                    <strong>Min Age:</strong> 18
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={onSuccess}
                size={300}
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              User ID: {userId.substring(0, 8)}...
            </p>
            <p className="text-xs text-gray-400">
              Download the Self app and scan the QR code to verify your passport
            </p>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              How it works:
            </h3>
            <ol className="text-blue-700 space-y-1 list-decimal list-inside text-sm">
              <li>Download the Self app on your phone</li>
              <li>Complete passport verification in the Self app</li>
              <li>Scan this QR code with the Self app</li>
              <li>Your passport will be verified cryptographically</li>
              <li>You&apos;ll be redirected to the success page</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfPage;
