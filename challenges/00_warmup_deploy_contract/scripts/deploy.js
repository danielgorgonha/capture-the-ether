const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do DeployChallenge...\n");

  // Obter contas
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato
  const DeployChallenge = await hre.ethers.getContractFactory("DeployChallenge");
  const deployChallenge = await DeployChallenge.deploy();

  await deployChallenge.waitForDeployment();
  const address = await deployChallenge.getAddress();

  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", deployChallenge.deploymentTransaction().hash);
  console.log("\n💡 Próximo passo: Verifique no site Capture the Ether usando o endereço acima");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

