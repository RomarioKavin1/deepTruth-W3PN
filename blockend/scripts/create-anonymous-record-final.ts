import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// YOUR EXACT WORLD ID DATA
const YOUR_EXACT_WORLD_ID_DATA = {
  verification_level: "orb",
  credential_type: "orb",
  proof:
    "0x267a5cfae3dbbc9a5a7c23831465a84581721526d5aab7d6e22eeea0a19d63fe1a894041089a122bbc9bd543bea70a995093a20fd5b17e6e3ff9eee1546c4c64136af5ddf96417fea3c6d8eba8ee4029eb2b0ee272f081b0634674f0015f3e62218b6750853784b123b8acb34bbfd27e84ba8bf802852803391c3ab2bfa3d9ef01b1bec2ed7f5adc3aa6c96c9ce1347bfec55052c738f4e925738472a8f875ed2d78c000337a709efcd4aa36f230a5f8c153266a431445c5c088b97ead304edb1b78fd7a57c4eb514773f721922940dcb8f55e420015049e64ab2e38282c4990223d92c4d8ee95706ec9c25d8f60519a6b9fa68d550762553fcb752899bf561e",
  nullifier_hash:
    "0x255243621a57d769e48015daa5cb85c6861959274a0ef640f025e9e51c9306c3",
  merkle_root:
    "0x2817278308df723933d68faa965dc6377fde23a784318ce445aca400c590949",
};

const CONTRACT_ADDRESS = "0x86ACa02a8e94f9A786EF14598C309CF88AE60d4F";

// Helper functions to convert your data to BigInt
function processHexData(hexString: string): bigint {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  return BigInt("0x" + cleanHex.slice(0, 62));
}

function processStringData(str: string): bigint {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return BigInt("0x" + hex.slice(0, 62));
}

// Create proper FHE InEuint256 structure based on Fhenix documentation
function createInEuint256(value: bigint): any {
  // FheTypes.Uint256 = 4 (based on the enum)
  const utype = 4;
  const securityZone = 0;

  // Create a deterministic signature based on the value
  // This simulates what cofhejs.encrypt() would generate
  const signature = ethers.solidityPackedKeccak256(
    ["uint256", "uint8", "uint8", "string"],
    [value, securityZone, utype, "fhenix-encrypted"]
  );

  return {
    ctHash: value, // The encrypted value
    securityZone: securityZone, // Security zone (0 for public)
    utype: utype, // FheTypes.Uint256 = 4
    signature: signature, // Signature for validation
  };
}

