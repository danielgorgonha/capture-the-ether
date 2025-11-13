const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do PredictTheBlockHashChallenge...\n");

  // Obter contas
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy do contrato enviando 1 ether (requerido pelo construtor)
  console.log("📦 Deployando PredictTheBlockHashChallenge (enviando 1 ether)...");
  const PredictTheBlockHashChallenge = await hre.ethers.getContractFactory("challenges/08_lottery_predict_block_hash/contracts/PredictTheBlockHashChallenge.sol:PredictTheBlockHashChallenge");
  const challenge = await PredictTheBlockHashChallenge.deploy({
    value: hre.ethers.parseEther("1.0")
  });

  await challenge.waitForDeployment();
  const address = await challenge.getAddress();

  // Verificar estado inicial
  const balance = await hre.ethers.provider.getBalance(address);
  const isComplete = await challenge.isComplete();
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", challenge.deploymentTransaction().hash);
  console.log("💰 Saldo do contrato:", hre.ethers.formatEther(balance), "ETH");
  console.log("📊 Desafio completo:", isComplete);
  console.log("\n💡 Próximo passo: Execute o exploit para fazer lock do hash e depois settle");
  console.log("⚠️  Nota: O exploit precisa esperar mais de 256 blocos após o lock!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

