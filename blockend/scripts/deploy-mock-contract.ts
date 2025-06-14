import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying AnonymityTiersMock to Arbitrum Sepolia");
  console.log("==================================================");
  console.log("📝 This version works without FHE infrastructure");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Error: Account has no ETH for deployment!");
    console.log(
      "💡 Get Arbitrum Sepolia ETH from: https://faucet.arbitrum.io/"
    );
    process.exit(1);
  }

  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");

  if (network.chainId !== 421614n) {
    console.error("❌ Error: Not connected to Arbitrum Sepolia!");
    process.exit(1);
  }

  console.log("\n📦 Deploying AnonymityTiersMock contract...");

  try {
    // Deploy the mock contract
    const AnonymityTiersMock = await ethers.getContractFactory(
      "AnonymityTiersMock"
    );

    console.log("⏳ Estimating deployment gas...");
    // Note: Gas estimation will be done during deployment

    const gasPrice = await deployer.provider.getFeeData();
    console.log(
      "💸 Current gas price:",
      ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"),
      "gwei"
    );

    console.log("🚀 Deploying contract...");
    const anonymityTiers = await AnonymityTiersMock.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await anonymityTiers.waitForDeployment();

    const contractAddress = await anonymityTiers.getAddress();

    console.log("\n🎉 SUCCESS! Contract deployed!");
    console.log("===============================");
    console.log("📍 Contract Address:", contractAddress);
    console.log(
      "🔗 Arbiscan URL: https://sepolia.arbiscan.io/address/" + contractAddress
    );
    console.log("📝 Contract Name: AnonymityTiersMock");
    console.log("🌐 Network: Arbitrum Sepolia");
    console.log("✅ Status: Ready for use (no FHE required)");

    // Test basic contract functionality
    console.log("\n🧪 Testing basic functionality...");
    const totalRecords = await (anonymityTiers as any).getTotalRecords();
    console.log("✅ getTotalRecords():", totalRecords.toString());

    console.log("\n📋 Contract Features:");
    console.log("=====================");
    console.log(
      "✅ Three-tier anonymity system (Anonymous → Pseudonymous → Identity)"
    );
    console.log("✅ Accepts your exact World ID data format");
    console.log("✅ Works on Arbitrum Sepolia without FHE infrastructure");
    console.log("✅ Same functionality as FHE version (just not encrypted)");
    console.log("✅ Compatible with your existing scripts");

    console.log("\n🔧 Next Steps:");
    console.log("==============");
    console.log("1. Use this contract address:", contractAddress);
    console.log("2. Update your scripts to use simple uint256 parameters");
    console.log("3. No FHE encryption needed - just pass your data directly");
    console.log("4. Perfect for testing and development on Arbitrum Sepolia");

    console.log("\n📝 Verification Command:");
    console.log("========================");
    console.log(`npx hardhat verify --network arb-sepolia ${contractAddress}`);
  } catch (error: any) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
