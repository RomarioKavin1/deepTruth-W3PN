import React, { useCallback } from "react";
import { FheTypes, cofhejs } from "cofhejs/web";
import { useCofhejsInitialized } from "@/hooks/useCofhejs";

interface EncryptedValueProps<T extends FheTypes> {
  fheType: T;
  ctHash: bigint | null | undefined;
  label: string;
}

export const EncryptedValue = <T extends FheTypes>({
  label,
  fheType,
  ctHash,
}: EncryptedValueProps<T>) => {
  const cofhejsInitialized = useCofhejsInitialized();
  const [decryptedValue, setDecryptedValue] = React.useState<string | null>(
    null
  );
  const [isDecrypting, setIsDecrypting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDecrypt = useCallback(async () => {
    if (!ctHash || !cofhejsInitialized) return;

    setIsDecrypting(true);
    setError(null);

    try {
      const result = await cofhejs.unseal(ctHash, fheType);
      if (result.success) {
        // Convert BigInt to string for display
        const displayValue =
          typeof result.data === "bigint"
            ? result.data.toString()
            : String(result.data);
        setDecryptedValue(displayValue);
      } else {
        setError("Failed to decrypt");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decryption failed");
    } finally {
      setIsDecrypting(false);
    }
  }, [ctHash, fheType, cofhejsInitialized]);

  if (!ctHash) {
    return (
      <div className="flex flex-row items-center justify-start p-1 pl-4 gap-2 flex-1 rounded-3xl bg-gray-100 min-h-12">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-xs font-semibold flex-1 italic">No data</span>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-start p-1 pl-4 gap-2 flex-1 rounded-3xl bg-purple-50 border border-purple-200 min-h-12">
      <span className="text-xs font-semibold">{label}</span>

      {decryptedValue ? (
        <div className="flex flex-1 px-4 items-center justify-center gap-2 h-10 bg-green-100 border-green-300 border-2 border-solid rounded-full">
          <span className="text-green-600">🔓</span>
          <div className="flex flex-1 items-center justify-center">
            <span className="font-mono text-sm">{decryptedValue}</span>
          </div>
        </div>
      ) : error ? (
        <span className="text-xs text-red-600 font-semibold flex-1 italic">
          {error}
        </span>
      ) : (
        <button
          className={`flex-1 px-4 py-2 rounded-full border-2 transition-colors ${
            cofhejsInitialized
              ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
              : "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
          }`}
          onClick={handleDecrypt}
          disabled={!cofhejsInitialized || isDecrypting}
        >
          {isDecrypting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Decrypting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🔒</span>
              Encrypted - Click to Decrypt
            </span>
          )}
        </button>
      )}
    </div>
  );
};
