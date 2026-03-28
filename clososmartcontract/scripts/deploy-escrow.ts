import { ethers, network, run } from "hardhat";
import { getAddress } from "ethers";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  if (!deployer) {
    throw new Error(
      "No deployer signer available. Set PRIVATE_KEY in .env for monadTestnet deployment.",
    );
  }
  const operatorRaw = process.env.PAYOUT_OPERATOR_ADDRESS ?? deployer.address;
  const operator = getAddress(operatorRaw);

  const Escrow = await ethers.getContractFactory("MonadBlitzEscrow");
  const escrow = await Escrow.deploy(deployer.address, operator);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  const tx = escrow.deploymentTransaction();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Payout Operator: ${operator}`);
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  if (tx) {
    console.log(`Deploy tx: ${tx.hash}`);
  }
  console.log(`MonadBlitzEscrow deployed: ${address}`);

  if (network.name !== "hardhat" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for confirmations before verify...");
    if (tx) await tx.wait(5);

    await run("verify:verify", {
      address,
      constructorArguments: [deployer.address, operator],
    });
    console.log("Contract verified.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
