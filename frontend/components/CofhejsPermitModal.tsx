"use client";

import { useCallback, useState } from "react";
import { zeroAddress } from "viem";
import { useStore } from "zustand";
import { create } from "zustand";
import { cofhejs, PermitOptions } from "cofhejs/web";
import { useCofhejsAccount, useCofhejsStatus } from "../hooks/useCofhejs";

interface CofhejsPermitModalStore {
  generatePermitModalOpen: boolean;
  generatePermitModalCallback?: () => void;
  setGeneratePermitModalOpen: (open: boolean, callback?: () => void) => void;
}

export const useCofhejsModalStore = create<CofhejsPermitModalStore>((set) => ({
  generatePermitModalOpen: false,
  setGeneratePermitModalOpen: (open, callback) =>
    set({
      generatePermitModalOpen: open,
      generatePermitModalCallback: callback,
    }),
}));

type ExpirationOption = "1 day" | "1 week" | "1 month";

export const CofhejsPermitModal = () => {
  const {
    generatePermitModalOpen,
    generatePermitModalCallback,
    setGeneratePermitModalOpen,
  } = useCofhejsModalStore();
  const { chainId, account, initialized } = useCofhejsStatus();
  const [expiration, setExpiration] = useState<ExpirationOption>("1 week");
  const [name, setName] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const handleClose = useCallback(() => {
    setGeneratePermitModalOpen(false);
    // Reset state when closing
    setExpiration("1 week");
    setName("");
  }, [setGeneratePermitModalOpen]);

  const handleGeneratePermit = useCallback(async () => {
    if (!initialized || !chainId || !account) return;

    setIsCreating(true);

    try {
      const permitName = name.length > 0 ? name.slice(0, 24) : undefined;
      const expirationDate = new Date();
      expirationDate.setDate(
        expirationDate.getDate() +
          (expiration === "1 day" ? 1 : expiration === "1 week" ? 7 : 30)
      );

      const permitResult = await cofhejs.createPermit({
        type: "self",
        name: permitName,
        issuer: account,
        expiration: Math.round(expirationDate.getTime() / 1000),
      });

      if (permitResult.success) {
        console.log("Permit created successfully");
        handleClose();
        // If there was a callback provided when opening the modal, execute it
        if (generatePermitModalCallback) {
          generatePermitModalCallback();
        }
      } else {
        console.error("Failed to create permit:", permitResult.error);
        alert("Failed to create permit: " + permitResult.error.message);
      }
    } catch (error) {
      console.error("Error creating permit:", error);
      alert("Error creating permit");
    } finally {
      setIsCreating(false);
    }
  }, [
    initialized,
    chainId,
    account,
    name,
    expiration,
    generatePermitModalCallback,
    handleClose,
  ]);

  if (!generatePermitModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generate CoFHE Permit</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            A permit is required to authenticate your identity and grant access
            to encrypted data.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Generating a permit will open your wallet to sign a message (EIP712)
            which verifies your ownership.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter permit name"
              maxLength={24}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration
            </label>
            <select
              value={expiration}
              onChange={(e) =>
                setExpiration(e.target.value as ExpirationOption)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1 day">1 day</option>
              <option value="1 week">1 week</option>
              <option value="1 month">1 month</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePermit}
            disabled={!initialized || isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Generate Permit"}
          </button>
        </div>
      </div>
    </div>
  );
};
