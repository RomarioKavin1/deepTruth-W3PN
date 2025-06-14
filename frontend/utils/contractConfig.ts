export const ANONYMITY_TIERS_ADDRESS =
  "0x3BAe9481fCaFE28130705C13450C21f770FE6738";

export const ANONYMITY_TIERS_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "uuid",
        type: "string",
      },
    ],
    name: "AnonymousRecordCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "uuid",
        type: "string",
      },
    ],
    name: "IdentityUpgrade",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "uuid",
        type: "string",
      },
    ],
    name: "PseudonymousUpgrade",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "inEuint256",
        name: "_encryptedWorldIdProofCid",
        type: "bytes",
      },
    ],
    name: "createAnonymousRecord",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "inEuint256",
        name: "_encryptedWorldIdProofCid",
        type: "bytes",
      },
      {
        internalType: "inEuint256",
        name: "_encryptedSignatureCid",
        type: "bytes",
      },
    ],
    name: "createPseudonymousRecord",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "inEuint256",
        name: "_encryptedWorldIdProofCid",
        type: "bytes",
      },
      {
        internalType: "inEuint256",
        name: "_encryptedSignatureCid",
        type: "bytes",
      },
      {
        internalType: "inEuint256",
        name: "_encryptedSelfVerificationProofCid",
        type: "bytes",
      },
    ],
    name: "createIdentityRecord",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_uuid",
        type: "string",
      },
    ],
    name: "getAnonymousRecord",
    outputs: [
      {
        components: [
          {
            internalType: "euint256",
            name: "encryptedWorldIdProofCid",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct AnonymityTiers.AnonymousRecord",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_uuid",
        type: "string",
      },
    ],
    name: "getIdentityRecord",
    outputs: [
      {
        components: [
          {
            internalType: "euint256",
            name: "encryptedWorldIdProofCid",
            type: "uint256",
          },
          {
            internalType: "euint256",
            name: "encryptedSignatureCid",
            type: "uint256",
          },
          {
            internalType: "euint256",
            name: "encryptedSelfVerificationProofCid",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct AnonymityTiers.IdentityRecord",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_uuid",
        type: "string",
      },
    ],
    name: "getPseudonymousRecord",
    outputs: [
      {
        components: [
          {
            internalType: "euint256",
            name: "encryptedWorldIdProofCid",
            type: "uint256",
          },
          {
            internalType: "euint256",
            name: "encryptedSignatureCid",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct AnonymityTiers.PseudonymousRecord",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "uuidCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_uuid",
        type: "string",
      },
    ],
    name: "checkRecordTier",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getUserUUIDs",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
