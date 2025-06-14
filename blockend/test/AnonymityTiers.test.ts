import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymityTiers } from "../typechain-types";
import { Signer } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { cofhejs, Encryptable, FheTypes } from "cofhejs/node";

describe("AnonymityTiers - Direct Creation Functions", function () {
  async function deployAnonymityTiersFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const AnonymityTiersFactory = await ethers.getContractFactory(
      "AnonymityTiers"
    );
    const anonymityTiers = await AnonymityTiersFactory.deploy();
    await anonymityTiers.waitForDeployment();

    return { anonymityTiers, owner, user1, user2 };
  }

  // Test data representing different CID types
  const WORLD_PROOF_CID = 12345678901234567890n;
  const SIGNATURE_CID = 98765432109876543210n;
  const SELF_PROOF_CID = 11111111111111111111n;

  beforeEach(function () {
    if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
  });

  describe("Anonymous Tier (Tier 1) - Direct Creation", function () {
    it("Should create anonymous record with only world ID CID", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      // Initialize CoFHE with signer
      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Encrypt the world ID CID
      const [encryptedWorldCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(WORLD_PROOF_CID)] as const)
      );

      const tx = await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid);

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check that event was emitted
      expect(tx).to.emit(anonymityTiers, "AnonymousRecordCreated");

      // The first record should have UUID "anon-1"
      const uuid = "anon-1";
      const tier = await anonymityTiers.checkRecordTier(uuid);
      expect(tier).to.equal(1); // Anonymous tier
    });

    it("Should store and retrieve encrypted world ID CID", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      const [encryptedWorldCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(WORLD_PROOF_CID)] as const)
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid);

      // Query the record
      const uuid = "anon-1";
      const record = await anonymityTiers.getAnonymousRecord(uuid);

      expect(record.exists).to.be.true;
      expect(record.timestamp).to.be.greaterThan(0);

      // Verify encrypted CID can be decrypted
      const worldCidDecrypted = await cofhejs.unseal(
        record.worldProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(worldCidDecrypted, WORLD_PROOF_CID);
    });
  });

  describe("Pseudonymous Tier (Tier 2) - Direct Creation", function () {
    it("Should create pseudonymous record with world ID and signature CIDs", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Encrypt both required CIDs
      const [encryptedWorldCid, encryptedSignatureCid] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(SIGNATURE_CID),
          ] as const)
        );

      const tx = await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(encryptedWorldCid, encryptedSignatureCid);

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check event emission
      expect(tx).to.emit(anonymityTiers, "PseudonymousUpgrade");

      // Verify record tier
      const uuid = "anon-1";
      const tier = await anonymityTiers.checkRecordTier(uuid);
      expect(tier).to.equal(2); // Pseudonymous tier
    });

    it("Should store all encrypted data correctly", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      const [encryptedWorldCid, encryptedSignatureCid] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(SIGNATURE_CID),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(encryptedWorldCid, encryptedSignatureCid);

      const uuid = "anon-1";
      const record = await anonymityTiers.getPseudonymousRecord(uuid);

      expect(record.exists).to.be.true;
      expect(record.userAddress).to.equal(user1.address);
      expect(record.timestamp).to.be.greaterThan(0);

      // Verify both encrypted CIDs can be decrypted
      const worldCidDecrypted = await cofhejs.unseal(
        record.worldProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(worldCidDecrypted, WORLD_PROOF_CID);

      const signatureCidDecrypted = await cofhejs.unseal(
        record.signatureCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(signatureCidDecrypted, SIGNATURE_CID);
    });
  });

  describe("Identity Tier (Tier 3) - Direct Creation", function () {
    it("Should create identity record with all three CIDs", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Encrypt all three required CIDs
      const [encryptedWorldCid, encryptedSignatureCid, encryptedSelfCid] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(SIGNATURE_CID),
            Encryptable.uint256(SELF_PROOF_CID),
          ] as const)
        );

      const tx = await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
          encryptedWorldCid,
          encryptedSignatureCid,
          encryptedSelfCid
        );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check event emission
      expect(tx).to.emit(anonymityTiers, "IdentityUpgrade");

      // Verify record tier
      const uuid = "anon-1";
      const tier = await anonymityTiers.checkRecordTier(uuid);
      expect(tier).to.equal(3); // Identity tier
    });

    it("Should store and decrypt all three CIDs correctly", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      const [encryptedWorldCid, encryptedSignatureCid, encryptedSelfCid] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(SIGNATURE_CID),
            Encryptable.uint256(SELF_PROOF_CID),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
          encryptedWorldCid,
          encryptedSignatureCid,
          encryptedSelfCid
        );

      const uuid = "anon-1";
      const record = await anonymityTiers.getIdentityRecord(uuid);

      expect(record.exists).to.be.true;
      expect(record.userAddress).to.equal(user1.address);
      expect(record.timestamp).to.be.greaterThan(0);

      // Verify all three encrypted CIDs can be decrypted
      const worldCidDecrypted = await cofhejs.unseal(
        record.worldProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(worldCidDecrypted, WORLD_PROOF_CID);

      const signatureCidDecrypted = await cofhejs.unseal(
        record.signatureCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(signatureCidDecrypted, SIGNATURE_CID);

      const selfCidDecrypted = await cofhejs.unseal(
        record.selfProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(selfCidDecrypted, SELF_PROOF_CID);
    });
  });

  describe("Multiple Records and User Tracking", function () {
    it("Should track multiple records per user", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Create pseudonymous record (which tracks UUIDs)
      const [encryptedWorldCid1, encryptedSignatureCid1] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(SIGNATURE_CID),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(encryptedWorldCid1, encryptedSignatureCid1);

      // Create identity record
      const [encryptedWorldCid2, encryptedSignatureCid2, encryptedSelfCid2] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID + 1n),
            Encryptable.uint256(SIGNATURE_CID + 1n),
            Encryptable.uint256(SELF_PROOF_CID + 1n),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
          encryptedWorldCid2,
          encryptedSignatureCid2,
          encryptedSelfCid2
        );

      // Check user has both UUIDs tracked
      const userUUIDs = await anonymityTiers.getUserUUIDs(user1.address);
      expect(userUUIDs.length).to.equal(2);
      expect(userUUIDs[0]).to.equal("anon-1");
      expect(userUUIDs[1]).to.equal("anon-2");
    });

    it("Should handle different users independently", async function () {
      const { anonymityTiers, user1, user2 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      // Initialize for both users
      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      const [encryptedWorldCid1] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(WORLD_PROOF_CID)] as const)
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid1);

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user2)
      );

      const [encryptedWorldCid2, encryptedSignatureCid2] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID + 1n),
            Encryptable.uint256(SIGNATURE_CID + 1n),
          ] as const)
        );

      await anonymityTiers
        .connect(user2)
        .createPseudonymousRecord(encryptedWorldCid2, encryptedSignatureCid2);

      // Check both records exist with different tiers
      const tier1 = await anonymityTiers.checkRecordTier("anon-1");
      const tier2 = await anonymityTiers.checkRecordTier("anon-2");

      expect(tier1).to.equal(1); // Anonymous
      expect(tier2).to.equal(2); // Pseudonymous

      // Check user tracking
      const user1UUIDs = await anonymityTiers.getUserUUIDs(user1.address);
      const user2UUIDs = await anonymityTiers.getUserUUIDs(user2.address);

      expect(user1UUIDs.length).to.equal(0); // Anonymous doesn't track UUIDs
      expect(user2UUIDs.length).to.equal(1);
      expect(user2UUIDs[0]).to.equal("anon-2");
    });
  });

  describe("Gas Efficiency", function () {
    it("Should be gas efficient for all tier creations", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Test anonymous creation gas
      const [encryptedWorldCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(WORLD_PROOF_CID)] as const)
      );

      const tx1 = await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid);
      const receipt1 = await tx1.wait();
      expect(receipt1?.gasUsed).to.be.lessThan(1500000);

      // Test pseudonymous creation gas
      const [encryptedWorldCid2, encryptedSignatureCid] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(SIGNATURE_CID),
          ] as const)
        );

      const tx2 = await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(encryptedWorldCid2, encryptedSignatureCid);
      const receipt2 = await tx2.wait();
      expect(receipt2?.gasUsed).to.be.lessThan(2000000);

      // Test identity creation gas
      const [encryptedWorldCid3, encryptedSignatureCid3, encryptedSelfCid] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(SIGNATURE_CID),
            Encryptable.uint256(SELF_PROOF_CID),
          ] as const)
        );

      const tx3 = await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
          encryptedWorldCid3,
          encryptedSignatureCid3,
          encryptedSelfCid
        );
      const receipt3 = await tx3.wait();
      expect(receipt3?.gasUsed).to.be.lessThan(2500000);
    });
  });
});
