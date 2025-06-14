// Updated AnonymityTiers Client matching actual frontend data structures
const { ethers } = require("ethers");
const { cofhejs, Encryptable, FheTypes } = require("cofhejs/node");

class AnonymityTiersClientUpdated {
  constructor(contractAddress, provider, signer) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.signer = signer;
    this.contract = null;
  }

  async initialize() {
    // Initialize cofhejs
    const initResult = await cofhejs.initializeWithEthers({
      ethersProvider: this.provider,
      ethersSigner: this.signer,
      environment: "LOCAL", // Change to "TESTNET" or "MAINNET" as needed
    });

    if (!initResult.success) {
      throw new Error(`Failed to initialize cofhejs: ${initResult.error}`);
    }

    // Load contract ABI (updated to match new structure)
    const contractABI = [
      "function createAnonymousRecord(tuple(uint256,uint256,uint256,bytes) _proof, tuple(uint256,uint256,uint256,bytes) _nullifierHash, tuple(uint256,uint256,uint256,bytes) _merkleRoot, tuple(uint256,uint256,uint256,bytes) _verificationType, tuple(uint256,uint256,uint256,bytes) _credentialType) external returns (uint256)",
      "function createPseudonymousRecord(tuple(uint256,uint256,uint256,bytes) _proof, tuple(uint256,uint256,uint256,bytes) _nullifierHash, tuple(uint256,uint256,uint256,bytes) _merkleRoot, tuple(uint256,uint256,uint256,bytes) _verificationType, tuple(uint256,uint256,uint256,bytes) _credentialType, tuple(uint256,uint256,uint256,bytes) _signedMessage) external returns (uint256)",
      "function createIdentityRecord(tuple(uint256,uint256,uint256,bytes) _proof, tuple(uint256,uint256,uint256,bytes) _nullifierHash, tuple(uint256,uint256,uint256,bytes) _merkleRoot, tuple(uint256,uint256,uint256,bytes) _verificationType, tuple(uint256,uint256,uint256,bytes) _credentialType, tuple(uint256,uint256,uint256,bytes) _signedMessage, tuple(uint256,uint256,uint256,bytes) _selfUserId, tuple(uint256,uint256,uint256,bytes) _selfNullifier, tuple(uint256,uint256,uint256,bytes) _nameHash, tuple(uint256,uint256,uint256,bytes) _nationalityHash, tuple(uint256,uint256,uint256,bytes) _age) external returns (uint256)",
      "function getAnonymousRecord(uint256 uuid) external view returns (uint256, uint256, uint256, uint256, uint256, bool, bool, uint32)",
      "function getPseudonymousRecord(uint256 uuid) external view returns (uint256, uint256, uint256, uint256, uint256, bool, address, uint256, bool, uint32, uint32)",
      "function getIdentityRecord(uint256 uuid) external view returns (uint256, uint256, uint256, uint256, uint256, bool, address, uint256, bool, uint256, uint256, uint256, uint256, uint32, bool, bool, uint32)",
      "function getRecordInfo(uint256 uuid) external view returns (uint8, address)",
      "function upgradeToPseudonymous(uint256 uuid, tuple(uint256,uint256,uint256,bytes) _signedMessage) external",
      "function upgradeToIdentity(uint256 uuid, tuple(uint256,uint256,uint256,bytes) _selfUserId, tuple(uint256,uint256,uint256,bytes) _selfNullifier, tuple(uint256,uint256,uint256,bytes) _nameHash, tuple(uint256,uint256,uint256,bytes) _nationalityHash, tuple(uint256,uint256,uint256,bytes) _age) external",
    ];

    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI,
      this.signer
    );

    console.log("AnonymityTiersUpdated client initialized successfully");
    return initResult.data;
  }

  // ==================== ENCRYPTION HELPERS ====================

  async encryptString(value) {
    const logState = (state) => {
      console.log(`String Encryption State: ${state}`);
    };

    // Convert string to BigInt for encryption
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    const bigIntValue = BigInt("0x" + hex);

    const [encrypted] = await cofhejs.encrypt(logState, [
      Encryptable.uint256(bigIntValue),
    ]);
    return encrypted;
  }

  async encryptHexString(hexString) {
    const logState = (state) => {
      console.log(`Hex Encryption State: ${state}`);
    };

    // Remove 0x prefix if present
    const cleanHex = hexString.startsWith("0x")
      ? hexString.slice(2)
      : hexString;
    const bigIntValue = BigInt("0x" + cleanHex);

    const [encrypted] = await cofhejs.encrypt(logState, [
      Encryptable.uint256(bigIntValue),
    ]);
    return encrypted;
  }

  async encryptAge(age) {
    const logState = (state) => {
      console.log(`Age Encryption State: ${state}`);
    };

    const [encrypted] = await cofhejs.encrypt(logState, [
      Encryptable.uint32(age),
    ]);
    return encrypted;
  }

  // ==================== WORLD ID VERIFICATION ====================

  async createAnonymousRecordFromWorldId(worldIdProofData) {
    console.log("Creating anonymous record from World ID data...");

    // worldIdProofData should match your test-verify page structure:
    // {
    //   verification_level: "orb",
    //   credential_type: "orb",
    //   proof: "0x290f2c6b2fa3438307841d231085bfe564980e8be41f36db226966e9d63c47fd...",
    //   nullifier_hash: "0x255243621a57d769e48015daa5cb85c6861959274a0ef640f025e9e51c9306c3",
    //   merkle_root: "0x21ed51602596a46d2b5015158346821c8924e4d8be09e2c7b8195f67fbc6c789"
    // }

    // Encrypt the World ID data
    const encryptedProof = await this.encryptHexString(worldIdProofData.proof);
    const encryptedNullifier = await this.encryptHexString(
      worldIdProofData.nullifier_hash
    );
    const encryptedMerkleRoot = await this.encryptHexString(
      worldIdProofData.merkle_root
    );
    const encryptedVerificationType = await this.encryptString(
      worldIdProofData.verification_level
    );
    const encryptedCredentialType = await this.encryptString(
      worldIdProofData.credential_type
    );

    // Create the record
    const tx = await this.contract.createAnonymousRecord(
      encryptedProof,
      encryptedNullifier,
      encryptedMerkleRoot,
      encryptedVerificationType,
      encryptedCredentialType
    );

    const receipt = await tx.wait();
    const uuid = receipt.logs[0].args[0];

    console.log(`Anonymous record created with UUID: ${uuid}`);
    return uuid;
  }

  async getAnonymousRecord(uuid) {
    console.log(`Retrieving anonymous record with UUID: ${uuid}`);

    const sealedData = await this.contract.getAnonymousRecord(uuid);

    // Unseal the data
    const proof = await cofhejs.unseal(sealedData[0], FheTypes.Uint256);
    const nullifierHash = await cofhejs.unseal(sealedData[1], FheTypes.Uint256);
    const merkleRoot = await cofhejs.unseal(sealedData[2], FheTypes.Uint256);
    const verificationType = await cofhejs.unseal(
      sealedData[3],
      FheTypes.Uint256
    );
    const credentialType = await cofhejs.unseal(
      sealedData[4],
      FheTypes.Uint256
    );
    const isValid = await cofhejs.unseal(sealedData[5], FheTypes.Bool);
    const isActive = await cofhejs.unseal(sealedData[6], FheTypes.Bool);
    const createdAt = await cofhejs.unseal(sealedData[7], FheTypes.Uint32);

    if (!proof.success || !nullifierHash.success || !merkleRoot.success) {
      throw new Error("Failed to unseal anonymous record data");
    }

    return {
      worldId: {
        proof: "0x" + proof.data.toString(16),
        nullifierHash: "0x" + nullifierHash.data.toString(16),
        merkleRoot: "0x" + merkleRoot.data.toString(16),
        verificationType: this.decodeString(verificationType.data),
        credentialType: this.decodeString(credentialType.data),
        isValid: isValid.data,
      },
      isActive: isActive.data,
      createdAt: Number(createdAt.data),
    };
  }

  // ==================== SELF VERIFICATION ====================

  async createIdentityRecordWithSelf(
    worldIdProofData,
    selfVerificationData,
    signedMessage
  ) {
    console.log("Creating identity record with Self verification...");

    // selfVerificationData should match your self-verify API response:
    // {
    //   userId: "string",
    //   nullifier: "string",
    //   credentialSubject: {
    //     name: "string",
    //     nationality: "string",
    //     age: number
    //   }
    // }

    // Encrypt World ID data
    const encryptedProof = await this.encryptHexString(worldIdProofData.proof);
    const encryptedNullifier = await this.encryptHexString(
      worldIdProofData.nullifier_hash
    );
    const encryptedMerkleRoot = await this.encryptHexString(
      worldIdProofData.merkle_root
    );
    const encryptedVerificationType = await this.encryptString(
      worldIdProofData.verification_level
    );
    const encryptedCredentialType = await this.encryptString(
      worldIdProofData.credential_type
    );
    const encryptedSignedMessage = await this.encryptString(signedMessage);

    // Encrypt Self verification data
    const encryptedSelfUserId = await this.encryptString(
      selfVerificationData.userId
    );
    const encryptedSelfNullifier = await this.encryptString(
      selfVerificationData.nullifier
    );

    // Hash sensitive identity data before encryption
    const nameHash = ethers.keccak256(
      ethers.toUtf8Bytes(selfVerificationData.credentialSubject.name)
    );
    const nationalityHash = ethers.keccak256(
      ethers.toUtf8Bytes(selfVerificationData.credentialSubject.nationality)
    );

    const encryptedNameHash = await this.encryptHexString(nameHash);
    const encryptedNationalityHash = await this.encryptHexString(
      nationalityHash
    );
    const encryptedAge = await this.encryptAge(
      selfVerificationData.credentialSubject.age
    );

    // Create the record
    const tx = await this.contract.createIdentityRecord(
      encryptedProof,
      encryptedNullifier,
      encryptedMerkleRoot,
      encryptedVerificationType,
      encryptedCredentialType,
      encryptedSignedMessage,
      encryptedSelfUserId,
      encryptedSelfNullifier,
      encryptedNameHash,
      encryptedNationalityHash,
      encryptedAge
    );

    const receipt = await tx.wait();
    const uuid = receipt.logs[0].args[0];

    console.log(`Identity record created with UUID: ${uuid}`);
    return uuid;
  }

  async getIdentityRecord(uuid) {
    console.log(`Retrieving identity record with UUID: ${uuid}`);

    const sealedData = await this.contract.getIdentityRecord(uuid);

    // Unseal all the data
    const unseals = await Promise.all([
      cofhejs.unseal(sealedData[0], FheTypes.Uint256), // worldIdProof
      cofhejs.unseal(sealedData[1], FheTypes.Uint256), // worldIdNullifier
      cofhejs.unseal(sealedData[2], FheTypes.Uint256), // merkleRoot
      cofhejs.unseal(sealedData[3], FheTypes.Uint256), // verificationType
      cofhejs.unseal(sealedData[4], FheTypes.Uint256), // credentialType
      cofhejs.unseal(sealedData[5], FheTypes.Bool), // worldIdValid
      // sealedData[6] is userAddress (public)
      cofhejs.unseal(sealedData[7], FheTypes.Uint256), // signedMessage
      cofhejs.unseal(sealedData[8], FheTypes.Bool), // addressVerified
      cofhejs.unseal(sealedData[9], FheTypes.Uint256), // selfUserId
      cofhejs.unseal(sealedData[10], FheTypes.Uint256), // selfNullifier
      cofhejs.unseal(sealedData[11], FheTypes.Uint256), // nameHash
      cofhejs.unseal(sealedData[12], FheTypes.Uint256), // nationalityHash
      cofhejs.unseal(sealedData[13], FheTypes.Uint32), // age
      cofhejs.unseal(sealedData[14], FheTypes.Bool), // selfValid
      cofhejs.unseal(sealedData[15], FheTypes.Bool), // identityVerified
      cofhejs.unseal(sealedData[16], FheTypes.Uint32), // verifiedAt
    ]);

    return {
      worldId: {
        proof: "0x" + unseals[0].data.toString(16),
        nullifierHash: "0x" + unseals[1].data.toString(16),
        merkleRoot: "0x" + unseals[2].data.toString(16),
        verificationType: this.decodeString(unseals[3].data),
        credentialType: this.decodeString(unseals[4].data),
        isValid: unseals[5].data,
      },
      userAddress: sealedData[6], // Public field
      signedMessage: this.decodeString(unseals[7].data),
      addressVerified: unseals[8].data,
      selfVerification: {
        userId: this.decodeString(unseals[9].data),
        nullifier: this.decodeString(unseals[10].data),
        nameHash: "0x" + unseals[11].data.toString(16),
        nationalityHash: "0x" + unseals[12].data.toString(16),
        age: Number(unseals[13].data),
        isValid: unseals[14].data,
      },
      identityVerified: unseals[15].data,
      verifiedAt: Number(unseals[16].data),
    };
  }

  // ==================== UTILITY FUNCTIONS ====================

  decodeString(bigIntValue) {
    try {
      const hex = bigIntValue.toString(16);
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch (error) {
      return bigIntValue.toString();
    }
  }

  async getRecordInfo(uuid) {
    const info = await this.contract.getRecordInfo(uuid);
    const tierNames = ["ANONYMOUS", "PSEUDONYMOUS", "IDENTITY"];

    return {
      tier: tierNames[info[0]],
      owner: info[1],
    };
  }
}

