import { useReadContract } from "wagmi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { Abi, AbiFunction, ExtractAbiFunctionNames } from "abitype";
import { UseReadContractParameters } from "wagmi";

type ReadContractConfig<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, "pure" | "view">
> = {
  contractName: string;
  functionName: TFunctionName;
  args?: Parameters<
    Extract<
      TAbi[number],
      { name: TFunctionName; type: "function" }
    >["inputs"] extends readonly []
      ? () => void
      : (args: any[]) => void
  >;
} & Omit<
  UseReadContractParameters,
  "address" | "abi" | "functionName" | "args"
>;

export const useScaffoldReadContract = <
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, "pure" | "view">
>({
  contractName,
  functionName,
  args,
  ...readConfig
}: ReadContractConfig<TAbi, TFunctionName>) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  return useReadContract({
    address: deployedContract?.address,
    abi: deployedContract?.abi as unknown as TAbi,
    functionName,
    args,
    ...readConfig,
  } as UseReadContractParameters);
};
