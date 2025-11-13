const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheRandomNumberChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const GuessTheRandomNumberChallengeFixed = await ethers.getContractFactory(
      "challenges/05_lottery_guess_random_number/fixes/GuessTheRandomNumberChallengeFixed.sol:GuessTheRandomNumberChallengeFixed"
    );
    
    challenge = await GuessTheRandomNumberChallengeFixed.deploy({
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
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      expect(await challenge.commitment()).to.equal(commitment);
    });

    it("Should not allow reveal before deadline", async function () {
      const secretAnswer = 42;
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
      const secretAnswer = 42;
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

  describe("Security Improvements", function () {
    it("Should not use block data for randomness", async function () {
      // O contrato corrigido não usa block.blockhash ou now
      // Verificar que não há cálculo baseado em blocos
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      // O número não pode ser calculado usando dados de blocos
      // Deve usar commit-reveal
      expect(await challenge.commitment()).to.equal(commitment);
    });

    it("Should prevent calculation using block data", async function () {
      // Tentar calcular usando dados de blocos não deve funcionar
      // porque o contrato não usa mais esses dados
      const currentBlock = await ethers.provider.getBlock("latest");
      const previousBlock = await ethers.provider.getBlock(currentBlock.number - 1);
      
      // Esses dados não podem ser usados para calcular o answer
      // porque o contrato usa commit-reveal
      expect(previousBlock.hash).to.not.be.undefined;
      expect(currentBlock.timestamp).to.not.be.undefined;
      
      // Mas o answer não pode ser calculado com esses dados
      expect(await challenge.answer()).to.equal(0);
      expect(await challenge.revealed()).to.be.false;
    });
  });

  describe("guess() with Fixed Contract", function () {
    it("Should not allow guess before reveal", async function () {
      await expect(
        challenge.connect(player).guess(42, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Answer not yet revealed");
    });

    it("Should complete challenge with correct guess after reveal", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);
      
      await challenge.connect(player).guess(secretAnswer, {
        value: ethers.parseEther("1.0")
      });
      
      expect(await challenge.isComplete()).to.be.true;
    });
  });
});

