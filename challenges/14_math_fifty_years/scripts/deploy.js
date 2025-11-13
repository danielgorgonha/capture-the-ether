const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do FiftyYearsChallenge...\n");

  // Obter contas
  const [deployer, player] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("👤 Player address:", player.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato enviando 1 ether (requerido pelo construtor)
  // O construtor recebe o endereço do player como owner
  console.log("📦 Deployando FiftyYearsChallenge (enviando 1 ether)...");
  const FiftyYearsChallenge = await hre.ethers.getContractFactory("challenges/14_math_fifty_years/contracts/FiftyYearsChallenge.sol:FiftyYearsChallenge");
  const challenge = await FiftyYearsChallenge.deploy(player.address, {
    value: hre.ethers.parseEther("1.0")
  });

  await challenge.waitForDeployment();
  const address = await challenge.getAddress();

  // Verificar estado inicial
  const balance = await hre.ethers.provider.getBalance(address);
  const owner = await challenge.owner();
  const head = await challenge.head();
  const isComplete = await challenge.isComplete();
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", challenge.deploymentTransaction().hash);
  console.log("💰 Saldo do contrato:", hre.ethers.formatEther(balance), "ETH");
  console.log("👤 Owner:", owner);
  console.log("📊 Head:", head.toString());
  console.log("📊 Desafio completo:", isComplete);
  console.log("\n💡 Próximo passo: Execute o exploit para explorar storage collision");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

