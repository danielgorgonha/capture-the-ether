const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy dos contratos do NicknameChallenge...\n");

  // Obter contas
  const [deployer, player] = await hre.ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  console.log("👤 Endereço do jogador:", player.address);
  console.log("💰 Saldo da conta:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy do CaptureTheEther (contrato principal)
  console.log("📦 Deployando CaptureTheEther...");
  const CaptureTheEther = await hre.ethers.getContractFactory("challenges/02_warmup_choose_nickname/contracts/CaptureTheEther.sol:CaptureTheEther");
  const captureTheEther = await CaptureTheEther.deploy();
  await captureTheEther.waitForDeployment();
  const cteAddress = await captureTheEther.getAddress();
  console.log("✅ CaptureTheEther deployado em:", cteAddress);
  console.log("");

  // 2. Deploy do NicknameChallenge (contrato de verificação)
  console.log("📦 Deployando NicknameChallenge...");
  const NicknameChallenge = await hre.ethers.getContractFactory("challenges/02_warmup_choose_nickname/contracts/NicknameChallenge.sol:NicknameChallenge");
  const nicknameChallenge = await NicknameChallenge.deploy(player.address, cteAddress);
  await nicknameChallenge.waitForDeployment();
  const challengeAddress = await nicknameChallenge.getAddress();
  console.log("✅ NicknameChallenge deployado em:", challengeAddress);
  console.log("");

  // Verificar estado inicial
  const nicknameBefore = await captureTheEther.nicknameOf(player.address);
  const isCompleteBefore = await nicknameChallenge.isComplete();
  
  console.log("📊 Estado inicial:");
  console.log("  - Nickname do jogador:", nicknameBefore === "0x0000000000000000000000000000000000000000000000000000000000000000" ? "(vazio)" : hre.ethers.toUtf8String(nicknameBefore));
  console.log("  - Desafio completo:", isCompleteBefore);
  console.log("\n💡 Próximo passo: Execute o exploit para definir um nickname");
  console.log("💡 Use o endereço do CaptureTheEther:", cteAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

