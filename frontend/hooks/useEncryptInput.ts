import { useCallback, useState } from "react";
import { useCofhejsInitialized } from "./useCofhejs";
import {
  Encryptable,
  EncryptableAddress,
  EncryptableBool,
  EncryptableUint8,
  EncryptableUint16,
  EncryptableUint32,
  EncryptableUint64,
  EncryptableUint128,
  EncryptableUint256,
  FheTypes,
  cofhejs,
} from "cofhejs/web";

type EncryptableFromFheTypes<T extends FheTypes> = T extends FheTypes.Bool
  ? EncryptableBool
  : T extends FheTypes.Uint8
  ? EncryptableUint8
  : T extends FheTypes.Uint16
  ? EncryptableUint16
  : T extends FheTypes.Uint32
  ? EncryptableUint32
  : T extends FheTypes.Uint64
  ? EncryptableUint64
  : T extends FheTypes.Uint128
  ? EncryptableUint128
  : T extends FheTypes.Uint256
  ? EncryptableUint256
  : T extends FheTypes.Uint160
  ? EncryptableAddress
  : never;

type EncryptableInput<T extends FheTypes> = EncryptableFromFheTypes<T>["data"];

const fheTypeToEncryptable = <T extends FheTypes>(
  fheType: T,
  value: EncryptableInput<T>
): EncryptableFromFheTypes<T> => {
  switch (fheType) {
    case FheTypes.Bool:
      return Encryptable.bool(value as boolean) as EncryptableFromFheTypes<T>;
    case FheTypes.Uint8:
      return Encryptable.uint8(
        value as string | bigint
      ) as EncryptableFromFheTypes<T>;
    case FheTypes.Uint16:
      return Encryptable.uint16(
        value as string | bigint
      ) as EncryptableFromFheTypes<T>;
    case FheTypes.Uint32:
      return Encryptable.uint32(
        value as string | bigint
      ) as EncryptableFromFheTypes<T>;
    case FheTypes.Uint64:
      return Encryptable.uint64(
        value as string | bigint
      ) as EncryptableFromFheTypes<T>;
    case FheTypes.Uint128:
      return Encryptable.uint128(
        value as string | bigint
      ) as EncryptableFromFheTypes<T>;
    case FheTypes.Uint256:
      return Encryptable.uint256(
        value as string | bigint
      ) as EncryptableFromFheTypes<T>;
    case FheTypes.Uint160:
      return Encryptable.address(
        value as string | bigint
      ) as EncryptableFromFheTypes<T>;
    default:
      throw new Error(`Unsupported FHE type: ${fheType}`);
  }
};

export const useEncryptInput = () => {
  const [isEncryptingInput, setIsEncryptingInput] = useState(false);
  const initialized = useCofhejsInitialized();

  const onEncryptInput = useCallback(
    async <T extends FheTypes, E extends EncryptableInput<T>>(
      fheType: T,
      value: E
    ) => {
      if (!initialized) {
        console.error("CoFHE not initialized");
        return;
      }

      console.log(`Encrypting input: ${value}`);
      console.log(`FHE Type: ${fheType}`);
      console.log(`Value type: ${typeof value}`);

      try {
        const encryptable = fheTypeToEncryptable<T>(fheType, value);
        console.log(`Created encryptable:`, encryptable);

        setIsEncryptingInput(true);
        const encryptedResult = await cofhejs.encrypt([encryptable]);
        setIsEncryptingInput(false);

        if (!encryptedResult.success) {
          console.error(`Failed to encrypt input: ${encryptedResult.error}`);
          console.error(`Error details:`, encryptedResult.error);
          return;
        }

        const encryptedValue = encryptedResult.data[0];
        console.log(`Encryption successful`);

        return encryptedValue;
      } catch (error) {
        setIsEncryptingInput(false);
        console.error(`Encryption threw error:`, error);
        return;
      }
    },
    [initialized]
  );

  return {
    onEncryptInput,
    isEncryptingInput,
    inputEncryptionDisabled: !initialized,
  };
};
