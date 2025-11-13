const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheSecretNumberChallenge", function () {
  let guessChallenge;
  let deployer;
  let attacker;

  beforeEach(async function () {
    [deployer, attacker] = await ethers.getSigners();
    
    const GuessTheSecretNumberChallenge = await ethers.getContractFactory(
      "challenges/04_lottery_guess_secret_number/contracts/GuessTheSecretNumberChallenge.sol:GuessTheSecretNumberChallenge"
    );
    
    // Deploy com 1 ether (requerido pelo construtor)
    guessChallenge = await GuessTheSecretNumberChallenge.deploy({
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
  });

  describe("Brute Force Attack", function () {
    it("Should find secret number via brute force", async function () {
      const answerHash = "0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365";
      
      let secretNumber = null;
      const startTime = Date.now();
      
      // Brute force: testar todos os valores de 0 a 255
      for (let i = 0; i <= 255; i++) {
        // Em Solidity 0.4.21, keccak256(uint8) faz hash do valor como um único byte
        const byteValue = Buffer.from([i]);
        const hash = ethers.keccak256(byteValue);
        
        if (hash.toLowerCase() === answerHash.toLowerCase()) {
          secretNumber = i;
          break;
        }
      }
      
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      
      expect(secretNumber).to.not.be.null;
      expect(secretNumber).to.equal(170); // Número secreto conhecido
      expect(timeTaken).to.be.lessThan(1000); // Deve ser rápido (< 1 segundo)
    });

    it("Should complete challenge with brute force found number", async function () {
      const answerHash = "0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365";
      
      // Encontrar o número via brute force
      let secretNumber = null;
      for (let i = 0; i <= 255; i++) {
        const byteValue = Buffer.from([i]);
        const hash = ethers.keccak256(byteValue);
        if (hash.toLowerCase() === answerHash.toLowerCase()) {
          secretNumber = i;
          break;
        }
      }
      
      expect(secretNumber).to.equal(170);
      
      // Fazer o guess com o número encontrado
      const tx = await guessChallenge.connect(attacker).guess(secretNumber, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // Verificar que o contrato foi drenado
      const balance = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balance).to.equal(0);
      
      // Verificar que o desafio está completo
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should demonstrate that uint8 space is too small", async function () {
      // Demonstrar que o espaço de busca é pequeno (apenas 256 valores)
      let testedValues = 0;
      
      for (let i = 0; i <= 255; i++) {
        testedValues++;
      }
      
      expect(testedValues).to.equal(256);
      expect(testedValues).to.be.lessThan(1000); // Muito pequeno para ser seguro
    });

    it("Should find the number quickly (performance test)", async function () {
      const answerHash = "0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365";
      
      const startTime = Date.now();
      let secretNumber = null;
      
      for (let i = 0; i <= 255; i++) {
        const byteValue = Buffer.from([i]);
        const hash = ethers.keccak256(byteValue);
        if (hash.toLowerCase() === answerHash.toLowerCase()) {
          secretNumber = i;
          break;
        }
      }
      
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      
      expect(secretNumber).to.equal(170);
      expect(timeTaken).to.be.lessThan(100); // Deve ser muito rápido (< 100ms)
    });
  });

  describe("guess() - Correct Answer", function () {
    it("Should complete challenge with correct guess (170)", async function () {
      const challengeAddress = await guessChallenge.getAddress();
      
      // Fazer o guess correto (número encontrado via brute force)
      const tx = await guessChallenge.connect(attacker).guess(170, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // Verificar que o contrato foi drenado
      const balance = await ethers.provider.getBalance(challengeAddress);
      expect(balance).to.equal(0);
      
      // Verificar que o desafio está completo
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should transfer 2 ether to attacker on correct guess", async function () {
      const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
      
      const tx = await guessChallenge.connect(attacker).guess(170, {
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
  });

  describe("guess() - Wrong Answers", function () {
    it("Should not complete challenge with wrong guess", async function () {
      await guessChallenge.connect(attacker).guess(100, {
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
  });

  describe("Security - Hash Analysis", function () {
    it("Should verify that keccak256 is cryptographically secure", async function () {
      // Verificar que o hash é criptograficamente seguro
      const testValue1 = Buffer.from([170]);
      const testValue2 = Buffer.from([171]);
      
      const hash1 = ethers.keccak256(testValue1);
      const hash2 = ethers.keccak256(testValue2);
      
      // Hashes devem ser diferentes mesmo para valores próximos
      expect(hash1).to.not.equal(hash2);
      
      // Hash deve ter 66 caracteres (0x + 64 hex chars)
      expect(hash1.length).to.equal(66);
    });

    it("Should demonstrate that hash doesn't protect small search space", async function () {
      // O hash é seguro, mas o espaço de busca é pequeno
      const answerHash = "0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365";
      
      // Podemos testar todos os valores rapidamente
      let found = false;
      for (let i = 0; i <= 255; i++) {
        const byteValue = Buffer.from([i]);
        const hash = ethers.keccak256(byteValue);
        if (hash.toLowerCase() === answerHash.toLowerCase()) {
          found = true;
          break;
        }
      }
      
      expect(found).to.be.true; // Sempre encontra porque espaço é pequeno
    });
  });

  describe("Edge Cases", function () {
    it("Should handle uint8 boundary values", async function () {
      // Testar valores nos limites do uint8
      await guessChallenge.connect(attacker).guess(0, {
        value: ethers.parseEther("1.0")
      });
      expect(await guessChallenge.isComplete()).to.be.false;
      
      await guessChallenge.connect(attacker).guess(255, {
        value: ethers.parseEther("1.0")
      });
      expect(await guessChallenge.isComplete()).to.be.false;
    });

    it("Should verify that only correct hash matches", async function () {
      const answerHash = "0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365";
      
      // Verificar que apenas o número 170 produz o hash correto
      for (let i = 0; i <= 255; i++) {
        const byteValue = Buffer.from([i]);
        const hash = ethers.keccak256(byteValue);
        if (hash.toLowerCase() === answerHash.toLowerCase()) {
          expect(i).to.equal(170); // Apenas 170 deve match
        }
      }
    });
  });
});

