import { useCallback, useMemo, useEffect } from "react";
import { cofhejs, permitStore } from "cofhejs/web";
import { PublicClient, WalletClient, createWalletClient, http } from "viem";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useStore } from "zustand";
import scaffoldConfig from "../scaffold.config";

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
  return useMemo(
    () =>
      scaffoldConfig.targetNetworks.some(
        (network: chains.Chain) => network.id === chainId
      ),
    [chainId]
  );
};

export function useInitializeCofhejs() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { isConnected, address } = useAccount();
  const isChainSupported = useIsConnectedChainSupported();

  const handleError = (error: string) => {
    console.error("cofhejs initialization error:", error);
  };

  useEffect(() => {
    const initializeCofhejs = async () => {
      if (!publicClient || !walletClient || !isChainSupported || !isConnected) {
        console.log("CoFHE initialization skipped:", {
          publicClient: !!publicClient,
          walletClient: !!walletClient,
          isChainSupported,
          isConnected,
        });
        return;
      }

      console.log("Initializing CoFHE...", {
        chainId: publicClient.chain.id,
        address,
        chain: publicClient.chain.name,
      });

      const chainId = publicClient.chain.id;
      const environment =
        ChainEnvironments[chainId as keyof typeof ChainEnvironments] ??
        "TESTNET";

      console.log("Using environment:", environment);

      const viemZkvSigner = createWalletClientFromPrivateKey(
        publicClient,
        zkvSignerPrivateKey
      );

      try {
        console.log("Starting CoFHE initialization with parameters:", {
          environment,
          generatePermit: false,
          mockConfig: { decryptDelay: 1000 },
        });

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
          console.log("CoFHE state:", cofhejs.store.getState());
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
  }, [walletClient, publicClient, isChainSupported, isConnected, address]);
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

// Permit hooks
type PermitStoreState = ReturnType<typeof permitStore.store.getState>;

const useCofhejsPermitStore = <T>(selector: (state: PermitStoreState) => T) => {
  return useStore(permitStore.store, selector);
};

export const useCofhejsActivePermitHash = () => {
  const { chainId, account, initialized } = useCofhejsStatus();
  return useCofhejsPermitStore((state) => {
    if (!initialized || !chainId || !account) return undefined;
    return state.activePermitHash?.[chainId]?.[account];
  });
};

export const useCofhejsActivePermit = () => {
  const activePermitHash = useCofhejsActivePermitHash();
  return useMemo(() => {
    const permitResult = cofhejs.getPermit(activePermitHash ?? undefined);
    if (!permitResult) return null;
    if (permitResult.success) {
      return permitResult.data;
    } else {
      return null;
    }
  }, [activePermitHash]);
};

export const useCofhejsIsActivePermitValid = () => {
  const permit = useCofhejsActivePermit();
  return useMemo(() => {
    if (!permit) return false;
    return permit.isValid();
  }, [permit]);
};
