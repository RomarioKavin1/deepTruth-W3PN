import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS = "0x86ACa02a8e94f9A786EF14598C309CF88AE60d4F";

async function main() {
  console.log("🧪 Testing Basic FHE Operations on Deployed Contract");
  console.log("====================================================");

  const [signer] = await ethers.getSigners();
  console.log("👤 Using account:", signer.address);

  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");

  // Connect to contract
  const AnonymityTiers = await ethers.getContractFactory("AnonymityTiers");
  const anonymityTiers = AnonymityTiers.attach(CONTRACT_ADDRESS) as any;

  console.log("📍 Contract Address:", CONTRACT_ADDRESS);

  // Test extremely simple values first
  const testFormats = [
    {
      name: "Minimal values with proper structure",
      params: [
        {
          ctHash: 1n,
          securityZone: 0,
          utype: 4,
          signature: "0x" + "00".repeat(32),
        },
        {
          ctHash: 2n,
          securityZone: 0,
          utype: 4,
          signature: "0x" + "00".repeat(32),
        },
        {
          ctHash: 3n,
          securityZone: 0,
          utype: 4,
          signature: "0x" + "00".repeat(32),
        },
        {
          ctHash: 4n,
          securityZone: 0,
          utype: 4,
          signature: "0x" + "00".repeat(32),
        },
        {
          ctHash: 5n,
          securityZone: 0,
          utype: 4,
          signature: "0x" + "00".repeat(32),
        },
      ],
    },
    {
      name: "Just simple data/utype objects",
      params: [
        { data: 1n, utype: 4 },
        { data: 2n, utype: 4 },
        { data: 3n, utype: 4 },
        { data: 4n, utype: 4 },
        { data: 5n, utype: 4 },
      ],
    },
    {
      name: "Empty signature with real hash",
      params: [
        { ctHash: 123456n, securityZone: 0, utype: 4, signature: "0x" },
        { ctHash: 123457n, securityZone: 0, utype: 4, signature: "0x" },
        { ctHash: 123458n, securityZone: 0, utype: 4, signature: "0x" },
        { ctHash: 123459n, securityZone: 0, utype: 4, signature: "0x" },
        { ctHash: 123460n, securityZone: 0, utype: 4, signature: "0x" },
      ],
    },
  ];

  for (const format of testFormats) {
    console.log(`\n🧪 Testing: ${format.name}`);
    console.log("=".repeat(50));

    try {
      console.log("⏳ Estimating gas...");

      // Try to estimate gas first
      const gasEstimate =
        await anonymityTiers.createAnonymousRecord.estimateGas(
          ...format.params
        );
      console.log("✅ SUCCESS! Gas estimate:", gasEstimate.toString());

      // If gas estimation works, the format is correct
      console.log(
        "🎯 This format works! The contract can process these parameters."
      );

      // Ask user if they want to proceed with transaction
      console.log(
        "📤 Would you like to execute the transaction? (This is a test with dummy data)"
      );

      break; // Stop testing once we find a working format
    } catch (error: any) {
      console.log("❌ Failed:", error.message.split("\n")[0]);

      if (error.message.includes("missing value for component")) {
        console.log("   💡 Missing required field in parameter structure");
      } else if (error.message.includes("execution reverted")) {
        console.log("   💡 Contract logic rejected the parameters");
      } else if (error.message.includes("invalid tuple value")) {
        console.log("   💡 Parameter structure doesn't match expected format");
      }
    }
  }

  console.log("\n🔍 Analysis:");
  console.log("============");
  console.log("If none of the formats work, it suggests:");
  console.log("1. The contract deployment may have issues");
  console.log("2. Arbitrum Sepolia may not support full Fhenix FHE");
  console.log("3. The FHE library requires specific network configuration");
  console.log("4. Signature validation is stricter than expected");

  // Check if we can call any other contract functions
  console.log("\n🔧 Testing other contract functions:");
  console.log("===================================");

  try {
    const totalRecords = await anonymityTiers.getTotalRecords();
    console.log("✅ getTotalRecords() works:", totalRecords.toString());
  } catch (error) {
    console.log("❌ getTotalRecords() failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
