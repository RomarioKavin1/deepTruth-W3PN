"use client";

import React, { useState, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ANONYMITY_TIERS_ADDRESS,
  ANONYMITY_TIERS_ABI,
} from "@/utils/contractConfig";
import { FheTypes } from "cofhejs/web";
import { useEncryptInput } from "@/hooks/useEncryptInput";
import {
  useCofhejsInitialized,
  useCofhejsIsActivePermitValid,
  useCofhejsActivePermit,
} from "@/hooks/useCofhejs";
import { useCofhejsModalStore } from "@/components/CofhejsPermitModal";

interface RecordData {
  worldIdProofCid?: string;
  signatureCid?: string;
  selfVerificationProofCid?: string;
}

const ContractPage = () => {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const cofhejsInitialized = useCofhejsInitialized();
  const isPermitValid = useCofhejsIsActivePermitValid();
  const activePermit = useCofhejsActivePermit();
  const setGeneratePermitModalOpen = useCofhejsModalStore(
    (state) => state.setGeneratePermitModalOpen
  );
  const { onEncryptInput, isEncryptingInput, inputEncryptionDisabled } =
    useEncryptInput();

  // State for form inputs
  const [worldIdProofCid, setWorldIdProofCid] = useState("");
  const [signatureCid, setSignatureCid] = useState("");
  const [selfVerificationCid, setSelfVerificationCid] = useState("");
  const [queryUuid, setQueryUuid] = useState("");

  // State for results
  const [anonymousRecord, setAnonymousRecord] = useState<RecordData | null>(
    null
  );
  const [pseudonymousRecord, setPseudonymousRecord] =
    useState<RecordData | null>(null);
  const [identityRecord, setIdentityRecord] = useState<RecordData | null>(null);

  // State for loading and errors
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

  // Helper function to convert IPFS CID to BigInt
  const cidToBigInt = (cid: string): bigint => {
    if (!cid) return 0n;

    // For demo purposes, use a simple hash that produces small, safe values
    // This avoids the encryption range issues
    let hash = 0;
    for (let i = 0; i < cid.length; i++) {
      hash = (hash + cid.charCodeAt(i)) % 1000000; // Keep it small
    }

    // Return a small, safe BigInt value
    return BigInt(hash + 1000); // Add 1000 to avoid zero
  };

  // Create Anonymous Record
  const createAnonymousRecord = useCallback(async () => {
    if (!worldIdProofCid) {
      alert("Please fill in World ID Proof CID");
      return;
    }

    if (!cofhejsInitialized) {
      alert(
        "CoFHE not initialized. Please connect your wallet and wait for initialization."
      );
      return;
    }

    setTxStatus("Encrypting data...");

    try {
      // Convert CID to safe BigInt value
      const worldCidBigInt = cidToBigInt(worldIdProofCid);
      const worldCidUint32 = Number(worldCidBigInt) >>> 0; // Convert to uint32

      console.log("Converting CID:", { worldCidBigInt, worldCidUint32 });

      // Encrypt the input using CoFHE
      const encryptedWorldIdCid = await onEncryptInput(
        FheTypes.Uint32,
        worldIdProofCid
      );

      if (!encryptedWorldIdCid) {
        setTxStatus("Encryption failed");
        return;
      }

      setTxStatus("Sending transaction...");

      // Cast to any to avoid TypeScript type issues with CoFHE types
      writeContract({
        address: ANONYMITY_TIERS_ADDRESS,
        abi: ANONYMITY_TIERS_ABI,
        functionName: "createAnonymousRecord",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [encryptedWorldIdCid as any],
      });
    } catch (error) {
      console.error("Error creating anonymous record:", error);
      setTxStatus("Error: " + (error as Error).message);
    }
  }, [worldIdProofCid, cofhejsInitialized, onEncryptInput, writeContract]);

  // Create Pseudonymous Record
  const createPseudonymousRecord = useCallback(async () => {
    if (!worldIdProofCid || !signatureCid) {
      alert("Please fill in World ID Proof CID and Signature CID");
      return;
    }

    if (!cofhejsInitialized) {
      alert(
        "CoFHE not initialized. Please connect your wallet and wait for initialization."
      );
      return;
    }

    setTxStatus("Encrypting data...");

    try {
      const worldCidBigInt = cidToBigInt(worldIdProofCid);
      const signatureCidBigInt = cidToBigInt(signatureCid);

      const encryptedWorldIdCid = await onEncryptInput(
        FheTypes.Uint32,
        worldCidBigInt.toString()
      );
      const encryptedSignatureCid = await onEncryptInput(
        FheTypes.Uint32,
        signatureCidBigInt.toString()
      );

      if (!encryptedWorldIdCid || !encryptedSignatureCid) {
        setTxStatus("Encryption failed");
        return;
      }

      setTxStatus("Sending transaction...");

      writeContract({
        address: ANONYMITY_TIERS_ADDRESS,
        abi: ANONYMITY_TIERS_ABI,
        functionName: "createPseudonymousRecord",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [encryptedWorldIdCid as any, encryptedSignatureCid as any],
      });
    } catch (error) {
      console.error("Error creating pseudonymous record:", error);
      setTxStatus("Error: " + (error as Error).message);
    }
  }, [
    worldIdProofCid,
    signatureCid,
    cofhejsInitialized,
    onEncryptInput,
    writeContract,
  ]);

  // Create Identity Record
  const createIdentityRecord = useCallback(async () => {
    if (!worldIdProofCid || !signatureCid || !selfVerificationCid) {
      alert(
        "Please fill in World ID Proof CID, Signature CID, and Self Verification CID"
      );
      return;
    }

    if (!cofhejsInitialized) {
      alert(
        "CoFHE not initialized. Please connect your wallet and wait for initialization."
      );
      return;
    }

    setTxStatus("Encrypting data...");

    try {
      const worldCidBigInt = cidToBigInt(worldIdProofCid);
      const signatureCidBigInt = cidToBigInt(signatureCid);
      const selfVerificationCidBigInt = cidToBigInt(selfVerificationCid);

      const encryptedWorldIdCid = await onEncryptInput(
        FheTypes.Uint32,
        worldCidBigInt.toString()
      );
      const encryptedSignatureCid = await onEncryptInput(
        FheTypes.Uint32,
        signatureCidBigInt.toString()
      );
      const encryptedSelfVerificationCid = await onEncryptInput(
        FheTypes.Uint32,
        selfVerificationCidBigInt.toString()
      );

      if (
        !encryptedWorldIdCid ||
        !encryptedSignatureCid ||
        !encryptedSelfVerificationCid
      ) {
        setTxStatus("Encryption failed");
        return;
      }

      setTxStatus("Sending transaction...");

      writeContract({
        address: ANONYMITY_TIERS_ADDRESS,
        abi: ANONYMITY_TIERS_ABI,
        functionName: "createIdentityRecord",
        args: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          encryptedWorldIdCid as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          encryptedSignatureCid as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          encryptedSelfVerificationCid as any,
        ],
      });
    } catch (error) {
      console.error("Error creating identity record:", error);
      setTxStatus("Error: " + (error as Error).message);
    }
  }, [
    worldIdProofCid,
    signatureCid,
    selfVerificationCid,
    cofhejsInitialized,
    onEncryptInput,
    writeContract,
  ]);

  // Query Anonymous Record
  const queryAnonymousRecord = useCallback(async () => {
    if (!queryUuid) {
      alert("Please enter a UUID to query");
      return;
    }

    try {
      const response = await fetch(
        `/api/contract/getAnonymousRecord?uuid=${queryUuid}`
      );
      const data = await response.json();
      setAnonymousRecord(data);
    } catch (error) {
      console.error("Error querying anonymous record:", error);
    }
  }, [queryUuid]);

  // Query Pseudonymous Record
  const queryPseudonymousRecord = useCallback(async () => {
    if (!queryUuid) {
      alert("Please enter a UUID to query");
      return;
    }

    try {
      const response = await fetch(
        `/api/contract/getPseudonymousRecord?uuid=${queryUuid}`
      );
      const data = await response.json();
      setPseudonymousRecord(data);
    } catch (error) {
      console.error("Error querying pseudonymous record:", error);
    }
  }, [queryUuid]);

  // Query Identity Record
  const queryIdentityRecord = useCallback(async () => {
    if (!queryUuid) {
      alert("Please enter a UUID to query");
      return;
    }

    try {
      const response = await fetch(
        `/api/contract/getIdentityRecord?uuid=${queryUuid}`
      );
      const data = await response.json();
      setIdentityRecord(data);
    } catch (error) {
      console.error("Error querying identity record:", error);
    }
  }, [queryUuid]);

  // Update transaction status
  React.useEffect(() => {
    if (isConfirming) {
      setTxStatus("Confirming transaction...");
    } else if (isConfirmed) {
      setTxStatus("Transaction confirmed!");
      // Clear form inputs
      setWorldIdProofCid("");
      setSignatureCid("");
      setSelfVerificationCid("");
    } else if (error) {
      setTxStatus("Transaction failed: " + error.message);
    }
  }, [isConfirming, isConfirmed, error]);

  // Helper function to populate test data
  const populateTestData = () => {
    setWorldIdProofCid("QmTestWorldId123");
    setSignatureCid("QmTestSignature789");
    setSelfVerificationCid("QmTestSelfVerify012");
    setQueryUuid("anon-1");
  };

  const pending = isPending || isEncryptingInput;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to interact with the contract
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Anonymity Tiers Contract
              </h1>
              <p className="text-gray-600 mb-4">
                Connected: {address} | Chain: {isConnected ? "✅" : "❌"} |
                CoFHE: {cofhejsInitialized ? "✅" : "❌"} | Permit:{" "}
                {isPermitValid ? "✅" : "❌"}
              </p>
              {activePermit && (
                <p className="text-sm text-gray-500 mb-2">
                  Active Permit: {activePermit.name || "Unnamed"} - Expires:{" "}
                  {new Date(
                    Number(activePermit.expiration) * 1000
                  ).toLocaleDateString()}
                </p>
              )}
              {uuidCounter && (
                <p className="text-sm text-gray-500">
                  Next UUID: anon-{uuidCounter.toString()}
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={populateTestData}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Load Test Data
              </button>
              <button
                onClick={() => setGeneratePermitModalOpen(true)}
                disabled={!cofhejsInitialized}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Permit
              </button>
              <ConnectButton />
            </div>
          </div>
          {txStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">{txStatus}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  placeholder="QmWorldId123..."
                />
              </div>
              <button
                onClick={createAnonymousRecord}
                disabled={pending || inputEncryptionDisabled}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Processing..." : "Create Anonymous Record"}
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
                  World ID Proof CID
                </label>
                <input
                  type="text"
                  value={worldIdProofCid}
                  onChange={(e) => setWorldIdProofCid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="QmWorldId123..."
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
                  placeholder="QmSignature789..."
                />
              </div>
              <button
                onClick={createPseudonymousRecord}
                disabled={pending || inputEncryptionDisabled}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Processing..." : "Create Pseudonymous Record"}
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
                  World ID Proof CID
                </label>
                <input
                  type="text"
                  value={worldIdProofCid}
                  onChange={(e) => setWorldIdProofCid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="QmWorldId123..."
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
                  placeholder="QmSignature789..."
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
                  placeholder="QmSelfVerify012..."
                />
              </div>
              <button
                onClick={createIdentityRecord}
                disabled={pending || inputEncryptionDisabled}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Processing..." : "Create Identity Record"}
              </button>
            </div>
          </div>

          {/* Query Records */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Query Records</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UUID
                </label>
                <input
                  type="text"
                  value={queryUuid}
                  onChange={(e) => setQueryUuid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="anon-1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={queryAnonymousRecord}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Query Anonymous
                </button>
                <button
                  onClick={queryPseudonymousRecord}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Query Pseudonymous
                </button>
                <button
                  onClick={queryIdentityRecord}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                >
                  Query Identity
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {(anonymousRecord || pseudonymousRecord || identityRecord) && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Query Results</h3>
            {anonymousRecord && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Anonymous Record:</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(anonymousRecord, null, 2)}
                </pre>
              </div>
            )}
            {pseudonymousRecord && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Pseudonymous Record:</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(pseudonymousRecord, null, 2)}
                </pre>
              </div>
            )}
            {identityRecord && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Identity Record:</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(identityRecord, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPage;
