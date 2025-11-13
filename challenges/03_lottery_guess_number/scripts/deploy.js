const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do GuessTheNumberChallenge...\n");

  // Obter contas
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato enviando 1 ether (requerido pelo construtor)
  console.log("📦 Deployando GuessTheNumberChallenge (enviando 1 ether)...");
  const GuessTheNumberChallenge = await hre.ethers.getContractFactory("GuessTheNumberChallenge");
  const guessChallenge = await GuessTheNumberChallenge.deploy({
    value: hre.ethers.parseEther("1.0")
  });

  await guessChallenge.waitForDeployment();
  const address = await guessChallenge.getAddress();

  // Verificar estado inicial
  const balance = await hre.ethers.provider.getBalance(address);
  const isComplete = await guessChallenge.isComplete();
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", guessChallenge.deploymentTransaction().hash);
  console.log("💰 Saldo do contrato:", hre.ethers.formatEther(balance), "ETH");
  console.log("📊 Desafio completo:", isComplete);
  console.log("\n💡 Próximo passo: Execute o exploit para adivinhar o número (42)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

