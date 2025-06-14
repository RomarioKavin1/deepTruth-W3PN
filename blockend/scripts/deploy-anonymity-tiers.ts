import { ethers } from "hardhat";
import { AnonymityTiers } from "../typechain-types";

async function main() {
  console.log("Deploying AnonymityTiers contract to Arbitrum Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const AnonymityTiersFactory = await ethers.getContractFactory(
    "AnonymityTiers"
  );

  console.log("Deploying contract...");
  const anonymityTiers: AnonymityTiers = await AnonymityTiersFactory.deploy();

  // Wait for deployment
  await anonymityTiers.waitForDeployment();
  const contractAddress = await anonymityTiers.getAddress();

  console.log("✅ AnonymityTiers deployed to:", contractAddress);
  console.log(
    "🔗 Transaction hash:",
    anonymityTiers.deploymentTransaction()?.hash
  );

  // Wait for a few confirmations before verification
  console.log("Waiting for confirmations...");
  await anonymityTiers.deploymentTransaction()?.wait(5);

  console.log("✅ Contract deployment confirmed!");
  console.log("\n📋 Deployment Summary:");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Arbitrum Sepolia");
  console.log("Deployer:", deployer.address);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "arbitrum-sepolia",
    deployer: deployer.address,
    deploymentHash: anonymityTiers.deploymentTransaction()?.hash,
    timestamp: new Date().toISOString(),
  };

  console.log("\n🔍 To verify the contract, run:");
  console.log(`npx hardhat verify --network arb-sepolia ${contractAddress}`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