// ==================== USAGE EXAMPLE ====================

async function exampleUsageWithRealData() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:42069");
  const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

  // Initialize client
  const client = new AnonymityTiersClientUpdated(
    "CONTRACT_ADDRESS",
    provider,
    wallet
  );
  await client.initialize();

  try {
    // Example 1: Create anonymous record from World ID verification
    console.log("\n=== Creating Anonymous Record from World ID ===");

    // This matches the data structure from your test-verify page
    const worldIdData = {
      verification_level: "orb",
      credential_type: "orb",
      proof:
        "0x290f2c6b2fa3438307841d231085bfe564980e8be41f36db226966e9d63c47fd8e89c25c0d009d66700b10a84beb45fa3",
      nullifier_hash:
        "0x255243621a57d769e48015daa5cb85c6861959274a0ef640f025e9e51c9306c3",
      merkle_root:
        "0x21ed51602596a46d2b5015158346821c8924e4d8be09e2c7b8195f67fbc6c789",
    };

    const anonymousUuid = await client.createAnonymousRecordFromWorldId(
      worldIdData
    );
    const anonymousData = await client.getAnonymousRecord(anonymousUuid);
    console.log("Decrypted anonymous data:", anonymousData);

    // Example 2: Create full identity record with Self verification
    console.log("\n=== Creating Identity Record with Self Verification ===");

    // This matches the data structure from your self-verify API response
    const selfData = {
      userId: "user123456",
      nullifier: "nullifier789",
      credentialSubject: {
        name: "John Doe",
        nationality: "US",
        age: 25,
      },
    };

    const signedMessage = "Address verification signature";

    const identityUuid = await client.createIdentityRecordWithSelf(
      worldIdData,
      selfData,
      signedMessage
    );

    const identityData = await client.getIdentityRecord(identityUuid);
    console.log("Full identity data:", identityData);

    // Example 3: Get record info
    const recordInfo = await client.getRecordInfo(identityUuid);
    console.log("Record info:", recordInfo);
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { AnonymityTiersClientUpdated, exampleUsageWithRealData };

// Uncomment to run example
// exampleUsageWithRealData().catch(console.error);
