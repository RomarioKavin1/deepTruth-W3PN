import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymityTiers } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { cofhejs, Encryptable, FheTypes } from "cofhejs/node";
import hre from "hardhat";

describe("AnonymityTiers", function () {
  let anonymityTiers: AnonymityTiers;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Mock data from the user
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
    proof: {
      a: [
        "4428384447397966169678728430798971659390456453399802415980786349945412322255",
        "20769854990110155843110442400292401874258517133662969454558666355441491297566",
      ],
      b: [
        [
          "20838943270048203144482089889536473941341754967351440110628614400909516431187",
          "3448515373215206368729351159405797225610668252427196326714203319356882531012",
        ],
        [
          "9022494007634224809492704397323809862672106920943047196392299889270308365386",
          "16810227901311130279202700796901059016626796118265983840165753046353888521321",
        ],
      ],
      c: [
        "12500413780072368784332407654453968909862080476830769568350238181445446712514",
        "5205797015970416553245759181152084896053364292788674394973551863210588720565",
      ],
      protocol: "groth16",
      curve: "",
    },
    publicSignals: [
      "0",
      "0",
      "5917645764266387229099807922771871753544163856784761583567435202560",
      "0",
      "0",
      "0",
      "0",
      "11794454578101037995167214973125272232034182560311491884874539703101243012876",
      "1",
      "10814722823002651048642806287598455419587834556190100280513885521810362284318",
      "2",
      "5",
      "0",
      "6",
      "1",
      "4",
      "17359956125106148146828355805271472653597249114301196742546733402427978706344",
      "7420120618403967585712321281997181302561301414016003514649937965499789236588",
      "16836358042995742879630198413873414945978677264752036026400967422611478610995",
      "20870873843757527878887248187119483604000609137016473857889233767622733481592",
      "335328444571728387113693930617468615327",
    ],
  };

  // Derived Self verification data (as would come from API)
  const MOCK_SELF_VERIFICATION = {
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

    // Initialize CoFHE for testing
    await hre.cofhe.expectResultSuccess(
      hre.cofhe.initializeWithHardhatSigner(user1)
    );
  });

  // Helper function to encrypt string data
  async function encryptString(value: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    const bigIntValue = BigInt("0x" + hex);

    const [encrypted] = await hre.cofhe.expectResultSuccess(
      cofhejs.encrypt([Encryptable.uint256(bigIntValue)] as const)
    );
    return encrypted;
  }

  // Helper function to encrypt hex string data
  async function encryptHexString(hexString: string) {
    const cleanHex = hexString.startsWith("0x")
      ? hexString.slice(2)
      : hexString;
    const bigIntValue = BigInt("0x" + cleanHex);

    const [encrypted] = await hre.cofhe.expectResultSuccess(
      cofhejs.encrypt([Encryptable.uint256(bigIntValue)] as const)
    );
    return encrypted;
  }

  // Helper function to encrypt age
  async function encryptAge(age: number) {
    const [encrypted] = await hre.cofhe.expectResultSuccess(
      cofhejs.encrypt([Encryptable.uint32(age)] as const)
    );
    return encrypted;
  }

  describe("Contract Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await anonymityTiers.getAddress()).to.be.properAddress;
    });

    it("Should initialize with correct starting values", async function () {
      expect(await anonymityTiers.getTotalRecords()).to.equal(0);
    });
  });

  describe("Anonymous Tier", function () {
    it("Should create anonymous record with World ID data", async function () {
      // Encrypt the World ID data
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );

      // Create anonymous record
      const tx = await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType
        );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check that total records increased
      expect(await anonymityTiers.getTotalRecords()).to.equal(1);

      // Check record info
      const recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(0); // TierLevel.ANONYMOUS
      expect(recordInfo[1]).to.equal(user1.address);
    });

    it("Should retrieve and decrypt anonymous record data", async function () {
      // First create a record
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType
        );

      // Retrieve the record
      const recordData = await anonymityTiers
        .connect(user1)
        .getAnonymousRecord(1);
      expect(recordData).to.have.lengthOf(8);

      // Verify the encrypted data can be unsealed
      const unsealedProof = await cofhejs.unseal(
        recordData[0],
        FheTypes.Uint256
      );
      const unsealedNullifier = await cofhejs.unseal(
        recordData[1],
        FheTypes.Uint256
      );
      const unsealedMerkleRoot = await cofhejs.unseal(
        recordData[2],
        FheTypes.Uint256
      );
      const unsealedIsValid = await cofhejs.unseal(
        recordData[5],
        FheTypes.Bool
      );
      const unsealedIsActive = await cofhejs.unseal(
        recordData[6],
        FheTypes.Bool
      );

      await hre.cofhe.expectResultValue(
        unsealedProof,
        BigInt(MOCK_WORLD_ID_DATA.proof)
      );
      await hre.cofhe.expectResultValue(
        unsealedNullifier,
        BigInt(MOCK_WORLD_ID_DATA.nullifier_hash)
      );
      await hre.cofhe.expectResultValue(
        unsealedMerkleRoot,
        BigInt(MOCK_WORLD_ID_DATA.merkle_root)
      );
      await hre.cofhe.expectResultValue(unsealedIsValid, true);
      await hre.cofhe.expectResultValue(unsealedIsActive, true);
    });

    it("Should only allow owner to retrieve their records", async function () {
      // Create record with user1
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType
        );

      // Try to access with user2 - should fail
      await expect(
        anonymityTiers.connect(user2).getAnonymousRecord(1)
      ).to.be.revertedWith("Unauthorized access");
    });
  });

  describe("Pseudonymous Tier", function () {
    it("Should create pseudonymous record with address verification", async function () {
      const signedMessage = "Address verification message";

      // Encrypt all data
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );
      const encryptedSignedMessage = await encryptString(signedMessage);

      const tx = await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType,
          encryptedSignedMessage
        );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check record info
      const recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(1); // TierLevel.PSEUDONYMOUS
      expect(recordInfo[1]).to.equal(user1.address);
    });

    it("Should retrieve pseudonymous record with public address", async function () {
      const signedMessage = "Address verification message";

      // Create record
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );
      const encryptedSignedMessage = await encryptString(signedMessage);

      await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType,
          encryptedSignedMessage
        );

      // Retrieve the record
      const recordData = await anonymityTiers
        .connect(user1)
        .getPseudonymousRecord(1);
      expect(recordData).to.have.lengthOf(11);

      // Check that userAddress is public and correct
      expect(recordData[6]).to.equal(user1.address);

      // Verify encrypted data
      const unsealedAddressVerified = await cofhejs.unseal(
        recordData[8],
        FheTypes.Bool
      );
      await hre.cofhe.expectResultValue(unsealedAddressVerified, true);
    });
  });

  describe("Identity Tier", function () {
    it("Should create identity record with Self verification", async function () {
      const signedMessage = "Address verification message";

      // Prepare Self verification data
      const nameHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_VERIFICATION.credentialSubject.name)
      );
      const nationalityHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_VERIFICATION.credentialSubject.nationality)
      );

      // Encrypt all data
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );
      const encryptedSignedMessage = await encryptString(signedMessage);
      const encryptedSelfUserId = await encryptString(
        MOCK_SELF_VERIFICATION.userId
      );
      const encryptedSelfNullifier = await encryptString(
        MOCK_SELF_VERIFICATION.nullifier
      );
      const encryptedNameHash = await encryptHexString(nameHash);
      const encryptedNationalityHash = await encryptHexString(nationalityHash);
      const encryptedAge = await encryptAge(
        MOCK_SELF_VERIFICATION.credentialSubject.age
      );

      const tx = await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
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
      expect(receipt).to.not.be.null;

      // Check record info
      const recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(2); // TierLevel.IDENTITY
      expect(recordInfo[1]).to.equal(user1.address);
    });

    it("Should retrieve complete identity record", async function () {
      const signedMessage = "Address verification message";
      const nameHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_VERIFICATION.credentialSubject.name)
      );
      const nationalityHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_VERIFICATION.credentialSubject.nationality)
      );

      // Create identity record
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );
      const encryptedSignedMessage = await encryptString(signedMessage);
      const encryptedSelfUserId = await encryptString(
        MOCK_SELF_VERIFICATION.userId
      );
      const encryptedSelfNullifier = await encryptString(
        MOCK_SELF_VERIFICATION.nullifier
      );
      const encryptedNameHash = await encryptHexString(nameHash);
      const encryptedNationalityHash = await encryptHexString(nationalityHash);
      const encryptedAge = await encryptAge(
        MOCK_SELF_VERIFICATION.credentialSubject.age
      );

      await anonymityTiers
        .connect(user1)
        .createIdentityRecord(
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

      // Retrieve the record
      const recordData = await anonymityTiers
        .connect(user1)
        .getIdentityRecord(1);
      expect(recordData).to.have.lengthOf(17);

      // Check public address
      expect(recordData[6]).to.equal(user1.address);

      // Verify encrypted age
      const unsealedAge = await cofhejs.unseal(recordData[13], FheTypes.Uint32);
      await hre.cofhe.expectResultValue(
        unsealedAge,
        BigInt(MOCK_SELF_VERIFICATION.credentialSubject.age)
      );

      // Verify verification flags
      const unsealedSelfValid = await cofhejs.unseal(
        recordData[14],
        FheTypes.Bool
      );
      const unsealedIdentityVerified = await cofhejs.unseal(
        recordData[15],
        FheTypes.Bool
      );
      await hre.cofhe.expectResultValue(unsealedSelfValid, true);
      await hre.cofhe.expectResultValue(unsealedIdentityVerified, true);
    });
  });

  describe("Upgrade Functions", function () {
    it("Should upgrade from anonymous to pseudonymous", async function () {
      // First create anonymous record
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType
        );

      // Verify it's anonymous
      let recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(0); // TierLevel.ANONYMOUS

      // Upgrade to pseudonymous
      const signedMessage = "Address verification message";
      const encryptedSignedMessage = await encryptString(signedMessage);

      await anonymityTiers
        .connect(user1)
        .upgradeToPseudonymous(1, encryptedSignedMessage);

      // Verify it's now pseudonymous
      recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(1); // TierLevel.PSEUDONYMOUS
    });

    it("Should upgrade from pseudonymous to identity", async function () {
      const signedMessage = "Address verification message";

      // Create pseudonymous record
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );
      const encryptedSignedMessage = await encryptString(signedMessage);

      await anonymityTiers
        .connect(user1)
        .createPseudonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType,
          encryptedSignedMessage
        );

      // Upgrade to identity
      const nameHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_VERIFICATION.credentialSubject.name)
      );
      const nationalityHash = ethers.keccak256(
        ethers.toUtf8Bytes(MOCK_SELF_VERIFICATION.credentialSubject.nationality)
      );

      const encryptedSelfUserId = await encryptString(
        MOCK_SELF_VERIFICATION.userId
      );
      const encryptedSelfNullifier = await encryptString(
        MOCK_SELF_VERIFICATION.nullifier
      );
      const encryptedNameHash = await encryptHexString(nameHash);
      const encryptedNationalityHash = await encryptHexString(nationalityHash);
      const encryptedAge = await encryptAge(
        MOCK_SELF_VERIFICATION.credentialSubject.age
      );

      await anonymityTiers
        .connect(user1)
        .upgradeToIdentity(
          1,
          encryptedSelfUserId,
          encryptedSelfNullifier,
          encryptedNameHash,
          encryptedNationalityHash,
          encryptedAge
        );

      // Verify it's now identity
      const recordInfo = await anonymityTiers.getRecordInfo(1);
      expect(recordInfo[0]).to.equal(2); // TierLevel.IDENTITY
    });

    it("Should not allow unauthorized upgrades", async function () {
      // Create record with user1
      const encryptedProof = await encryptHexString(MOCK_WORLD_ID_DATA.proof);
      const encryptedNullifier = await encryptHexString(
        MOCK_WORLD_ID_DATA.nullifier_hash
      );
      const encryptedMerkleRoot = await encryptHexString(
        MOCK_WORLD_ID_DATA.merkle_root
      );
      const encryptedVerificationType = await encryptString(
        MOCK_WORLD_ID_DATA.verification_level
      );
      const encryptedCredentialType = await encryptString(
        MOCK_WORLD_ID_DATA.credential_type
      );

      await anonymityTiers
        .connect(user1)
        .createAnonymousRecord(
          encryptedProof,
          encryptedNullifier,
          encryptedMerkleRoot,
          encryptedVerificationType,
          encryptedCredentialType
        );

      // Try to upgrade with user2 - should fail
      const encryptedSignedMessage = await encryptString("message");
      await expect(
        anonymityTiers
          .connect(user2)
          .upgradeToPseudonymous(1, encryptedSignedMessage)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("Error Handling", function () {
    it("Should revert when accessing non-existent records", async function () {
      await expect(
        anonymityTiers.connect(user1).getAnonymousRecord(999)
      ).to.be.revertedWith("Record is not anonymous tier");
    });

    it("Should revert when upgrading wrong tier types", async function () {
      // Try to upgrade non-existent record to identity
      const encryptedData = await encryptString("test");
      await expect(
        anonymityTiers
          .connect(user1)
          .upgradeToIdentity(
            1,
            encryptedData,
            encryptedData,
            encryptedData,
            encryptedData,
            encryptedData
          )
      ).to.be.revertedWith("Can only upgrade from pseudonymous");
    });
  });
});
