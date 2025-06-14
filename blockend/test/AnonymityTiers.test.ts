import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymityTiers } from "../typechain-types";
import { Signer } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { cofhejs, Encryptable, FheTypes } from "cofhejs/node";

describe("AnonymityTiers - FHE Implementation", function () {
  async function deployAnonymityTiersFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const AnonymityTiersFactory = await ethers.getContractFactory(
      "AnonymityTiers"
    );
    const anonymityTiers = await AnonymityTiersFactory.deploy();
    await anonymityTiers.waitForDeployment();

    return { anonymityTiers, owner, user1, user2 };
  }

  // Test IPFS CIDs as big integers (representing CID hashes)
  const WORLD_PROOF_CID = 12345678901234567890n;
  const SIGNATURE_CID = 98765432109876543210n;
  const SELF_PROOF_CID = 11111111111111111111n;
  const NULLIFIER_HASH = 99999999999999999999n;

  beforeEach(function () {
    if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
  });

  describe("Anonymous Tier (Tier 1) - FHE Storage", function () {
    it("Should create anonymous record with encrypted IPFS CID", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      // Initialize CoFHE with signer
      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Encrypt the inputs properly using cofhejs
      const [encryptedWorldCid, encryptedNullifier] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      const tx = await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid, encryptedNullifier);

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // The first record should have UUID "anon-1" based on contract logic
      const uuid = "anon-1";

      // Verify record exists and tier is correct
      const tier = await anonymityTiers.checkRecordTier(uuid);
      expect(tier).to.equal(1); // Anonymous tier
    });

    it("Should store encrypted data that can be queried", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      const [encryptedWorldCid, encryptedNullifier] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid, encryptedNullifier);

      // Query the record - first record gets UUID "anon-1"
      const uuid = "anon-1";
      const record = await anonymityTiers.getAnonymousRecord(uuid);

      expect(record.exists).to.be.true;
      expect(record.timestamp).to.be.greaterThan(0);

      // Verify encrypted CIDs are stored and can be decrypted
      const worldCidDecrypted = await cofhejs.unseal(
        record.worldProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(worldCidDecrypted, WORLD_PROOF_CID);

      const nullifierDecrypted = await cofhejs.unseal(
        record.nullifierHash,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(nullifierDecrypted, NULLIFIER_HASH);
    });

    it("Should allow multiple records with different nullifiers", async function () {
      const { anonymityTiers, user1, user2 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // First record
      const [encryptedWorldCid1, encryptedNullifier1] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid1, encryptedNullifier1);

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user2)
      );

      // Second record with different nullifier
      const [encryptedWorldCid2, encryptedNullifier2] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID + 1n),
            Encryptable.uint256(NULLIFIER_HASH + 1n), // Different nullifier
          ] as const)
        );

      await anonymityTiers
        .connect(user2)
        .createAnonymousRecord(encryptedWorldCid2, encryptedNullifier2);

      // Both records should exist
      const tier1 = await anonymityTiers.checkRecordTier("anon-1");
      const tier2 = await anonymityTiers.checkRecordTier("anon-2");
      expect(tier1).to.equal(1);
      expect(tier2).to.equal(1);
    });
  });

  describe("Pseudonymous Tier (Tier 2) - FHE Upgrade", function () {
    it("Should upgrade to pseudonymous with encrypted signature CID", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Create anonymous record first
      const [encryptedWorldCid, encryptedNullifier] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid, encryptedNullifier);

      const uuid = "anon-1"; // First record

      // Encrypt signature CID
      const [encryptedSignatureCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(SIGNATURE_CID)] as const)
      );

      await expect(
        anonymityTiers
          .connect(user1)
          .upgradeToPseudonymous(uuid, encryptedSignatureCid)
      ).to.emit(anonymityTiers, "PseudonymousUpgrade");

      // Check record tier
      const tier = await anonymityTiers.checkRecordTier(uuid);
      expect(tier).to.equal(2); // Pseudonymous tier

      // Verify encrypted signature CID is stored
      const record = await anonymityTiers.getPseudonymousRecord(uuid);
      const signatureCidDecrypted = await cofhejs.unseal(
        record.signatureCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(signatureCidDecrypted, SIGNATURE_CID);
    });
  });

  describe("Identity Tier (Tier 3) - FHE Full Stack", function () {
    it("Should upgrade to identity with encrypted self-proof CID", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Create anonymous record and upgrade to pseudonymous
      const [encryptedWorldCid, encryptedNullifier] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid, encryptedNullifier);

      const uuid = "anon-1"; // First record

      // Upgrade to pseudonymous
      const [encryptedSignatureCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(SIGNATURE_CID)] as const)
      );
      await anonymityTiers
        .connect(user1)
        .upgradeToPseudonymous(uuid, encryptedSignatureCid);

      // Upgrade to identity
      const [encryptedSelfProofCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(SELF_PROOF_CID)] as const)
      );

      await expect(
        anonymityTiers
          .connect(user1)
          .upgradeToIdentity(uuid, encryptedSelfProofCid)
      ).to.emit(anonymityTiers, "IdentityUpgrade");

      // Check record tier
      const tier = await anonymityTiers.checkRecordTier(uuid);
      expect(tier).to.equal(3); // Identity tier

      // Verify all three encrypted CIDs are stored correctly
      const record = await anonymityTiers.getIdentityRecord(uuid);

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

      const selfProofCidDecrypted = await cofhejs.unseal(
        record.selfProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(selfProofCidDecrypted, SELF_PROOF_CID);
    });
  });

  describe("IPFS CID Integration", function () {
    it("Should store and retrieve different IPFS CIDs correctly", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Test with different CID values to simulate real IPFS hashes
      const testCids = [
        12345678901234567890n, // World ID proof
        98765432109876543210n, // Signature
        55555555555555555555n, // Self proof
      ];

      const [encryptedWorldCid, encryptedNullifier] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(testCids[0]),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      // Create anonymous record
      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid, encryptedNullifier);

      const uuid = "anon-1"; // First record

      // Upgrade with different CIDs
      const [encryptedSignatureCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(testCids[1])] as const)
      );
      await anonymityTiers
        .connect(user1)
        .upgradeToPseudonymous(uuid, encryptedSignatureCid);

      const [encryptedSelfProofCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(testCids[2])] as const)
      );
      await anonymityTiers
        .connect(user1)
        .upgradeToIdentity(uuid, encryptedSelfProofCid);

      // Verify all CIDs are stored correctly and can be decrypted
      const record = await anonymityTiers.getIdentityRecord(uuid);

      const worldCidDecrypted = await cofhejs.unseal(
        record.worldProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(worldCidDecrypted, testCids[0]);

      const signatureCidDecrypted = await cofhejs.unseal(
        record.signatureCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(signatureCidDecrypted, testCids[1]);

      const selfProofCidDecrypted = await cofhejs.unseal(
        record.selfProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(selfProofCidDecrypted, testCids[2]);
    });
  });

  describe("FHE Contract Functionality", function () {
    it("Should properly encrypt and store IPFS CIDs", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      // Test different CID values
      const worldCid = 123456789n;
      const signatureCid = 987654321n;
      const selfCid = 555666777n;

      const [encryptedWorldCid, encryptedNullifier] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(worldCid),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      // Create and upgrade through all tiers
      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid, encryptedNullifier);

      const [encryptedSignatureCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(signatureCid)] as const)
      );
      await anonymityTiers
        .connect(user1)
        .upgradeToPseudonymous("anon-1", encryptedSignatureCid);

      const [encryptedSelfCid] = await hre.cofhe.expectResultSuccess(
        cofhejs.encrypt([Encryptable.uint256(selfCid)] as const)
      );
      await anonymityTiers
        .connect(user1)
        .upgradeToIdentity("anon-1", encryptedSelfCid);

      // Verify final record has all encrypted CIDs
      const record = await anonymityTiers.getIdentityRecord("anon-1");

      const worldDecrypted = await cofhejs.unseal(
        record.worldProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(worldDecrypted, worldCid);

      const signatureDecrypted = await cofhejs.unseal(
        record.signatureCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(signatureDecrypted, signatureCid);

      const selfDecrypted = await cofhejs.unseal(
        record.selfProofCid,
        FheTypes.Uint256
      );
      await hre.cofhe.expectResultValue(selfDecrypted, selfCid);
    });

    it("Should be gas efficient for encrypted storage", async function () {
      const { anonymityTiers, user1 } = await loadFixture(
        deployAnonymityTiersFixture
      );

      await hre.cofhe.expectResultSuccess(
        hre.cofhe.initializeWithHardhatSigner(user1)
      );

      const [encryptedWorldCid, encryptedNullifier] =
        await hre.cofhe.expectResultSuccess(
          cofhejs.encrypt([
            Encryptable.uint256(WORLD_PROOF_CID),
            Encryptable.uint256(NULLIFIER_HASH),
          ] as const)
        );

      const tx = await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(encryptedWorldCid, encryptedNullifier);

      const receipt = await tx.wait();

      // Gas should be reasonable for FHE operations (mocking adds overhead)
      expect(receipt?.gasUsed).to.be.lessThan(2000000); // Reasonable for FHE with mocks
    });
  });
});
