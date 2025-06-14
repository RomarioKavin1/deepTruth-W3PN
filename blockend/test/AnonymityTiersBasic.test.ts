import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymityTiersBasic } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AnonymityTiersBasic", function () {
  let anonymityTiers: AnonymityTiersBasic;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AnonymityTiersBasicFactory = await ethers.getContractFactory(
      "AnonymityTiersBasic"
    );
    anonymityTiers = await AnonymityTiersBasicFactory.deploy();
    await anonymityTiers.waitForDeployment();
  });

  describe("Anonymous Records", function () {
    it("Should create an anonymous record", async function () {
      const worldProofCid = "QmTestWorldIDProof123";

      const tx = await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(worldProofCid);
      const receipt = await tx.wait();

      // Check event was emitted
      expect(receipt?.logs).to.have.lengthOf(1);

      // Get the UUID from the transaction
      const uuid = "anon-1"; // First record should be anon-1

      // Verify record exists and has correct data
      const record = await anonymityTiers.getAnonymousRecord(uuid);
      expect(record[0]).to.equal(worldProofCid); // worldProofCid
      expect(record[2]).to.be.true; // exists
    });

    it("Should reject empty world proof CID", async function () {
      await expect(
        anonymityTiers.connect(user1).createAnonymousRecord("")
      ).to.be.revertedWith("World proof CID cannot be empty");
    });
  });

  describe("Pseudonymous Records", function () {
    it("Should create a pseudonymous record", async function () {
      const worldProofCid = "QmTestWorldIDProof123";
      const signatureCid = "QmTestSignature456";

      const tx = await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(worldProofCid, signatureCid);
      await tx.wait();

      const uuid = "anon-1"; // First record should be anon-1

      // Verify record exists and has correct data
      const record = await anonymityTiers.getPseudonymousRecord(uuid);
      expect(record[0]).to.equal(worldProofCid); // worldProofCid
      expect(record[1]).to.equal(signatureCid); // signatureCid
      expect(record[2]).to.equal(user1.address); // userAddress
      expect(record[4]).to.be.true; // exists
    });

    it("Should track user UUIDs", async function () {
      const worldProofCid = "QmTestWorldIDProof123";
      const signatureCid = "QmTestSignature456";

      await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(worldProofCid, signatureCid);

      const userUUIDs = await anonymityTiers.getUserUUIDs(user1.address);
      expect(userUUIDs).to.have.lengthOf(1);
      expect(userUUIDs[0]).to.equal("anon-1");
    });

    it("Should reject empty CIDs", async function () {
      await expect(
        anonymityTiers
          .connect(user1)
          .createPseudonymousRecord("", "QmTestSignature456")
      ).to.be.revertedWith("World proof CID cannot be empty");

      await expect(
        anonymityTiers
          .connect(user1)
          .createPseudonymousRecord("QmTestWorldIDProof123", "")
      ).to.be.revertedWith("Signature CID cannot be empty");
    });
  });

  describe("Identity Records", function () {
    it("Should create an identity record", async function () {
      const worldProofCid = "QmTestWorldIDProof123";
      const signatureCid = "QmTestSignature456";
      const selfProofCid = "QmTestSelfProof789";

      const tx = await anonymityTiers
        .connect(user1)
        .createIdentityRecord(worldProofCid, signatureCid, selfProofCid);
      await tx.wait();

      const uuid = "anon-1"; // First record should be anon-1

      // Verify record exists and has correct data
      const record = await anonymityTiers.getIdentityRecord(uuid);
      expect(record[0]).to.equal(worldProofCid); // worldProofCid
      expect(record[1]).to.equal(signatureCid); // signatureCid
      expect(record[2]).to.equal(selfProofCid); // selfProofCid
      expect(record[3]).to.equal(user1.address); // userAddress
      expect(record[5]).to.be.true; // exists
    });

    it("Should reject empty CIDs", async function () {
      await expect(
        anonymityTiers
          .connect(user1)
          .createIdentityRecord("", "QmTestSignature456", "QmTestSelfProof789")
      ).to.be.revertedWith("World proof CID cannot be empty");

      await expect(
        anonymityTiers
          .connect(user1)
          .createIdentityRecord(
            "QmTestWorldIDProof123",
            "",
            "QmTestSelfProof789"
          )
      ).to.be.revertedWith("Signature CID cannot be empty");

      await expect(
        anonymityTiers
          .connect(user1)
          .createIdentityRecord(
            "QmTestWorldIDProof123",
            "QmTestSignature456",
            ""
          )
      ).to.be.revertedWith("Self proof CID cannot be empty");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      // Create one record of each type
      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord("QmTestWorldIDProof123");
      await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(
          "QmTestWorldIDProof456",
          "QmTestSignature456"
        );
      await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
          "QmTestWorldIDProof789",
          "QmTestSignature789",
          "QmTestSelfProof789"
        );
    });

    it("Should check record tier correctly", async function () {
      expect(await anonymityTiers.checkRecordTier("anon-1")).to.equal(1); // Anonymous
      expect(await anonymityTiers.checkRecordTier("anon-2")).to.equal(2); // Pseudonymous
      expect(await anonymityTiers.checkRecordTier("anon-3")).to.equal(3); // Identity
      expect(await anonymityTiers.checkRecordTier("anon-999")).to.equal(0); // Doesn't exist
    });

    it("Should get record counts correctly", async function () {
      const counts = await anonymityTiers.getRecordCounts();
      expect(counts[0]).to.equal(1); // anonymousCount
      expect(counts[1]).to.equal(1); // pseudonymousCount
      expect(counts[2]).to.equal(1); // identityCount
    });

    it("Should get all anonymous UUIDs", async function () {
      const uuids = await anonymityTiers.getAllAnonymousUUIDs();
      expect(uuids).to.have.lengthOf(1);
      expect(uuids[0]).to.equal("anon-1");
    });
  });

  describe("Update Functions", function () {
    beforeEach(async function () {
      await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(
          "QmTestWorldIDProof456",
          "QmTestSignature456"
        );
      await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
          "QmTestWorldIDProof789",
          "QmTestSignature789",
          "QmTestSelfProof789"
        );
    });

    it("Should update pseudonymous record", async function () {
      const newSignatureCid = "QmNewSignature456";

      await anonymityTiers
        .connect(user1)
        .updatePseudonymousRecord("anon-1", newSignatureCid);

      const record = await anonymityTiers.getPseudonymousRecord("anon-1");
      expect(record[1]).to.equal(newSignatureCid);
    });

    it("Should update identity record", async function () {
      const newSignatureCid = "QmNewSignature789";
      const newSelfProofCid = "QmNewSelfProof789";

      await anonymityTiers
        .connect(user1)
        .updateIdentityRecord("anon-2", newSignatureCid, newSelfProofCid);

      const record = await anonymityTiers.getIdentityRecord("anon-2");
      expect(record[1]).to.equal(newSignatureCid);
      expect(record[2]).to.equal(newSelfProofCid);
    });

    it("Should reject updates from non-owners", async function () {
      await expect(
        anonymityTiers
          .connect(user2)
          .updatePseudonymousRecord("anon-1", "QmNewSignature456")
      ).to.be.revertedWith("Not record owner");

      await expect(
        anonymityTiers
          .connect(user2)
          .updateIdentityRecord(
            "anon-2",
            "QmNewSignature789",
            "QmNewSelfProof789"
          )
      ).to.be.revertedWith("Not record owner");
    });
  });
});
