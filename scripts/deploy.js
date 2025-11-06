const { ethers } = require("hardhat");

async function main() {
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const registry = await DIDRegistry.deploy();
  await registry.waitForDeployment();

  console.log("DIDRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
