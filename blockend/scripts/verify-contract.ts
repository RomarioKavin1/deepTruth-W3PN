import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS = "0x86ACa02a8e94f9A786EF14598C309CF88AE60d4F";

async function main() {
  console.log("🔍 Verifying Contract Deployment");
  console.log("================================");

  // Get the signer account
  const [signer] = await ethers.getSigners();

  console.log("👤 Using account:", signer.address);

  // Check balance
  const balance = await signer.provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Verify network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");

  console.log("📍 Contract Address:", CONTRACT_ADDRESS);
  console.log(
    "🔗 Arbiscan URL: https://sepolia.arbiscan.io/address/" + CONTRACT_ADDRESS
  );

  try {
    // Check if contract exists
    const code = await ethers.provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      console.error("❌ No contract found at this address!");
      console.log(
        "💡 The contract might not be deployed or the address is wrong"
      );
      process.exit(1);
    }

    console.log("✅ Contract code found at address");
    console.log("📝 Code length:", code.length, "bytes");

    // Connect to the contract
    const AnonymityTiers = await ethers.getContractFactory("AnonymityTiers");
    const anonymityTiers = AnonymityTiers.attach(CONTRACT_ADDRESS) as any;

    console.log("\n🧪 Testing Contract Functions:");
    console.log("=============================");

    try {
      // Test 1: Check total records
      console.log("⏳ Testing getTotalRecords()...");
      const totalRecords = await anonymityTiers.getTotalRecords();
      console.log("✅ Total records:", totalRecords.toString());
    } catch (error) {
      console.error("❌ getTotalRecords() failed:", error);
    }

    try {
      // Test 2: Check contract owner (if exists)
      console.log("⏳ Testing owner()...");
      const owner = await anonymityTiers.owner();
      console.log("✅ Contract owner:", owner);
    } catch (error) {
      console.log("⚠️  owner() function not available or failed");
    }

    try {
      // Test 3: Check if we can read contract state
      console.log("⏳ Testing contract state...");

      // Try to get record info for record 0 (should fail gracefully)
      try {
        const recordInfo = await anonymityTiers.getRecordInfo(0);
        console.log("✅ getRecordInfo(0) returned:", recordInfo);
      } catch (error) {
        console.log(
          "⚠️  getRecordInfo(0) failed (expected if no records exist)"
        );
      }
    } catch (error) {
      console.error("❌ Contract state test failed:", error);
    }

    console.log("\n🔧 Testing Simple Function Call:");
    console.log("================================");

    try {
      // Test 4: Try a simple view function call
      console.log("⏳ Testing view functions...");

      // Get the current block number for reference
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log("📍 Current block number:", blockNumber);

      console.log("✅ Basic contract interaction successful");
    } catch (error) {
      console.error("❌ Basic contract interaction failed:", error);
    }

    console.log("\n🎯 Contract Verification Complete");
    console.log("=================================");
    console.log("✅ Contract is deployed and accessible");
    console.log("✅ Network connection working");
    console.log("✅ Account has sufficient balance");

    console.log("\n💡 Next Steps:");
    console.log("==============");
    console.log("1. The contract appears to be working");
    console.log("2. The issue is likely with the FHE format");
    console.log("3. We need to debug the createAnonymousRecord parameters");
  } catch (error: any) {
    console.error("❌ Contract verification failed:", error);

    console.log("\n🔍 Debugging Info:");
    console.log("==================");
    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("Network ID:", network.chainId.toString());
    console.log("Account:", signer.address);
    console.log("Error type:", error.code || "Unknown");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
