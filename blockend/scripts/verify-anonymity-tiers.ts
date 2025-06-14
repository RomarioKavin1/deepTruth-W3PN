import { run } from "hardhat";

async function main() {
  // Replace this with your deployed contract address
  const contractAddress = process.argv[2];

  if (!contractAddress) {
    console.error("❌ Please provide the contract address as an argument");
    console.log(
      "Usage: npx hardhat run scripts/verify-anonymity-tiers.ts --network arb-sepolia -- <CONTRACT_ADDRESS>"
    );
    process.exit(1);
  }

  console.log("🔍 Verifying AnonymityTiers contract...");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Arbitrum Sepolia");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // AnonymityTiers has no constructor arguments
    });

    console.log("✅ Contract verified successfully!");
    console.log(
      `🔗 View on Arbiscan: https://sepolia.arbiscan.io/address/${contractAddress}`
    );
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
      console.log(
        `🔗 View on Arbiscan: https://sepolia.arbiscan.io/address/${contractAddress}`
      );
    } else {
      console.error("❌ Verification failed:", error.message);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
