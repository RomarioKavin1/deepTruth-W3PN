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

  const onSuccess = () => {
    console.log("Self verification successful!");
    // Store a flag to indicate successful verification
    sessionStorage.setItem("self_verification_success", "true");
    sessionStorage.setItem("self_user_id", userId || "");
    window.location.href = "/self-success";
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
