// Example usage of AnonymityTiers contract with cofhejs
const { ethers } = require("ethers");
const { cofhejs, Encryptable, FheTypes } = require("cofhejs/node");

class AnonymityTiersClient {
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

    // Load contract ABI and create contract instance
    const contractABI = [
      // Add your contract ABI here
      "function createAnonymousRecord(tuple(uint256,uint256,uint256,bytes) _proof, tuple(uint256,uint256,uint256,bytes) _nullifierHash, tuple(uint256,uint256,uint256,bytes) _merkleRoot) external returns (uint256)",
      "function createPseudonymousRecord(tuple(uint256,uint256,uint256,bytes) _proof, tuple(uint256,uint256,uint256,bytes) _nullifierHash, tuple(uint256,uint256,uint256,bytes) _merkleRoot, tuple(uint256,uint256,uint256,bytes) _signedMessage) external returns (uint256)",
      "function createIdentityRecord(tuple(uint256,uint256,uint256,bytes) _proof, tuple(uint256,uint256,uint256,bytes) _nullifierHash, tuple(uint256,uint256,uint256,bytes) _merkleRoot, tuple(uint256,uint256,uint256,bytes) _signedMessage, tuple(uint256,uint256,uint256,bytes) _nameProof, tuple(uint256,uint256,uint256,bytes) _ageProof, tuple(uint256,uint256,uint256,bytes) _nationalityProof) external returns (uint256)",
      "function getAnonymousRecord(uint256 uuid) external view returns (uint256, uint256, uint256, uint256)",
      "function getPseudonymousRecord(uint256 uuid) external view returns (uint256, uint256, uint256, uint256, address, uint256, uint256)",
      "function getIdentityRecord(uint256 uuid) external view returns (uint256, uint256, uint256, uint256, address, uint256, uint256, uint256, uint256, uint256, uint256)",
      "function getRecordInfo(uint256 uuid) external view returns (uint8, address)",
      "function upgradeToPseudonymous(uint256 uuid, tuple(uint256,uint256,uint256,bytes) _signedMessage) external",
      "function upgradeToIdentity(uint256 uuid, tuple(uint256,uint256,uint256,bytes) _nameProof, tuple(uint256,uint256,uint256,bytes) _ageProof, tuple(uint256,uint256,uint256,bytes) _nationalityProof) external",
    ];

    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI,
      this.signer
    );

    console.log("AnonymityTiers client initialized successfully");
    return initResult.data; // Returns permit if generated
  }

  // ==================== ENCRYPTION HELPERS ====================

  async encryptData(data) {
    const logState = (state) => {
      console.log(`Encryption State: ${state}`);
    };

    const encryptedData = await cofhejs.encrypt(logState, [
      Encryptable.uint256(BigInt(data)),
    ]);

    return encryptedData[0];
  }

  async encryptMultipleData(dataArray) {
    const logState = (state) => {
      console.log(`Encryption State: ${state}`);
    };

    const encryptables = dataArray.map((data) =>
      Encryptable.uint256(BigInt(data))
    );
    const encryptedArray = await cofhejs.encrypt(logState, encryptables);

    return encryptedArray;
  }

  // ==================== TIER 1: ANONYMOUS ====================

  async createAnonymousRecord(worldIdProof, nullifierHash, merkleRoot) {
    console.log("Creating anonymous record...");

    // Encrypt the data
    const [encryptedProof, encryptedNullifier, encryptedMerkle] =
      await this.encryptMultipleData([worldIdProof, nullifierHash, merkleRoot]);

    // Create the record
    const tx = await this.contract.createAnonymousRecord(
      encryptedProof,
      encryptedNullifier,
      encryptedMerkle
    );

    const receipt = await tx.wait();
    const uuid = receipt.logs[0].args[0]; // Assuming first event is RecordCreated

    console.log(`Anonymous record created with UUID: ${uuid}`);
    return uuid;
  }

  async getAnonymousRecord(uuid) {
    console.log(`Retrieving anonymous record with UUID: ${uuid}`);

    // Get sealed data from contract
    const sealedData = await this.contract.getAnonymousRecord(uuid);

    // Unseal the data
    const proof = await cofhejs.unseal(sealedData[0], FheTypes.Uint256);
    const nullifierHash = await cofhejs.unseal(sealedData[1], FheTypes.Uint256);
    const merkleRoot = await cofhejs.unseal(sealedData[2], FheTypes.Uint256);
    const isValid = await cofhejs.unseal(sealedData[3], FheTypes.Bool);

    if (
      !proof.success ||
      !nullifierHash.success ||
      !merkleRoot.success ||
      !isValid.success
    ) {
      throw new Error("Failed to unseal anonymous record data");
    }

    return {
      proof: proof.data,
      nullifierHash: nullifierHash.data,
      merkleRoot: merkleRoot.data,
      isValid: isValid.data,
    };
  }

  // ==================== TIER 2: PSEUDONYMOUS ====================

  async createPseudonymousRecord(
    worldIdProof,
    nullifierHash,
    merkleRoot,
    signedMessage
  ) {
    console.log("Creating pseudonymous record...");

    // Encrypt the data
    const [
      encryptedProof,
      encryptedNullifier,
      encryptedMerkle,
      encryptedMessage,
    ] = await this.encryptMultipleData([
      worldIdProof,
      nullifierHash,
      merkleRoot,
      signedMessage,
    ]);

    // Create the record
    const tx = await this.contract.createPseudonymousRecord(
      encryptedProof,
      encryptedNullifier,
      encryptedMerkle,
      encryptedMessage
    );

    const receipt = await tx.wait();
    const uuid = receipt.logs[0].args[0];

    console.log(`Pseudonymous record created with UUID: ${uuid}`);
    return uuid;
  }

  async getPseudonymousRecord(uuid) {
    console.log(`Retrieving pseudonymous record with UUID: ${uuid}`);

    const sealedData = await this.contract.getPseudonymousRecord(uuid);

    // Unseal the encrypted data
    const proof = await cofhejs.unseal(sealedData[0], FheTypes.Uint256);
    const nullifierHash = await cofhejs.unseal(sealedData[1], FheTypes.Uint256);
    const merkleRoot = await cofhejs.unseal(sealedData[2], FheTypes.Uint256);
    const isValid = await cofhejs.unseal(sealedData[3], FheTypes.Bool);
    const signedMessage = await cofhejs.unseal(sealedData[5], FheTypes.Uint256);
    const addressVerified = await cofhejs.unseal(sealedData[6], FheTypes.Bool);

    // userAddress is at index 4 and is not encrypted
    const userAddress = sealedData[4];

    return {
      proof: proof.data,
      nullifierHash: nullifierHash.data,
      merkleRoot: merkleRoot.data,
      isValid: isValid.data,
      userAddress: userAddress,
      signedMessage: signedMessage.data,
      addressVerified: addressVerified.data,
    };
  }

  // ==================== TIER 3: IDENTITY ====================

  async createIdentityRecord(
    worldIdProof,
    nullifierHash,
    merkleRoot,
    signedMessage,
    nameProof,
    ageProof,
    nationalityProof
  ) {
    console.log("Creating identity record...");

    // Encrypt most data as uint256
    const [
      encryptedProof,
      encryptedNullifier,
      encryptedMerkle,
      encryptedMessage,
      encryptedName,
      encryptedNationality,
    ] = await this.encryptMultipleData([
      worldIdProof,
      nullifierHash,
      merkleRoot,
      signedMessage,
      nameProof,
      nationalityProof,
    ]);

    // Encrypt age as uint32
    const logState = (state) => console.log(`Age Encryption State: ${state}`);
    const [encryptedAge] = await cofhejs.encrypt(logState, [
      Encryptable.uint32(ageProof),
    ]);

    // Create the record
    const tx = await this.contract.createIdentityRecord(
      encryptedProof,
      encryptedNullifier,
      encryptedMerkle,
      encryptedMessage,
      encryptedName,
      encryptedAge,
      encryptedNationality
    );

    const receipt = await tx.wait();
    const uuid = receipt.logs[0].args[0];

    console.log(`Identity record created with UUID: ${uuid}`);
    return uuid;
  }

  async getIdentityRecord(uuid) {
    console.log(`Retrieving identity record with UUID: ${uuid}`);

    const sealedData = await this.contract.getIdentityRecord(uuid);

    // Unseal all the encrypted data
    const proof = await cofhejs.unseal(sealedData[0], FheTypes.Uint256);
    const nullifierHash = await cofhejs.unseal(sealedData[1], FheTypes.Uint256);
    const merkleRoot = await cofhejs.unseal(sealedData[2], FheTypes.Uint256);
    const isValid = await cofhejs.unseal(sealedData[3], FheTypes.Bool);
    const signedMessage = await cofhejs.unseal(sealedData[5], FheTypes.Uint256);
    const addressVerified = await cofhejs.unseal(sealedData[6], FheTypes.Bool);
    const nameProof = await cofhejs.unseal(sealedData[7], FheTypes.Uint256);
    const ageProof = await cofhejs.unseal(sealedData[8], FheTypes.Uint32);
    const nationalityProof = await cofhejs.unseal(
      sealedData[9],
      FheTypes.Uint256
    );
    const identityVerified = await cofhejs.unseal(
      sealedData[10],
      FheTypes.Bool
    );

    // userAddress is at index 4 and is not encrypted
    const userAddress = sealedData[4];

    return {
      proof: proof.data,
      nullifierHash: nullifierHash.data,
      merkleRoot: merkleRoot.data,
      isValid: isValid.data,
      userAddress: userAddress,
      signedMessage: signedMessage.data,
      addressVerified: addressVerified.data,
      nameProof: nameProof.data,
      ageProof: ageProof.data,
      nationalityProof: nationalityProof.data,
      identityVerified: identityVerified.data,
    };
  }

  // ==================== UPGRADE FUNCTIONS ====================

  async upgradeToPseudonymous(uuid, signedMessage) {
    console.log(`Upgrading record ${uuid} to pseudonymous...`);

    const encryptedMessage = await this.encryptData(signedMessage);

    const tx = await this.contract.upgradeToPseudonymous(
      uuid,
      encryptedMessage
    );
    await tx.wait();

    console.log(`Successfully upgraded record ${uuid} to pseudonymous`);
  }

  async upgradeToIdentity(uuid, nameProof, ageProof, nationalityProof) {
    console.log(`Upgrading record ${uuid} to identity...`);

    const [encryptedName, encryptedNationality] =
      await this.encryptMultipleData([nameProof, nationalityProof]);

    const logState = (state) => console.log(`Age Encryption State: ${state}`);
    const [encryptedAge] = await cofhejs.encrypt(logState, [
      Encryptable.uint32(ageProof),
    ]);

    const tx = await this.contract.upgradeToIdentity(
      uuid,
      encryptedName,
      encryptedAge,
      encryptedNationality
    );
    await tx.wait();

    console.log(`Successfully upgraded record ${uuid} to identity`);
  }

  // ==================== UTILITY FUNCTIONS ====================

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

