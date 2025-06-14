import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS = "0x86ACa02a8e94f9A786EF14598C309CF88AE60d4F";

// Helper function to convert data to BigInt
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

async function main() {
  console.log("🔧 Debug FHE Format for createAnonymousRecord");
  console.log("=============================================");

  const [signer] = await ethers.getSigners();
  console.log("👤 Using account:", signer.address);

  // Connect to contract
  const AnonymityTiers = await ethers.getContractFactory("AnonymityTiers");
  const anonymityTiers = AnonymityTiers.attach(CONTRACT_ADDRESS) as any;

  // Process your World ID data
  const proofValue = processHexData(
    "0x267a5cfae3dbbc9a5a7c23831465a84581721526d5aab7d6e22eeea0a19d63fe"
  );
  const nullifierValue = processHexData(
    "0x255243621a57d769e48015daa5cb85c6861959274a0ef640f025e9e51c9306c3"
  );
  const merkleRootValue = processHexData(
    "0x2817278308df723933d68faa965dc6377fde23a784318ce445aca400c590949"
  );
  const verificationTypeValue = processStringData("orb");
  const credentialTypeValue = processStringData("orb");

  console.log("📊 Processed Values:");
  console.log("===================");
  console.log("Proof:", proofValue.toString());
  console.log("Nullifier:", nullifierValue.toString());
  console.log("Merkle Root:", merkleRootValue.toString());
  console.log("Verification Type:", verificationTypeValue.toString());
  console.log("Credential Type:", credentialTypeValue.toString());

  // Test different FHE formats
  const testFormats = [
    {
      name: "Format 1: Simple object with data and utype",
      params: [
        { data: proofValue, utype: 4 },
        { data: nullifierValue, utype: 4 },
        { data: merkleRootValue, utype: 4 },
        { data: verificationTypeValue, utype: 4 },
        { data: credentialTypeValue, utype: 4 },
      ],
    },
    {
      name: "Format 2: Full FHE structure with ctHash, securityZone, utype, signature",
      params: [
        {
          ctHash: proofValue,
          securityZone: 0,
          utype: 4,
          signature: ethers.solidityPackedKeccak256(["uint256"], [proofValue]),
        },
        {
          ctHash: nullifierValue,
          securityZone: 0,
          utype: 4,
          signature: ethers.solidityPackedKeccak256(
            ["uint256"],
            [nullifierValue]
          ),
        },
        {
          ctHash: merkleRootValue,
          securityZone: 0,
          utype: 4,
          signature: ethers.solidityPackedKeccak256(
            ["uint256"],
            [merkleRootValue]
          ),
        },
        {
          ctHash: verificationTypeValue,
          securityZone: 0,
          utype: 4,
          signature: ethers.solidityPackedKeccak256(
            ["uint256"],
            [verificationTypeValue]
          ),
        },
        {
          ctHash: credentialTypeValue,
          securityZone: 0,
          utype: 4,
          signature: ethers.solidityPackedKeccak256(
            ["uint256"],
            [credentialTypeValue]
          ),
        },
      ],
    },
    {
      name: "Format 3: Just the raw values",
      params: [
        proofValue,
        nullifierValue,
        merkleRootValue,
        verificationTypeValue,
        credentialTypeValue,
      ],
    },
  ];

  for (const format of testFormats) {
    console.log(`\n🧪 Testing ${format.name}`);
    console.log("=".repeat(50));

    try {
      console.log("⏳ Estimating gas...");
      const gasEstimate =
        await anonymityTiers.createAnonymousRecord.estimateGas(
          ...format.params
        );
      console.log("✅ Gas estimate successful:", gasEstimate.toString());

      console.log("🎯 This format works! Let's try the transaction...");

      // If gas estimation works, try the actual transaction
      const tx = await anonymityTiers.createAnonymousRecord(...format.params);
      console.log("🔗 Transaction hash:", tx.hash);

      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        console.log("🎉 SUCCESS! Transaction confirmed!");
        console.log("📍 Block:", receipt.blockNumber);
        console.log("⛽ Gas used:", receipt.gasUsed.toString());
        console.log("🔗 TX URL: https://sepolia.arbiscan.io/tx/" + tx.hash);

        // Get the record count
        const totalRecords = await anonymityTiers.getTotalRecords();
        console.log("✅ New record UUID:", totalRecords.toString());

        break; // Stop testing once we find a working format
      }
    } catch (error: any) {
      console.log("❌ Failed:", error.message.split("\n")[0]);
      console.log("   Error code:", error.code || "Unknown");

      if (error.message.includes("execution reverted")) {
        console.log("   💡 Contract reverted - likely parameter format issue");
      }
    }
  }

  console.log("\n🔍 Additional Debug Info:");
  console.log("=========================");
  console.log("Contract expects InEuint256 memory parameters");
  console.log("InEuint256 is likely a struct with specific fields");
  console.log("Check @fhenixprotocol/cofhe-contracts for exact format");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug script failed:", error);
    process.exit(1);
  });
