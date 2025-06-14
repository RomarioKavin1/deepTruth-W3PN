// Simplified scaffold-eth hooks for contract interaction
import { useReadContract, useWriteContract } from "wagmi";

// Simple wrapper that maintains the scaffold-eth pattern but works with direct contract calls
export const useScaffoldReadContract = (
  params: Parameters<typeof useReadContract>[0]
) => {
  return useReadContract(params);
};

export const useScaffoldWriteContract = (
  params: { contractName?: string } = {}
) => {
  return useWriteContract();
};
