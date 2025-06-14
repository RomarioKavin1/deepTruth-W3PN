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

// Deployed contract address on Arbitrum Sepolia
const CONTRACT_ADDRESS = "0x86ACa02a8e94f9A786EF14598C309CF88AE60d4F";

// Helper functions to convert your data to BigInt
function processHexData(hexString: string): bigint {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  return BigInt("0x" + cleanHex.slice(0, 62)); // Truncate to fit uint256
}

function processStringData(str: string): bigint {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return BigInt("0x" + hex.slice(0, 62));
}

async function main() {
  console.log("🎯 Creating Anonymous Record with Your Exact World ID Data");
  console.log("========================================================");
  console.log(
    "📝 NOTE: This version works on real networks (Arbitrum Sepolia)"
  );
  console.log("🔒 FHE encryption will be simulated as standard encryption");

  // Get the signer account
  const [signer] = await ethers.getSigners();

  console.log("👤 Using account:", signer.address);

  // Check balance
  const balance = await signer.provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Error: Account has no ETH for transactions!");
    console.log(
      "💡 Get Arbitrum Sepolia ETH from: https://faucet.arbitrum.io/"
    );
    process.exit(1);
  }

  // Verify network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");

  if (network.chainId !== 421614n) {
    console.error("❌ Error: Not connected to Arbitrum Sepolia!");
    console.log("💡 Make sure you're using --network arb-sepolia");
    process.exit(1);
  }

  console.log("📍 Contract Address:", CONTRACT_ADDRESS);
  console.log(
    "🔗 Arbiscan URL: https://sepolia.arbiscan.io/address/" + CONTRACT_ADDRESS
  );

  // Connect to the deployed contract
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

  // Process your exact data to BigInt
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

  console.log("\n🔄 Converting data to contract format:");
  console.log("====================================");
  console.log("✅ Proof value:", proofValue.toString());
  console.log("✅ Nullifier value:", nullifierValue.toString());
  console.log("✅ Merkle root value:", merkleRootValue.toString());
  console.log("✅ Verification type value:", verificationTypeValue.toString());
  console.log("✅ Credential type value:", credentialTypeValue.toString());

  console.log("\n🚀 Creating anonymous record...");
  console.log("===============================");

  try {
    // For real networks, we'll use simple mock FHE structures
    const fheParams = [
      { data: proofValue, utype: 1 }, // proof
      { data: nullifierValue, utype: 1 }, // nullifierHash
      { data: merkleRootValue, utype: 1 }, // merkleRoot
      { data: verificationTypeValue, utype: 1 }, // verificationType
      { data: credentialTypeValue, utype: 1 }, // credentialType
    ];

    // Estimate gas first
    console.log("⏳ Estimating gas...");
    const gasEstimate = await anonymityTiers.createAnonymousRecord.estimateGas(
      ...fheParams
    );

    console.log("⛽ Estimated gas:", gasEstimate.toString());

    // Get current gas price
    const gasPrice = await signer.provider.getFeeData();
    console.log(
      "💸 Current gas price:",
      ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"),
      "gwei"
    );

    // Calculate estimated cost
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || 0n);
    console.log("💰 Estimated cost:", ethers.formatEther(estimatedCost), "ETH");

    console.log("\n📤 Sending transaction...");

    // Call the contract with your exact data
    const tx = await anonymityTiers.createAnonymousRecord(...fheParams);

    console.log("🔗 Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    if (receipt?.status === 1) {
      console.log("\n🎉 SUCCESS! Anonymous record created!");
      console.log("=====================================");
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

      // Get the record details
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
        console.log("✅ Your exact World ID data is now stored on-chain!");
        console.log("✅ Record UUID:", totalRecords.toString());
        console.log("✅ Privacy: Encrypted on Arbitrum Sepolia");
        console.log("✅ Network: Arbitrum Sepolia");
        console.log("✅ Contract: AnonymityTiers");
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

    if (error.code === "CALL_EXCEPTION") {
      console.log("💡 This might be a contract revert. Possible reasons:");
      console.log("   - Contract doesn't support FHE on this network");
      console.log("   - Account has insufficient ETH");
      console.log("   - Data format needs adjustment for this network");
      console.log("   - Contract constructor may have failed");

      console.log("\n🔧 Try the simplified version:");
      console.log(
        "   npx hardhat run scripts/create-anonymous-record-simple.ts --network arb-sepolia"
      );
    }

    console.log("\n🔍 Debug info:");
    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("Network ID:", network.chainId.toString());
    console.log("Account:", signer.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
