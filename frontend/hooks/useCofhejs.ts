import { useCallback, useMemo, useEffect } from "react";
import { cofhejs } from "cofhejs/web";
import { PublicClient, WalletClient, createWalletClient, http } from "viem";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useStore } from "zustand";

const ChainEnvironments = {
  // Ethereum
  [chains.mainnet.id]: "MAINNET",
  // Arbitrum
  [chains.arbitrum.id]: "MAINNET",
  // Ethereum Sepolia
  [chains.sepolia.id]: "TESTNET",
  // Arbitrum Sepolia
  [chains.arbitrumSepolia.id]: "TESTNET",
  // Hardhat
  [chains.hardhat.id]: "MOCK",
} as const;

// ZKV SIGNER
const zkvSignerPrivateKey =
  "0x6C8D7F768A6BB4AAFE85E8A2F5A9680355239C7E14646ED62B044E39DE154512";

function createWalletClientFromPrivateKey(
  publicClient: PublicClient,
  privateKey: `0x${string}`
): WalletClient {
  const account: PrivateKeyAccount = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: publicClient.chain,
    transport: http(publicClient.transport.url),
  });
}

export const useIsConnectedChainSupported = () => {
  const { chainId } = useAccount();
  const supportedChains: number[] = [
    chains.arbitrumSepolia.id,
    chains.sepolia.id,
    chains.hardhat.id,
  ];
  return useMemo(
    () => (chainId ? supportedChains.includes(chainId) : false),
    [chainId]
  );
};

export function useInitializeCofhejs() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const isChainSupported = useIsConnectedChainSupported();

  const handleError = (error: string) => {
    console.error("cofhejs initialization error:", error);
  };

  useEffect(() => {
    const initializeCofhejs = async () => {
      if (!publicClient || !walletClient || !isChainSupported) return;

      console.log("Initializing CoFHE...");

      const chainId = publicClient?.chain.id;
      const environment =
        ChainEnvironments[chainId as keyof typeof ChainEnvironments] ??
        "TESTNET";

      const viemZkvSigner = createWalletClientFromPrivateKey(
        publicClient,
        zkvSignerPrivateKey
      );

      try {
        const initializationResult = await cofhejs.initializeWithViem({
          viemClient: publicClient,
          viemWalletClient: walletClient,
          environment,
          generatePermit: false,
          mockConfig: {
            decryptDelay: 1000,
            zkvSigner: viemZkvSigner,
          },
        });

        if (initializationResult.success) {
          console.log("CoFHE initialized successfully");
        } else {
          console.error(
            "CoFHE initialization failed:",
            initializationResult.error
          );
          handleError(
            initializationResult.error.message ??
              String(initializationResult.error)
          );
        }
      } catch (err) {
        console.error("CoFHE initialization error:", err);
        handleError(
          err instanceof Error
            ? err.message
            : "Unknown error initializing cofhejs"
        );
      }
    };

    initializeCofhejs();
  }, [walletClient, publicClient, isChainSupported]);
}

type CofhejsStoreState = ReturnType<typeof cofhejs.store.getState>;

const useCofhejsStore = <T>(selector: (state: CofhejsStoreState) => T) =>
  useStore(cofhejs.store, selector);

export const useCofhejsAccount = () => {
  return useCofhejsStore((state) => state.account);
};

export const useCofhejsChainId = () => {
  return useCofhejsStore((state) => state.chainId);
};

export const useCofhejsInitialized = () => {
  return useCofhejsStore(
    (state) =>
      state.fheKeysInitialized &&
      state.providerInitialized &&
      state.signerInitialized
  );
};

export const useCofhejsStatus = () => {
  const chainId = useCofhejsChainId();
  const account = useCofhejsAccount();
  const initialized = useCofhejsInitialized();

  return useMemo(
    () => ({ chainId, account, initialized }),
    [chainId, account, initialized]
  );
};
