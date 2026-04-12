const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("ERROR: wallet has 0 ETH. Get Sepolia ETH from https://sepoliafaucet.com");
    process.exit(1);
  }

  console.log("\nDeploying AuditLogger...");
  const Factory  = await ethers.getContractFactory("AuditLogger");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ AuditLogger deployed to:", address);

  // Authorize backend wallet if provided separately
  if (
    process.env.BACKEND_WALLET_ADDRESS &&
    process.env.BACKEND_WALLET_ADDRESS.toLowerCase() !== deployer.address.toLowerCase()
  ) {
    console.log("Authorizing backend wallet:", process.env.BACKEND_WALLET_ADDRESS);
    const tx = await contract.authorizeHospital(process.env.BACKEND_WALLET_ADDRESS);
    await tx.wait();
    console.log("✅ Backend wallet authorized");
  } else {
    console.log("ℹ️  Deployer is auto-authorized as hospital (constructor)");
  }

  console.log("\n══════════════════════════════════════════");
  console.log("Add this line to your .env file:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log("══════════════════════════════════════════");
  console.log("\nEtherscan:", `https://sepolia.etherscan.io/address/${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
