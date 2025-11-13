const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do RetirementFundChallenge...\n");

  // Obter contas
  const [deployer, player] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("👤 Player address:", player.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato enviando 1 ether (requerido pelo construtor)
  // O construtor recebe o endereço do player como beneficiary
  console.log("📦 Deployando RetirementFundChallenge (enviando 1 ether)...");
  const RetirementFundChallenge = await hre.ethers.getContractFactory("challenges/11_math_retirement_fund/contracts/RetirementFundChallenge.sol:RetirementFundChallenge");
  const challenge = await RetirementFundChallenge.deploy(player.address, {
    value: hre.ethers.parseEther("1.0")
  });

  await challenge.waitForDeployment();
  const address = await challenge.getAddress();

  // Verificar estado inicial
  const balance = await hre.ethers.provider.getBalance(address);
  const startBalance = await challenge.startBalance();
  const expiration = await challenge.expiration();
  const isComplete = await challenge.isComplete();
  
  const currentTime = Math.floor(Date.now() / 1000);
  const yearsUntilExpiration = (Number(expiration) - currentTime) / (365 * 24 * 60 * 60);
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", challenge.deploymentTransaction().hash);
  console.log("💰 Saldo do contrato:", hre.ethers.formatEther(balance), "ETH");
  console.log("📊 Start balance:", hre.ethers.formatEther(startBalance), "ETH");
  console.log("⏰ Expiration:", new Date(Number(expiration) * 1000).toLocaleString());
  console.log("⏳ Anos até expiração:", yearsUntilExpiration.toFixed(2));
  console.log("📊 Desafio completo:", isComplete);
  console.log("\n💡 Próximo passo: Execute o exploit para explorar o integer underflow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

