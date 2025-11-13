const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do TokenWhaleChallenge...\n");

  // Obter contas
  const [deployer, player] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("👤 Player address:", player.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato
  // O construtor recebe o endereço do player
  console.log("📦 Deployando TokenWhaleChallenge...");
  const TokenWhaleChallenge = await hre.ethers.getContractFactory("challenges/10_math_token_whale/contracts/TokenWhaleChallenge.sol:TokenWhaleChallenge");
  const challenge = await TokenWhaleChallenge.deploy(player.address);

  await challenge.waitForDeployment();
  const address = await challenge.getAddress();

  // Verificar estado inicial
  const totalSupply = await challenge.totalSupply();
  const playerBalance = await challenge.balanceOf(player.address);
  const isComplete = await challenge.isComplete();
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", challenge.deploymentTransaction().hash);
  console.log("📊 Total supply:", totalSupply.toString());
  console.log("🪙 Tokens do player:", playerBalance.toString());
  console.log("📊 Desafio completo:", isComplete);
  console.log("\n💡 Próximo passo: Execute o exploit para explorar a vulnerabilidade em _transfer");
  console.log("⚠️  Objetivo: Fazer balanceOf[player] >= 1000000");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

