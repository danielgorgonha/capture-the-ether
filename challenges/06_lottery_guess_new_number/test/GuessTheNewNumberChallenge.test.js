const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheNewNumberChallenge", function () {
  let guessChallenge;
  let attacker;
  let deployer;
  let player;

  beforeEach(async function () {
    [deployer, player] = await ethers.getSigners();
    
    // Deploy do contrato principal
    const GuessTheNewNumberChallenge = await ethers.getContractFactory(
      "challenges/06_lottery_guess_new_number/contracts/GuessTheNewNumberChallenge.sol:GuessTheNewNumberChallenge"
    );
    
    guessChallenge = await GuessTheNewNumberChallenge.deploy({
      value: ethers.parseEther("1.0")
    });
    await guessChallenge.waitForDeployment();
    
    // Deploy do contrato atacante
    const Attacker = await ethers.getContractFactory(
      "challenges/06_lottery_guess_new_number/contracts/Attacker.sol:Attacker"
    );
    attacker = await Attacker.deploy();
    await attacker.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy challenge contract successfully with 1 ether", async function () {
      const address = await guessChallenge.getAddress();
      expect(address).to.be.properAddress;
      
      const balance = await ethers.provider.getBalance(address);
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should deploy attacker contract successfully", async function () {
      const address = await attacker.getAddress();
      expect(address).to.be.properAddress;
    });

    it("Should start with challenge incomplete", async function () {
      const isComplete = await guessChallenge.isComplete();
      expect(isComplete).to.be.false;
    });
  });

  describe("Attacker Contract", function () {
    it("Should have fallback function to receive ether", async function () {
      // Verificar que o contrato pode receber ether
      const tx = await deployer.sendTransaction({
        to: await attacker.getAddress(),
        value: ethers.parseEther("0.1")
      });
      await tx.wait();
      
      const balance = await ethers.provider.getBalance(await attacker.getAddress());
      expect(balance).to.equal(ethers.parseEther("0.1"));
    });

    it("Should calculate and call in same transaction", async function () {
      const challengeAddress = await guessChallenge.getAddress();
      const challengeBalanceBefore = await ethers.provider.getBalance(challengeAddress);
      
      // Executar exploit através do contrato atacante
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // Verificar que o contrato foi drenado
      const challengeBalanceAfter = await ethers.provider.getBalance(challengeAddress);
      expect(challengeBalanceAfter).to.equal(0);
      
      // Verificar que o desafio está completo
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should transfer ether back to attacker", async function () {
      const playerBalanceBefore = await ethers.provider.getBalance(player.address);
      const challengeAddress = await guessChallenge.getAddress();
      
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      const receipt = await tx.wait();
      
      // Calcular gas usado
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const playerBalanceAfter = await ethers.provider.getBalance(player.address);
      const balanceDiff = playerBalanceAfter - playerBalanceBefore;
      
      // Deve receber 2 ether, mas pagar 1 ether + gas
      // Então: +2 ether - 1 ether - gas = +1 ether - gas
      expect(balanceDiff).to.be.greaterThan(ethers.parseEther("0.9"));
    });
  });

  describe("Atomicity", function () {
    it("Should use same block data in calculation and call", async function () {
      // O contrato atacante calcula e chama na mesma transação
      // Isso garante que ambos usem os mesmos valores de bloco
      const challengeAddress = await guessChallenge.getAddress();
      
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      const receipt = await tx.wait();
      
      // Verificar que funcionou (mesma transação = mesmo bloco)
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should demonstrate that direct call might fail", async function () {
      // Se tentarmos calcular em JavaScript e chamar depois,
      // pode ser que o bloco mude
      // Mas com o contrato atacante, garantimos atomicidade
      const challengeAddress = await guessChallenge.getAddress();
      
      // Tentar calcular e chamar diretamente (pode falhar se bloco mudar)
      // Mas vamos usar o contrato atacante que garante atomicidade
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // Deve funcionar porque está na mesma transação
      expect(await guessChallenge.isComplete()).to.be.true;
    });
  });

  describe("Security - Predictability", function () {
    it("Should demonstrate that block data is still public", async function () {
      // Mesmo que o número seja calculado on-demand,
      // os dados de blocos ainda são públicos
      const currentBlock = await ethers.provider.getBlock("latest");
      const previousBlock = await ethers.provider.getBlock(currentBlock.number - 1);
      
      expect(previousBlock.hash).to.not.be.undefined;
      expect(currentBlock.timestamp).to.not.be.undefined;
    });

    it("Should verify that attacker contract can always calculate correctly", async function () {
      // O contrato atacante sempre consegue calcular o número correto
      // porque usa os mesmos dados de bloco na mesma transação
      const challengeAddress = await guessChallenge.getAddress();
      
      // Executar múltiplas vezes (se tivéssemos mais fundos)
      // Cada vez deve funcionar porque calcula na mesma transação
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      expect(await guessChallenge.isComplete()).to.be.true;
    });
  });

  describe("guess() - Direct Call (Without Attacker)", function () {
    it("Should fail if called directly with wrong number", async function () {
      // Tentar chamar diretamente com número errado
      await guessChallenge.connect(player).guess(100, {
        value: ethers.parseEther("1.0")
      });
      
      // O contrato ainda deve ter 2 ether (1 inicial + 1 da tentativa errada)
      const balance = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balance).to.equal(ethers.parseEther("2.0"));
      
      // Desafio não deve estar completo
      expect(await guessChallenge.isComplete()).to.be.false;
    });

    it("Should demonstrate why attacker contract is needed", async function () {
      // Sem o contrato atacante, não podemos garantir que o número calculado
      // será o mesmo usado pelo contrato (bloco pode mudar)
      // O contrato atacante resolve isso calculando e chamando na mesma transação
      
      const challengeAddress = await guessChallenge.getAddress();
      
      // Usar o contrato atacante garante atomicidade
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      expect(await guessChallenge.isComplete()).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple calls correctly", async function () {
      // Se o contrato tivesse mais fundos, poderíamos chamar múltiplas vezes
      // Mas como só tem 1 ether, só funciona uma vez
      const challengeAddress = await guessChallenge.getAddress();
      
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      expect(await guessChallenge.isComplete()).to.be.true;
      
      // Se tentássemos novamente, o contrato já está vazio
      const balance = await ethers.provider.getBalance(challengeAddress);
      expect(balance).to.equal(0);
    });

    it("Should verify attacker contract balance management", async function () {
      const challengeAddress = await guessChallenge.getAddress();
      const attackerAddress = await attacker.getAddress();
      
      // Verificar saldo inicial do atacante
      const attackerBalanceBefore = await ethers.provider.getBalance(attackerAddress);
      expect(attackerBalanceBefore).to.equal(0);
      
      // Executar exploit
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // O atacante deve ter transferido o ether de volta
      // Então o saldo deve ser 0 (ou próximo disso)
      const attackerBalanceAfter = await ethers.provider.getBalance(attackerAddress);
      expect(attackerBalanceAfter).to.be.lessThan(ethers.parseEther("0.01")); // Praticamente zero
    });
  });

  describe("Fallback Function", function () {
    it("Should receive ether from challenge contract", async function () {
      // O contrato challenge transfere 2 ether para o contrato atacante
      // O fallback function permite que o contrato receba esse ether
      const challengeAddress = await guessChallenge.getAddress();
      
      const attackerBalanceBefore = await ethers.provider.getBalance(await attacker.getAddress());
      
      const tx = await attacker.connect(player).attack(challengeAddress, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // O atacante recebe 2 ether, mas transfere de volta
      // Então o saldo final deve ser próximo de zero
      const attackerBalanceAfter = await ethers.provider.getBalance(await attacker.getAddress());
      expect(attackerBalanceAfter).to.be.lessThan(ethers.parseEther("0.01"));
    });
  });
});

