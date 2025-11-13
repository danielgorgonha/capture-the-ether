const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do MappingChallenge...\n");

  // Obter contas
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato
  console.log("📦 Deployando MappingChallenge...");
  const MappingChallenge = await hre.ethers.getContractFactory("challenges/12_math_mapping/contracts/MappingChallenge.sol:MappingChallenge");
  const challenge = await MappingChallenge.deploy();

  await challenge.waitForDeployment();
  const address = await challenge.getAddress();

  // Verificar estado inicial
  const isComplete = await challenge.isComplete();
  const mapLength = await hre.ethers.provider.getStorage(address, 1); // Slot 1 é map.length
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", challenge.deploymentTransaction().hash);
  console.log("📊 isComplete:", isComplete);
  console.log("📊 map.length:", hre.ethers.toNumber(mapLength));
  console.log("\n💡 Próximo passo: Execute o exploit para sobrescrever isComplete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

