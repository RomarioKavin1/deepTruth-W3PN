import { ethers } from "hardhat";

async function main() {
  console.log("Deploying AnonymityTiersBasic contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const AnonymityTiersBasicFactory = await ethers.getContractFactory(
    "AnonymityTiersBasic"
  );

  console.log("Deploying contract...");
  const anonymityTiersBasic = await AnonymityTiersBasicFactory.deploy();

  // Wait for deployment
  await anonymityTiersBasic.waitForDeployment();
  const contractAddress = await anonymityTiersBasic.getAddress();

  console.log("✅ AnonymityTiersBasic deployed to:", contractAddress);
  console.log(
    "🔗 Transaction hash:",
    anonymityTiersBasic.deploymentTransaction()?.hash
  );

  // Wait for a few confirmations
  console.log("Waiting for confirmations...");
  await anonymityTiersBasic.deploymentTransaction()?.wait(2);

  console.log("✅ Contract deployment confirmed!");
  console.log("\n📋 Deployment Summary:");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);

  console.log("✅ Basic contract deployed successfully!");

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    deploymentHash: anonymityTiersBasic.deploymentTransaction()?.hash,
    timestamp: new Date().toISOString(),
  };

  console.log("\n🔍 To verify the contract on a live network, run:");
  console.log(`npx hardhat verify --network <network-name> ${contractAddress}`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
