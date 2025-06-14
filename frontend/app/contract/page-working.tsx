"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  ANONYMITY_TIERS_ADDRESS,
  ANONYMITY_TIERS_ABI,
} from "@/utils/contractConfig";

const ContractPage = () => {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // State for form inputs
  const [worldIdProofCid, setWorldIdProofCid] = useState("");
  const [nullifierHash, setNullifierHash] = useState("");
  const [signatureCid, setSignatureCid] = useState("");
  const [selfVerificationCid, setSelfVerificationCid] = useState("");
  const [uuid, setUuid] = useState("");
  const [queryUuid, setQueryUuid] = useState("");

  // State for results
  const [anonymousRecord, setAnonymousRecord] = useState<any>(null);
  const [pseudonymousRecord, setPseudonymousRecord] = useState<any>(null);
  const [identityRecord, setIdentityRecord] = useState<any>(null);

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Read UUID counter
  const { data: uuidCounter } = useReadContract({
    address: ANONYMITY_TIERS_ADDRESS,
    abi: ANONYMITY_TIERS_ABI,
    functionName: "uuidCounter",
  });

  // Helper function to convert IPFS CID to BigInt (simplified for demo)
  const cidToBigInt = (cid: string): bigint => {
    if (!cid) return 0n;
    // Simple conversion - in production you'd use proper encoding
    const encoder = new TextEncoder();
    const bytes = encoder.encode(cid);
    let result = 0n;
    for (let i = 0; i < Math.min(bytes.length, 32); i++) {
      result = result * 256n + BigInt(bytes[i]);
    }
    return result;
  };

  // Create mock encrypted data (for demo purposes)
  const createMockEncryptedData = (data: string): `0x${string}` => {
    const bigIntValue = cidToBigInt(data);
    // Convert to hex string (this is just for demo - real encryption would be different)
    return `0x${bigIntValue.toString(16).padStart(64, "0")}` as `0x${string}`;
  };

  // Create Anonymous Record
  const createAnonymousRecord = async () => {
    if (!worldIdProofCid || !nullifierHash) {
      alert("Please fill in World ID Proof CID and Nullifier Hash");
      return;
    }

    setIsLoading(true);
    setTxStatus("Creating mock encrypted data...");

    try {
      // For demo purposes, we'll use mock encrypted data
      const encryptedWorldIdCid = createMockEncryptedData(worldIdProofCid);
      const encryptedNullifier = createMockEncryptedData(nullifierHash);

      setTxStatus("Sending transaction...");

      writeContract({
        address: ANONYMITY_TIERS_ADDRESS,
        abi: ANONYMITY_TIERS_ABI,
        functionName: "createAnonymousRecord",
        args: [encryptedWorldIdCid, encryptedNullifier],
      });
    } catch (error) {
      console.error("Error creating anonymous record:", error);
      setTxStatus("Error: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Pseudonymous Record
  const createPseudonymousRecord = async () => {
    if (!uuid || !signatureCid) {
      alert("Please fill in UUID and Signature CID");
      return;
    }

    setIsLoading(true);
    setTxStatus("Creating mock encrypted data...");

    try {
      const encryptedSignatureCid = createMockEncryptedData(signatureCid);

      setTxStatus("Sending transaction...");

      writeContract({
        address: ANONYMITY_TIERS_ADDRESS,
        abi: ANONYMITY_TIERS_ABI,
        functionName: "createPseudonymousRecord",
        args: [uuid, encryptedSignatureCid],
      });
    } catch (error) {
      console.error("Error creating pseudonymous record:", error);
      setTxStatus("Error: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Identity Record
  const createIdentityRecord = async () => {
    if (!uuid || !selfVerificationCid) {
      alert("Please fill in UUID and Self Verification CID");
      return;
    }

    setIsLoading(true);
    setTxStatus("Creating mock encrypted data...");

    try {
      const encryptedSelfVerificationCid =
        createMockEncryptedData(selfVerificationCid);

      setTxStatus("Sending transaction...");

      writeContract({
        address: ANONYMITY_TIERS_ADDRESS,
        abi: ANONYMITY_TIERS_ABI,
        functionName: "createIdentityRecord",
        args: [uuid, encryptedSelfVerificationCid],
      });
    } catch (error) {
      console.error("Error creating identity record:", error);
      setTxStatus("Error: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Query Anonymous Record
  const queryAnonymousRecord = async () => {
    if (!queryUuid) {
      alert("Please enter a UUID to query");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/contract/getAnonymousRecord?uuid=${queryUuid}`
      );
      const data = await response.json();
      setAnonymousRecord(data);
    } catch (error) {
      console.error("Error querying anonymous record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Query Pseudonymous Record
  const queryPseudonymousRecord = async () => {
    if (!queryUuid) {
      alert("Please enter a UUID to query");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/contract/getPseudonymousRecord?uuid=${queryUuid}`
      );
      const data = await response.json();
      setPseudonymousRecord(data);
    } catch (error) {
      console.error("Error querying pseudonymous record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Query Identity Record
  const queryIdentityRecord = async () => {
    if (!queryUuid) {
      alert("Please enter a UUID to query");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/contract/getIdentityRecord?uuid=${queryUuid}`
      );
      const data = await response.json();
      setIdentityRecord(data);
    } catch (error) {
      console.error("Error querying identity record:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update transaction status
  useEffect(() => {
    if (isConfirming) {
      setTxStatus("Confirming transaction...");
    } else if (isConfirmed) {
      setTxStatus("Transaction confirmed!");
      // Clear form inputs
      setWorldIdProofCid("");
      setNullifierHash("");
      setSignatureCid("");
      setSelfVerificationCid("");
      setUuid("");
    } else if (error) {
      setTxStatus("Transaction failed: " + error.message);
    }
  }, [isConfirming, isConfirmed, error]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to interact with the contract
          </p>
          <appkit-button />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AnonymityTiers Contract
              </h1>
              <p className="text-gray-600 mt-2">
                Contract Address: {ANONYMITY_TIERS_ADDRESS}
              </p>
              <p className="text-gray-600">Connected: {address}</p>
              <p className="text-gray-600">
                UUID Counter: {uuidCounter?.toString() || "Loading..."}
              </p>
              <p className="text-orange-600">
                ⚠️ Demo Mode: Using mock encryption (CoFHE integration pending)
              </p>
            </div>
            <appkit-button />
          </div>
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">{txStatus}</p>
            {hash && (
              <p className="text-sm text-blue-600 mt-2">
                Transaction Hash: {hash}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Write Functions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Write Functions
            </h2>

            {/* Create Anonymous Record */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">
                Create Anonymous Record
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    World ID Proof CID
                  </label>
                  <input
                    type="text"
                    value={worldIdProofCid}
                    onChange={(e) => setWorldIdProofCid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="QmExample123..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nullifier Hash
                  </label>
                  <input
                    type="text"
                    value={nullifierHash}
                    onChange={(e) => setNullifierHash(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0x123abc..."
                  />
                </div>
                <button
                  onClick={createAnonymousRecord}
                  disabled={isPending || isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending || isLoading
                    ? "Processing..."
                    : "Create Anonymous Record"}
                </button>
              </div>
            </div>

            {/* Create Pseudonymous Record */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">
                Create Pseudonymous Record
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UUID
                  </label>
                  <input
                    type="text"
                    value={uuid}
                    onChange={(e) => setUuid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="anon-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature CID
                  </label>
                  <input
                    type="text"
                    value={signatureCid}
                    onChange={(e) => setSignatureCid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="QmSignature123..."
                  />
                </div>
                <button
                  onClick={createPseudonymousRecord}
                  disabled={isPending || isLoading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending || isLoading
                    ? "Processing..."
                    : "Create Pseudonymous Record"}
                </button>
              </div>
            </div>

            {/* Create Identity Record */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">
                Create Identity Record
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UUID
                  </label>
                  <input
                    type="text"
                    value={uuid}
                    onChange={(e) => setUuid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="anon-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Self Verification Proof CID
                  </label>
                  <input
                    type="text"
                    value={selfVerificationCid}
                    onChange={(e) => setSelfVerificationCid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="QmSelfVerify123..."
                  />
                </div>
                <button
                  onClick={createIdentityRecord}
                  disabled={isPending || isLoading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending || isLoading
                    ? "Processing..."
                    : "Create Identity Record"}
                </button>
              </div>
            </div>
          </div>

          {/* Read Functions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Read Functions</h2>

            {/* Query Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Query Records</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UUID to Query
                  </label>
                  <input
                    type="text"
                    value={queryUuid}
                    onChange={(e) => setQueryUuid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="anon-1"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={queryAnonymousRecord}
                    disabled={isLoading}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Query Anonymous Record
                  </button>
                  <button
                    onClick={queryPseudonymousRecord}
                    disabled={isLoading}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Query Pseudonymous Record
                  </button>
                  <button
                    onClick={queryIdentityRecord}
                    disabled={isLoading}
                    className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    Query Identity Record
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {anonymousRecord && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Anonymous Record</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Exists:</strong>{" "}
                    {anonymousRecord.exists ? "Yes" : "No"}
                  </p>
                  {anonymousRecord.exists && (
                    <>
                      <p>
                        <strong>Encrypted World ID CID:</strong>{" "}
                        {anonymousRecord.encryptedWorldIdProofCid}
                      </p>
                      <p>
                        <strong>Encrypted Nullifier:</strong>{" "}
                        {anonymousRecord.encryptedNullifierHash}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {pseudonymousRecord && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Pseudonymous Record
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Exists:</strong>{" "}
                    {pseudonymousRecord.exists ? "Yes" : "No"}
                  </p>
                  {pseudonymousRecord.exists && (
                    <>
                      <p>
                        <strong>User Address:</strong>{" "}
                        {pseudonymousRecord.userAddress}
                      </p>
                      <p>
                        <strong>Encrypted World ID CID:</strong>{" "}
                        {pseudonymousRecord.encryptedWorldIdProofCid}
                      </p>
                      <p>
                        <strong>Encrypted Nullifier:</strong>{" "}
                        {pseudonymousRecord.encryptedNullifierHash}
                      </p>
                      <p>
                        <strong>Encrypted Signature CID:</strong>{" "}
                        {pseudonymousRecord.encryptedSignatureCid}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {identityRecord && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Identity Record</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Exists:</strong>{" "}
                    {identityRecord.exists ? "Yes" : "No"}
                  </p>
                  {identityRecord.exists && (
                    <>
                      <p>
                        <strong>User Address:</strong>{" "}
                        {identityRecord.userAddress}
                      </p>
                      <p>
                        <strong>Encrypted World ID CID:</strong>{" "}
                        {identityRecord.encryptedWorldIdProofCid}
                      </p>
                      <p>
                        <strong>Encrypted Nullifier:</strong>{" "}
                        {identityRecord.encryptedNullifierHash}
                      </p>
                      <p>
                        <strong>Encrypted Signature CID:</strong>{" "}
                        {identityRecord.encryptedSignatureCid}
                      </p>
                      <p>
                        <strong>Encrypted Self Verification CID:</strong>{" "}
                        {identityRecord.encryptedSelfVerificationProofCid}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPage;
