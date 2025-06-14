import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymityTiers } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AnonymityTiers Simple Tests", function () {
  let anonymityTiers: AnonymityTiers;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Mock data provided by the user
  const MOCK_WORLD_ID_DATA = {
    verification_level: "orb",
    credential_type: "orb",
    proof:
      "0x267a5cfae3dbbc9a5a7c23831465a84581721526d5aab7d6e22eeea0a19d63fe1a894041089a122bbc9bd543bea70a995093a20fd5b17e6e3ff9eee1546c4c64136af5ddf96417fea3c6d8eba8ee4029eb2b0ee272f081b0634674f0015f3e62218b6750853784b123b8acb34bbfd27e84ba8bf802852803391c3ab2bfa3d9ef01b1bec2ed7f5adc3aa6c96c9ce1347bfec55052c738f4e925738472a8f875ed2d78c000337a709efcd4aa36f230a5f8c153266a431445c5c088b97ead304edb1b78fd7a57c4eb514773f721922940dcb8f55e420015049e64ab2e38282c4990223d92c4d8ee95706ec9c25d8f60519a6b9fa68d550762553fcb752899bf561e",
    nullifier_hash:
      "0x255243621a57d769e48015daa5cb85c6861959274a0ef640f025e9e51c9306c3",
    merkle_root:
      "0x2817278308df723933d68faa965dc6377fde23a784318ce445aca400c590949",
  };

  const MOCK_SELF_DATA = {
    userId: "test_user_123",
    nullifier: "self_nullifier_456",
    credentialSubject: {
      name: "John Doe",
      nationality: "US",
      age: 25,
    },
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the contract
    const AnonymityTiersFactory = await ethers.getContractFactory(
      "AnonymityTiers"
    );
    anonymityTiers = await AnonymityTiersFactory.deploy();
    await anonymityTiers.waitForDeployment();
  });

  // Helper function to convert string to BigInt
  function stringToBigInt(str: string): bigint {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    return BigInt("0x" + hex.slice(0, 62)); // Limit to fit in uint256
  }

  // Helper function to convert hex string to BigInt
  function hexToBigInt(hexString: string): bigint {
    const cleanHex = hexString.startsWith("0x")
      ? hexString.slice(2)
      : hexString;
    return BigInt("0x" + cleanHex.slice(0, 62)); // Limit to fit in uint256
  }

  describe("Contract Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await anonymityTiers.getAddress()).to.be.properAddress;
      console.log(
        "✅ Contract deployed at:",
        await anonymityTiers.getAddress()
      );
    });

    it("Should initialize with correct starting values", async function () {
      expect(await anonymityTiers.getTotalRecords()).to.equal(0);
      console.log("✅ Initial total records: 0");
    });
  });

  describe("World ID Mock Data Tests", function () {
    it("Should process World ID verification data correctly", async function () {
      // Process your real World ID data
      const proofValue = hexToBigInt(MOCK_WORLD_ID_DATA.proof);
      const nullifierValue = hexToBigInt(MOCK_WORLD_ID_DATA.nullifier_hash);
      const merkleRootValue = hexToBigInt(MOCK_WORLD_ID_DATA.merkle_root);
      const verificationTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const credentialTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.credential_type
      );

      console.log("📊 World ID Data Processing:");
      console.log(
        "  - Verification Level:",
        MOCK_WORLD_ID_DATA.verification_level
      );
      console.log("  - Credential Type:", MOCK_WORLD_ID_DATA.credential_type);
      console.log(
        "  - Proof (truncated):",
        MOCK_WORLD_ID_DATA.proof.slice(0, 20) + "..."
      );
      console.log("  - Nullifier Hash:", MOCK_WORLD_ID_DATA.nullifier_hash);
      console.log("  - Merkle Root:", MOCK_WORLD_ID_DATA.merkle_root);

      // Verify we can convert the data to BigInt format
      expect(proofValue).to.be.a("bigint");
      expect(nullifierValue).to.be.a("bigint");
      expect(merkleRootValue).to.be.a("bigint");

      console.log(
        "✅ All World ID data successfully converted to contract format"
      );
    });

    it("Should create anonymous record with real World ID data", async function () {
      // Use your real mock data
      const proofValue = hexToBigInt(MOCK_WORLD_ID_DATA.proof);
      const nullifierValue = hexToBigInt(MOCK_WORLD_ID_DATA.nullifier_hash);
      const merkleRootValue = hexToBigInt(MOCK_WORLD_ID_DATA.merkle_root);
      const verificationTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const credentialTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.credential_type
      );

      // Create anonymous record
      const tx = await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          { data: proofValue, utype: 1 },
          { data: nullifierValue, utype: 1 },
          { data: merkleRootValue, utype: 1 },
          { data: verificationTypeValue, utype: 1 },
          { data: credentialTypeValue, utype: 1 }
        );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check that total records increased
      expect(await anonymityTiers.getTotalRecords()).to.equal(1);

      // Check record info
      const recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(0); // TierLevel.ANONYMOUS
      expect(recordInfo[1]).to.equal(user1.address);

      console.log("✅ Anonymous record created successfully with UUID: 1");
      console.log("  - Record owner:", user1.address);
      console.log("  - Tier level: ANONYMOUS (0)");
    });
  });

  describe("Self Verification Mock Data Tests", function () {
    it("Should process Self verification data correctly", async function () {
      // Process your real Self verification data
      const userIdValue = stringToBigInt(MOCK_SELF_DATA.userId);
      const nullifierValue = stringToBigInt(MOCK_SELF_DATA.nullifier);

      // Hash the identity data for privacy (as contract does)
      const nameHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_DATA.credentialSubject.name)
      );
      const nationalityHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_DATA.credentialSubject.nationality)
      );
      const nameHashValue = hexToBigInt(nameHash);
      const nationalityHashValue = hexToBigInt(nationalityHash);

      console.log("📊 Self Verification Data Processing:");
      console.log("  - User ID:", MOCK_SELF_DATA.userId);
      console.log("  - Nullifier:", MOCK_SELF_DATA.nullifier);
      console.log(
        "  - Name (original):",
        MOCK_SELF_DATA.credentialSubject.name
      );
      console.log("  - Name Hash:", nameHash);
      console.log(
        "  - Nationality (original):",
        MOCK_SELF_DATA.credentialSubject.nationality
      );
      console.log("  - Nationality Hash:", nationalityHash);
      console.log("  - Age:", MOCK_SELF_DATA.credentialSubject.age);

      // Verify conversions work
      expect(userIdValue).to.be.a("bigint");
      expect(nullifierValue).to.be.a("bigint");
      expect(nameHashValue).to.be.a("bigint");
      expect(nationalityHashValue).to.be.a("bigint");
      expect(MOCK_SELF_DATA.credentialSubject.age).to.equal(25);

      console.log("✅ All Self verification data successfully processed");
    });

    it("Should create complete identity record with all mock data", async function () {
      const signedMessage = "Address verification message";
      const signedMessageValue = stringToBigInt(signedMessage);

      // World ID data
      const proofValue = hexToBigInt(MOCK_WORLD_ID_DATA.proof);
      const nullifierValue = hexToBigInt(MOCK_WORLD_ID_DATA.nullifier_hash);
      const merkleRootValue = hexToBigInt(MOCK_WORLD_ID_DATA.merkle_root);
      const verificationTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const credentialTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.credential_type
      );

      // Self verification data
      const userIdValue = stringToBigInt(MOCK_SELF_DATA.userId);
      const selfNullifierValue = stringToBigInt(MOCK_SELF_DATA.nullifier);
      const nameHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_DATA.credentialSubject.name)
      );
      const nationalityHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_DATA.credentialSubject.nationality)
      );
      const nameHashValue = hexToBigInt(nameHash);
      const nationalityHashValue = hexToBigInt(nationalityHash);

      // Create identity record with all your mock data
      const tx = await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
          { data: proofValue, utype: 1 },
          { data: nullifierValue, utype: 1 },
          { data: merkleRootValue, utype: 1 },
          { data: verificationTypeValue, utype: 1 },
          { data: credentialTypeValue, utype: 1 },
          { data: signedMessageValue, utype: 1 },
          { data: userIdValue, utype: 1 },
          { data: selfNullifierValue, utype: 1 },
          { data: nameHashValue, utype: 1 },
          { data: nationalityHashValue, utype: 1 },
          { data: BigInt(MOCK_SELF_DATA.credentialSubject.age), utype: 2 }
        );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check record info
      const recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(2); // TierLevel.IDENTITY
      expect(recordInfo[1]).to.equal(user1.address);

      console.log("✅ Complete identity record created successfully!");
      console.log(
        "  - Contains World ID verification:",
        MOCK_WORLD_ID_DATA.verification_level
      );
      console.log("  - Contains address verification for:", user1.address);
      console.log(
        "  - Contains Self verification for user:",
        MOCK_SELF_DATA.userId
      );
      console.log("  - Identity data hashed for privacy");
      console.log("  - Age:", MOCK_SELF_DATA.credentialSubject.age);
    });
  });

  describe("Contract Integration Tests", function () {
    it("Should demonstrate complete anonymity tier progression", async function () {
      console.log(
        "🚀 Testing complete anonymity tier progression with your mock data..."
      );

      // Step 1: Anonymous tier with World ID
      const proofValue = hexToBigInt(MOCK_WORLD_ID_DATA.proof);
      const nullifierValue = hexToBigInt(MOCK_WORLD_ID_DATA.nullifier_hash);
      const merkleRootValue = hexToBigInt(MOCK_WORLD_ID_DATA.merkle_root);
      const verificationTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const credentialTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.credential_type
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          { data: proofValue, utype: 1 },
          { data: nullifierValue, utype: 1 },
          { data: merkleRootValue, utype: 1 },
          { data: verificationTypeValue, utype: 1 },
          { data: credentialTypeValue, utype: 1 }
        );

      let recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(0); // ANONYMOUS
      console.log("  ✅ Step 1: Anonymous tier created");

      // Step 2: Upgrade to Pseudonymous
      const signedMessage = "Address verification for upgrade";
      const signedMessageValue = stringToBigInt(signedMessage);

      await anonymityTiers
        .connect(user1)
        .upgradeToPseudonymous(1, { data: signedMessageValue, utype: 1 });

      recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(1); // PSEUDONYMOUS
      console.log("  ✅ Step 2: Upgraded to Pseudonymous tier");

      // Step 3: Upgrade to Identity
      const userIdValue = stringToBigInt(MOCK_SELF_DATA.userId);
      const selfNullifierValue = stringToBigInt(MOCK_SELF_DATA.nullifier);
      const nameHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_DATA.credentialSubject.name)
      );
      const nationalityHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_DATA.credentialSubject.nationality)
      );
      const nameHashValue = hexToBigInt(nameHash);
      const nationalityHashValue = hexToBigInt(nationalityHash);

      await anonymityTiers
        .connect(user1)
        .upgradeToIdentity(
          1,
          { data: userIdValue, utype: 1 },
          { data: selfNullifierValue, utype: 1 },
          { data: nameHashValue, utype: 1 },
          { data: nationalityHashValue, utype: 1 },
          { data: BigInt(MOCK_SELF_DATA.credentialSubject.age), utype: 2 }
        );

      recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(2); // IDENTITY
      console.log("  ✅ Step 3: Upgraded to Identity tier");

      console.log("🎉 Complete anonymity progression successful!");
      console.log("    ANONYMOUS → PSEUDONYMOUS → IDENTITY");
    });

    it("Should enforce access controls correctly", async function () {
      // Create record with user1
      const proofValue = hexToBigInt(MOCK_WORLD_ID_DATA.proof);
      const nullifierValue = hexToBigInt(MOCK_WORLD_ID_DATA.nullifier_hash);
      const merkleRootValue = hexToBigInt(MOCK_WORLD_ID_DATA.merkle_root);
      const verificationTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const credentialTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.credential_type
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          { data: proofValue, utype: 1 },
          { data: nullifierValue, utype: 1 },
          { data: merkleRootValue, utype: 1 },
          { data: verificationTypeValue, utype: 1 },
          { data: credentialTypeValue, utype: 1 }
        );

      // Try to access with user2 - should fail
      await expect(
        anonymityTiers.connect(user2).getAnonymousRecord(1)
      ).to.be.revertedWith("Unauthorized access");

      // Try to upgrade with user2 - should fail
      const signedMessageValue = stringToBigInt("unauthorized message");
      await expect(
        anonymityTiers
          .connect(user2)
          .upgradeToPseudonymous(1, { data: signedMessageValue, utype: 1 })
      ).to.be.revertedWith("Unauthorized");

      console.log(
        "✅ Access controls working correctly - unauthorized access blocked"
      );
    });

    it("Should track records correctly", async function () {
      // Initial state
      expect(await anonymityTiers.getTotalRecords()).to.equal(0);

      // Create multiple records with different users
      const proofValue = hexToBigInt(MOCK_WORLD_ID_DATA.proof);
      const nullifierValue = hexToBigInt(MOCK_WORLD_ID_DATA.nullifier_hash);
      const merkleRootValue = hexToBigInt(MOCK_WORLD_ID_DATA.merkle_root);
      const verificationTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const credentialTypeValue = stringToBigInt(
        MOCK_WORLD_ID_DATA.credential_type
      );

      // User1 creates record
      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          { data: proofValue, utype: 1 },
          { data: nullifierValue, utype: 1 },
          { data: merkleRootValue, utype: 1 },
          { data: verificationTypeValue, utype: 1 },
          { data: credentialTypeValue, utype: 1 }
        );

      expect(await anonymityTiers.getTotalRecords()).to.equal(1);

      // User2 creates record
      await anonymityTiers
        .connect(user2)
        .createAnonymousRecord(
          { data: proofValue, utype: 1 },
          { data: nullifierValue, utype: 1 },
          { data: merkleRootValue, utype: 1 },
          { data: verificationTypeValue, utype: 1 },
          { data: credentialTypeValue, utype: 1 }
        );

      expect(await anonymityTiers.getTotalRecords()).to.equal(2);

      // Check ownership
      const record1Info = await anonymityTiers.getRecordInfo(1);
      const record2Info = await anonymityTiers.getRecordInfo(2);

      expect(record1Info[1]).to.equal(user1.address);
      expect(record2Info[1]).to.equal(user2.address);

      console.log("✅ Record tracking working correctly");
      console.log("  - Total records: 2");
      console.log("  - Record 1 owner:", user1.address);
      console.log("  - Record 2 owner:", user2.address);
    });
  });
});