async function exampleUsage() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:42069"); // Local Fhenix node
  const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);

  // Initialize client
  const client = new AnonymityTiersClient("CONTRACT_ADDRESS", provider, wallet);
  await client.initialize();

  try {
    // Example 1: Create anonymous record
    console.log("\n=== Creating Anonymous Record ===");
    const anonymousUuid = await client.createAnonymousRecord(
      "12345", // World ID proof
      "67890", // Nullifier hash
      "54321" // Merkle root
    );

    // Retrieve and decrypt the data
    const anonymousData = await client.getAnonymousRecord(anonymousUuid);
    console.log("Decrypted anonymous data:", anonymousData);

    // Example 2: Upgrade to pseudonymous
    console.log("\n=== Upgrading to Pseudonymous ===");
    await client.upgradeToPseudonymous(anonymousUuid, "98765"); // Signed message

    const pseudonymousData = await client.getPseudonymousRecord(anonymousUuid);
    console.log("Decrypted pseudonymous data:", pseudonymousData);

    // Example 3: Upgrade to identity
    console.log("\n=== Upgrading to Identity ===");
    await client.upgradeToIdentity(
      anonymousUuid,
      "11111", // Name proof
      25, // Age proof
      "22222" // Nationality proof
    );

    const identityData = await client.getIdentityRecord(anonymousUuid);
    console.log("Decrypted identity data:", identityData);

    // Example 4: Create full identity record directly
    console.log("\n=== Creating Full Identity Record ===");
    const identityUuid = await client.createIdentityRecord(
      "99999", // World ID proof
      "88888", // Nullifier hash
      "77777", // Merkle root
      "66666", // Signed message
      "55555", // Name proof
      30, // Age proof
      "44444" // Nationality proof
    );

    const fullIdentityData = await client.getIdentityRecord(identityUuid);
    console.log("Full identity data:", fullIdentityData);

    // Get record info
    const recordInfo = await client.getRecordInfo(identityUuid);
    console.log("Record info:", recordInfo);
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { AnonymityTiersClient, exampleUsage };

// Uncomment to run example
// exampleUsage().catch(console.error);
