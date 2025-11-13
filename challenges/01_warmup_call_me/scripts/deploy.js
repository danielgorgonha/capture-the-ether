const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do CallMeChallenge...\n");

  // Obter contas
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato
  const CallMeChallenge = await hre.ethers.getContractFactory("CallMeChallenge");
  const callMeChallenge = await CallMeChallenge.deploy();

  await callMeChallenge.waitForDeployment();
  const address = await callMeChallenge.getAddress();

  // Verificar estado inicial
  const isComplete = await callMeChallenge.isComplete();
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", callMeChallenge.deploymentTransaction().hash);
  console.log("📊 Estado inicial - isComplete:", isComplete);
  console.log("\n💡 Próximo passo: Execute o exploit para chamar a função callme()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

