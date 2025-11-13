const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do GuessTheRandomNumberChallenge...\n");

  // Obter contas
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Obter informações do bloco antes do deploy
  const blockBefore = await hre.ethers.provider.getBlock("latest");
  console.log("📊 Bloco antes do deploy:");
  console.log("  - Número do bloco:", blockBefore.number);
  console.log("  - Timestamp:", blockBefore.timestamp);
  console.log("  - Hash do bloco:", blockBefore.hash);
  console.log("");

  // Deploy do contrato enviando 1 ether (requerido pelo construtor)
  console.log("📦 Deployando GuessTheRandomNumberChallenge (enviando 1 ether)...");
  const GuessTheRandomNumberChallenge = await hre.ethers.getContractFactory("GuessTheRandomNumberChallenge");
  const guessChallenge = await GuessTheRandomNumberChallenge.deploy({
    value: hre.ethers.parseEther("1.0")
  });

  const deployTx = guessChallenge.deploymentTransaction();
  await guessChallenge.waitForDeployment();
  const address = await guessChallenge.getAddress();

  // Obter informações do bloco após o deploy
  const receipt = await hre.ethers.provider.getTransactionReceipt(deployTx.hash);
  const blockAfter = await hre.ethers.provider.getBlock(receipt.blockNumber);
  
  console.log("✅ Contrato deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("🔗 Transaction hash:", deployTx.hash);
  console.log("📊 Bloco do deploy:");
  console.log("  - Número do bloco:", blockAfter.number);
  console.log("  - Timestamp:", blockAfter.timestamp);
  console.log("  - Hash do bloco:", blockAfter.hash);
  console.log("  - Hash do bloco anterior:", blockAfter.number > 0 ? (await hre.ethers.provider.getBlock(blockAfter.number - 1)).hash : "N/A");
  console.log("");

  // Verificar estado inicial
  const balance = await hre.ethers.provider.getBalance(address);
  const isComplete = await guessChallenge.isComplete();
  
  console.log("💰 Saldo do contrato:", hre.ethers.formatEther(balance), "ETH");
  console.log("📊 Desafio completo:", isComplete);
  console.log("\n💡 Próximo passo: Execute o exploit para calcular e adivinhar o número");
  console.log("💡 Use o hash do bloco anterior e o timestamp do bloco de deploy");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

