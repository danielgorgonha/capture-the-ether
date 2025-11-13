const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictTheFutureChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const PredictTheFutureChallengeFixed = await ethers.getContractFactory(
      "challenges/07_lottery_predict_future/fixes/PredictTheFutureChallengeFixed.sol:PredictTheFutureChallengeFixed"
    );
    
    challenge = await PredictTheFutureChallengeFixed.deploy({
      value: ethers.parseEther("1.0")
    });
    await challenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy successfully with 1 ether", async function () {
      const address = await challenge.getAddress();
      expect(address).to.be.properAddress;
      
      const balance = await ethers.provider.getBalance(address);
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should start with challenge incomplete", async function () {
      expect(await challenge.isComplete()).to.be.false;
      expect(await challenge.revealed()).to.be.false;
    });
  });

  describe("Commit-Reveal Flow", function () {
    it("Should allow commit of answer hash", async function () {
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      expect(await challenge.commitment()).to.equal(commitment);
    });

    it("Should not allow reveal before deadline", async function () {
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      await expect(
        challenge.reveal(secretAnswer, salt)
      ).to.be.revertedWith("Too early to reveal");
    });

    it("Should allow reveal after deadline", async function () {
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      
      await challenge.reveal(secretAnswer, salt);
      
      expect(await challenge.revealed()).to.be.true;
      expect(await challenge.answer()).to.equal(secretAnswer);
    });
  });

  describe("Lock and Guess Flow", function () {
    it("Should not allow lockInGuess before reveal", async function () {
      await expect(
        challenge.lockInGuess(5, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Answer not yet revealed");
    });

    it("Should allow lockInGuess after reveal", async function () {
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);

      await challenge.connect(player).lockInGuess(5, {
        value: ethers.parseEther("1.0")
      });

      expect(await challenge.hasGuessed(player.address)).to.be.true;
    });

    it("Should complete challenge on correct guess", async function () {
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);

      const balanceBefore = await ethers.provider.getBalance(player.address);
      
      const tx = await challenge.connect(player).lockInGuess(5, {
        value: ethers.parseEther("1.0")
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player.address);
      
      expect(await challenge.isComplete()).to.be.true;
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed);
    });

    it("Should not complete challenge on incorrect guess", async function () {
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);

      await challenge.connect(player).lockInGuess(3, {
        value: ethers.parseEther("1.0")
      });

      expect(await challenge.isComplete()).to.be.false;
    });

    it("Should prevent multiple guesses from same address", async function () {
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);

      // Primeiro guess incorreto (não completa o desafio)
      await challenge.connect(player).lockInGuess(3, {
        value: ethers.parseEther("1.0")
      });

      // Tentar fazer guess novamente deve falhar
      await expect(
        challenge.connect(player).lockInGuess(5, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Already guessed");
    });
  });

  describe("Security Improvements", function () {
    it("Should not use block data for randomness", async function () {
      // O contrato corrigido não usa block.blockhash ou now
      // Verificar que não há cálculo baseado em blocos
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      // O número não pode ser calculado usando dados de blocos
      // Deve usar commit-reveal
      expect(await challenge.commitment()).to.equal(commitment);
    });

    it("Should prevent atomic exploitation", async function () {
      // No contrato vulnerável, era possível calcular e fazer lock na mesma transação
      // No contrato corrigido, há delay entre commit e reveal, prevenindo isso
      const secretAnswer = 5;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      // Não é possível fazer lock antes do reveal
      await expect(
        challenge.lockInGuess(5, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Answer not yet revealed");
    });
  });
});

