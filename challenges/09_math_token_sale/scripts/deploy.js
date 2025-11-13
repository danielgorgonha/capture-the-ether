const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do TokenSaleChallenge...\n");

  // Obter contas
  const [deployer, player] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("👤 Player address:", player.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato enviando 1 ether (requerido pelo construtor)
  // O construtor recebe o endereço do player
  console.log("📦 Deployando TokenSaleChallenge (enviando 1 ether)...");
  const TokenSaleChallenge = await hre.ethers.getContractFactory("challenges/09_math_token_sale/contracts/TokenSaleChallenge.sol:TokenSaleChallenge");
  const challenge = await TokenSaleChallenge.deploy(player.address, {
    value: hre.ethers.parseEther("1.0")
  });

  await challenge.waitForDeployment();
  const address = await challenge.getAddress();

  // Verificar estado inicial
  const balance = await hre.ethers.provider.getBalance(address);
  const isComplete = await challenge.isComplete();
  const playerBalance = await challenge.balanceOf(player.address);
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", challenge.deploymentTransaction().hash);
  console.log("💰 Saldo do contrato:", hre.ethers.formatEther(balance), "ETH");
  console.log("📊 Desafio completo:", isComplete);
  console.log("🪙 Tokens do player:", playerBalance.toString());
  console.log("\n💡 Próximo passo: Execute o exploit para explorar o integer overflow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