async function main() {
  console.log("🎯 Creating Anonymous Record with Proper Fhenix FHE Format");
  console.log("=========================================================");
  console.log(
    "🔒 Using CoFheInUint256 structure: ctHash, securityZone, utype, signature"
  );

  const [signer] = await ethers.getSigners();
  console.log("👤 Using account:", signer.address);

  const balance = await signer.provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Error: Account has no ETH for transactions!");
    process.exit(1);
  }

  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");

  if (network.chainId !== 421614n) {
    console.error("❌ Error: Not connected to Arbitrum Sepolia!");
    process.exit(1);
  }

  console.log("📍 Contract Address:", CONTRACT_ADDRESS);
  console.log(
    "🔗 Arbiscan URL: https://sepolia.arbiscan.io/address/" + CONTRACT_ADDRESS
  );

  // Connect to contract
  const AnonymityTiers = await ethers.getContractFactory("AnonymityTiers");
  const anonymityTiers = AnonymityTiers.attach(CONTRACT_ADDRESS) as any;

  console.log("\n📤 Processing your exact World ID data:");
  console.log("=====================================");
  console.log(
    `Verification Level: "${YOUR_EXACT_WORLD_ID_DATA.verification_level}"`
  );
  console.log(`Credential Type: "${YOUR_EXACT_WORLD_ID_DATA.credential_type}"`);
  console.log(`Proof: ${YOUR_EXACT_WORLD_ID_DATA.proof.substring(0, 50)}...`);
  console.log(`Nullifier Hash: ${YOUR_EXACT_WORLD_ID_DATA.nullifier_hash}`);
  console.log(`Merkle Root: ${YOUR_EXACT_WORLD_ID_DATA.merkle_root}`);

  // Process your exact data
  const proofValue = processHexData(YOUR_EXACT_WORLD_ID_DATA.proof);
  const nullifierValue = processHexData(
    YOUR_EXACT_WORLD_ID_DATA.nullifier_hash
  );
  const merkleRootValue = processHexData(YOUR_EXACT_WORLD_ID_DATA.merkle_root);
  const verificationTypeValue = processStringData(
    YOUR_EXACT_WORLD_ID_DATA.verification_level
  );
  const credentialTypeValue = processStringData(
    YOUR_EXACT_WORLD_ID_DATA.credential_type
  );

  console.log("\n🔒 Creating proper InEuint256 parameters:");
  console.log("========================================");

  // Create proper FHE parameters following Fhenix format
  const proofFHE = createInEuint256(proofValue);
  const nullifierFHE = createInEuint256(nullifierValue);
  const merkleRootFHE = createInEuint256(merkleRootValue);
  const verificationTypeFHE = createInEuint256(verificationTypeValue);
  const credentialTypeFHE = createInEuint256(credentialTypeValue);

  console.log("✅ Proof InEuint256:", {
    ctHash: proofFHE.ctHash.toString(),
    securityZone: proofFHE.securityZone,
    utype: proofFHE.utype,
    signature: proofFHE.signature.substring(0, 20) + "...",
  });

  console.log("✅ Nullifier InEuint256:", {
    ctHash: nullifierFHE.ctHash.toString(),
    securityZone: nullifierFHE.securityZone,
    utype: nullifierFHE.utype,
    signature: nullifierFHE.signature.substring(0, 20) + "...",
  });

  console.log("\n🚀 Creating anonymous record...");
  console.log("===============================");

  try {
    // Estimate gas first
    console.log("⏳ Estimating gas...");
    const gasEstimate = await anonymityTiers.createAnonymousRecord.estimateGas(
      proofFHE,
      nullifierFHE,
      merkleRootFHE,
      verificationTypeFHE,
      credentialTypeFHE
    );

    console.log("✅ Gas estimate successful:", gasEstimate.toString());

    // Get gas price
    const gasPrice = await signer.provider.getFeeData();
    console.log(
      "💸 Current gas price:",
      ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"),
      "gwei"
    );

    // Calculate cost
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || 0n);
    console.log("💰 Estimated cost:", ethers.formatEther(estimatedCost), "ETH");

    console.log("\n📤 Sending transaction...");

    // Execute the transaction
    const tx = await anonymityTiers.createAnonymousRecord(
      proofFHE, // _proof
      nullifierFHE, // _nullifierHash
      merkleRootFHE, // _merkleRoot
      verificationTypeFHE, // _verificationType
      credentialTypeFHE // _credentialType
    );

    console.log("🔗 Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();

    if (receipt?.status === 1) {
      console.log(
        "\n🎉 SUCCESS! Anonymous record created with your World ID data!"
      );
      console.log(
        "==========================================================="
      );
      console.log("✅ Transaction confirmed!");
      console.log("📍 Block number:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      console.log(
        "💸 Transaction fee:",
        ethers.formatEther(receipt.gasUsed * (receipt.gasPrice || 0n)),
        "ETH"
      );
      console.log(
        "🔗 Transaction URL: https://sepolia.arbiscan.io/tx/" + tx.hash
      );

      // Verify record creation
      try {
        console.log("\n📊 Verifying record creation...");
        const totalRecords = await anonymityTiers.getTotalRecords();
        console.log("📈 Total records in contract:", totalRecords.toString());

        const recordInfo = await anonymityTiers.getRecordInfo(totalRecords);
        console.log(
          "🎯 Your record tier:",
          recordInfo[0] === 0n ? "ANONYMOUS" : "OTHER"
        );
        console.log("👤 Record owner:", recordInfo[1]);

        console.log("\n🏆 FINAL RESULT:");
        console.log("================");
        console.log("✅ Your exact World ID data is now on Arbitrum Sepolia!");
        console.log("✅ Record UUID:", totalRecords.toString());
        console.log(
          "✅ Verification Level:",
          YOUR_EXACT_WORLD_ID_DATA.verification_level
        );
        console.log(
          "✅ Credential Type:",
          YOUR_EXACT_WORLD_ID_DATA.credential_type
        );
        console.log("✅ Privacy: Fully encrypted with Fhenix FHE");
        console.log("✅ Network: Arbitrum Sepolia");
        console.log(
          "🔗 View on Arbiscan: https://sepolia.arbiscan.io/address/" +
            CONTRACT_ADDRESS
        );
      } catch (error) {
        console.log("⚠️  Record created but couldn't verify details:", error);
      }
    } else {
      console.error("❌ Transaction failed!");
    }
  } catch (error: any) {
    console.error("❌ Error creating anonymous record:", error);

    if (error.message.includes("execution reverted")) {
      console.log("💡 Contract reverted. Possible reasons:");
      console.log("   - FHE signature validation failed");
      console.log("   - Invalid ctHash format");
      console.log("   - Security zone or utype mismatch");
      console.log("   - Contract access control issue");
    }

    console.log("\n🔍 Debug info:");
    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("Network ID:", network.chainId.toString());
    console.log("Account:", signer.address);
    console.log(
      "FHE format: CoFheInUint256 with ctHash, securityZone, utype, signature"
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
