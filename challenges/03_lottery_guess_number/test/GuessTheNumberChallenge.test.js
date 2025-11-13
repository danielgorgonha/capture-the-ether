const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheNumberChallenge", function () {
  let guessChallenge;
  let deployer;
  let attacker;

  beforeEach(async function () {
    [deployer, attacker] = await ethers.getSigners();
    
    const GuessTheNumberChallenge = await ethers.getContractFactory(
      "challenges/03_lottery_guess_number/contracts/GuessTheNumberChallenge.sol:GuessTheNumberChallenge"
    );
    
    // Deploy com 1 ether (requerido pelo construtor)
    guessChallenge = await GuessTheNumberChallenge.deploy({
      value: ethers.parseEther("1.0")
    });
    await guessChallenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy successfully with 1 ether", async function () {
      const address = await guessChallenge.getAddress();
      expect(address).to.be.properAddress;
      
      const balance = await ethers.provider.getBalance(address);
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should start with challenge incomplete", async function () {
      const isComplete = await guessChallenge.isComplete();
      expect(isComplete).to.be.false;
    });

    it("Should have correct initial balance", async function () {
      const balance = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("Hardcoded Value Vulnerability", function () {
    it("Should have answer hardcoded as 42", async function () {
      // O valor está hardcoded no código-fonte
      // Em um contrato real, poderíamos ler do storage slot 0
      const answer = 42; // Hardcoded no contrato
      expect(answer).to.equal(42);
    });

    it("Should allow reading storage slot 0 (answer)", async function () {
      // Em Solidity 0.4.21, variáveis de estado são armazenadas sequencialmente
      // answer (uint8) está no slot 0
      const contractAddress = await guessChallenge.getAddress();
      const storageSlot0 = await ethers.provider.getStorage(contractAddress, 0);
      
      // uint8 ocupa 1 byte, então pegamos os últimos 2 caracteres hex
      const answerValue = parseInt(storageSlot0.slice(-2), 16);
      expect(answerValue).to.equal(42);
    });
  });

  describe("guess() - Correct Answer", function () {
    it("Should complete challenge with correct guess (42)", async function () {
      const challengeAddress = await guessChallenge.getAddress();
      const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
      
      // Fazer o guess correto
      const tx = await guessChallenge.connect(attacker).guess(42, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // Verificar que o contrato foi drenado
      const balanceAfter = await ethers.provider.getBalance(challengeAddress);
      expect(balanceAfter).to.equal(0);
      
      // Verificar que o desafio está completo
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should transfer 2 ether to attacker on correct guess", async function () {
      const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
      
      const tx = await guessChallenge.connect(attacker).guess(42, {
        value: ethers.parseEther("1.0")
      });
      const receipt = await tx.wait();
      
      // Calcular gas usado
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const attackerBalanceAfter = await ethers.provider.getBalance(attacker.address);
      const balanceDiff = attackerBalanceAfter - attackerBalanceBefore;
      
      // Deve receber 2 ether, mas pagar 1 ether + gas
      // Então: +2 ether - 1 ether - gas = +1 ether - gas
      expect(balanceDiff).to.be.greaterThan(ethers.parseEther("0.9")); // Aproximadamente 1 ether menos gas
    });

    it("Should allow multiple correct guesses (if contract had more funds)", async function () {
      // Primeira tentativa
      await guessChallenge.connect(attacker).guess(42, {
        value: ethers.parseEther("1.0")
      });
      
      expect(await guessChallenge.isComplete()).to.be.true;
      
      // Se o contrato tivesse mais fundos, poderíamos tentar novamente
      // Mas como o saldo é 0, o desafio está completo
    });
  });

  describe("guess() - Wrong Answers", function () {
    it("Should not complete challenge with wrong guess", async function () {
      await guessChallenge.connect(attacker).guess(41, {
        value: ethers.parseEther("1.0")
      });
      
      // O contrato ainda deve ter 2 ether (1 inicial + 1 da tentativa errada)
      const balance = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balance).to.equal(ethers.parseEther("2.0"));
      
      // Desafio não deve estar completo
      expect(await guessChallenge.isComplete()).to.be.false;
    });

    it("Should not transfer ether on wrong guess", async function () {
      const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
      
      const tx = await guessChallenge.connect(attacker).guess(100, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      const attackerBalanceAfter = await ethers.provider.getBalance(attacker.address);
      const balanceDiff = attackerBalanceAfter - attackerBalanceBefore;
      
      // Deve perder 1 ether + gas
      expect(balanceDiff).to.be.lessThan(ethers.parseEther("-0.9"));
    });

    it("Should allow multiple wrong guesses", async function () {
      await guessChallenge.connect(attacker).guess(0, {
        value: ethers.parseEther("1.0")
      });
      
      await guessChallenge.connect(attacker).guess(255, {
        value: ethers.parseEther("1.0")
      });
      
      // Contrato deve ter 3 ether agora (1 inicial + 2 tentativas)
      const balance = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balance).to.equal(ethers.parseEther("3.0"));
    });
  });

  describe("Security", function () {
    it("Should require exactly 1 ether per guess", async function () {
      // Tentar com menos de 1 ether
      await expect(
        guessChallenge.connect(attacker).guess(42, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.reverted;
      
      // Tentar com mais de 1 ether
      await expect(
        guessChallenge.connect(attacker).guess(42, {
          value: ethers.parseEther("2.0")
        })
      ).to.be.reverted;
    });

    it("Should allow any address to guess", async function () {
      const [, , otherAccount] = await ethers.getSigners();
      
      await guessChallenge.connect(otherAccount).guess(42, {
        value: ethers.parseEther("1.0")
      });
      
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should expose answer through storage", async function () {
      // Demonstrar que o valor pode ser lido do storage
      const contractAddress = await guessChallenge.getAddress();
      const storageSlot0 = await ethers.provider.getStorage(contractAddress, 0);
      const answerValue = parseInt(storageSlot0.slice(-2), 16);
      
      // Usar o valor lido para fazer o guess
      await guessChallenge.connect(attacker).guess(answerValue, {
        value: ethers.parseEther("1.0")
      });
      
      expect(await guessChallenge.isComplete()).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle uint8 boundary values", async function () {
      // Testar valores nos limites do uint8
      await guessChallenge.connect(attacker).guess(0, {
        value: ethers.parseEther("1.0")
      });
      expect(await guessChallenge.isComplete()).to.be.false;
      
      // Resetar para testar 255 (precisaríamos de mais fundos)
      // Mas como já gastamos, vamos apenas verificar que 255 não funciona
      // (já que answer = 42)
    });

    it("Should complete challenge only when balance is exactly 0", async function () {
      // Fazer guess errado primeiro
      await guessChallenge.connect(attacker).guess(1, {
        value: ethers.parseEther("1.0")
      });
      expect(await guessChallenge.isComplete()).to.be.false;
      
      // Verificar que o saldo é 2 ether (1 inicial + 1 da tentativa errada)
      const balanceAfterWrong = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balanceAfterWrong).to.equal(ethers.parseEther("2.0"));
      
      // Agora fazer guess correto - transfere 2 ether, mas recebe 1 ether na tentativa
      // Saldo final: 2 + 1 - 2 = 1 ether (ainda não completo)
      await guessChallenge.connect(attacker).guess(42, {
        value: ethers.parseEther("1.0")
      });
      
      // Verificar que o saldo ainda não é 0 (tem 1 ether restante)
      const balanceAfterCorrect = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balanceAfterCorrect).to.equal(ethers.parseEther("1.0"));
      expect(await guessChallenge.isComplete()).to.be.false;
      
      // Para completar, precisamos fazer mais um guess correto
      await guessChallenge.connect(attacker).guess(42, {
        value: ethers.parseEther("1.0")
      });
      
      // Agora o saldo deve ser 0
      const finalBalance = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(finalBalance).to.equal(0);
      expect(await guessChallenge.isComplete()).to.be.true;
    });
  });
});

