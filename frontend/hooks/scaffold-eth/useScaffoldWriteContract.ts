import { useWriteContract } from "wagmi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { Abi, ExtractAbiFunctionNames } from "abitype";
import { UseWriteContractParameters } from "wagmi";

type WriteContractConfig = {
  contractName: string;
};

export const useScaffoldWriteContract = <TAbi extends Abi>({
  contractName,
}: WriteContractConfig) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);
  const { writeContract, writeContractAsync, ...writeContractResult } =
    useWriteContract();

  const writeContractWrapper = (args: {
    functionName: ExtractAbiFunctionNames<TAbi, "nonpayable" | "payable">;
    args?: readonly unknown[];
    value?: bigint;
  }) => {
    if (!deployedContract) {
      throw new Error(`Contract ${contractName} not found`);
    }

    return writeContract({
      address: deployedContract.address,
      abi: deployedContract.abi,
      ...args,
    } as any);
  };

  const writeContractAsyncWrapper = async (args: {
    functionName: ExtractAbiFunctionNames<TAbi, "nonpayable" | "payable">;
    args?: readonly unknown[];
    value?: bigint;
  }) => {
    if (!deployedContract) {
      throw new Error(`Contract ${contractName} not found`);
    }

    return writeContractAsync({
      address: deployedContract.address,
      abi: deployedContract.abi,
      ...args,
    } as any);
  };

  return {
    writeContract: writeContractWrapper,
    writeContractAsync: writeContractAsyncWrapper,
    ...writeContractResult,
  };
};
