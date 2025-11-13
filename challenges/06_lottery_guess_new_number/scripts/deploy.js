const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do GuessTheNewNumberChallenge...\n");

  // Obter contas
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato enviando 1 ether (requerido pelo construtor)
  console.log("📦 Deployando GuessTheNewNumberChallenge (enviando 1 ether)...");
  const GuessTheNewNumberChallenge = await hre.ethers.getContractFactory("challenges/06_lottery_guess_new_number/contracts/GuessTheNewNumberChallenge.sol:GuessTheNewNumberChallenge");
  const guessChallenge = await GuessTheNewNumberChallenge.deploy({
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
  console.log("\n💡 Próximo passo: Execute o exploit para calcular e adivinhar o número");
  console.log("💡 O número é gerado on-demand quando guess() é chamado");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

