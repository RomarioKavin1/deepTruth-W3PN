import { useState, useEffect } from "react";
import { useChainId } from "wagmi";

type ContractInfo = {
  address: `0x${string}`;
  abi: any[];
};

// This would normally come from a deployedContracts.ts file
// For now, we'll create a simple registry for your specific contracts
const contractsRegistry: Record<string, Record<number, ContractInfo>> = {
  // Add your contracts here as needed
  // Example:
  // "YourContract": {
  //   [chainId]: {
  //     address: "0x...",
  //     abi: [...],
  //   }
  // }
};

export const useDeployedContractInfo = (contractName: string) => {
  const chainId = useChainId();
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);

  useEffect(() => {
    const contract = contractsRegistry[contractName]?.[chainId];
    setContractInfo(contract || null);
  }, [contractName, chainId]);

  return { data: contractInfo };
};
