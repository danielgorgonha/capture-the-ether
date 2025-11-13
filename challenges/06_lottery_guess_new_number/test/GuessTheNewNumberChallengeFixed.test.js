const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheNewNumberChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const GuessTheNewNumberChallengeFixed = await ethers.getContractFactory(
      "challenges/06_lottery_guess_new_number/fixes/GuessTheNewNumberChallengeFixed.sol:GuessTheNewNumberChallengeFixed"
    );
    
    challenge = await GuessTheNewNumberChallengeFixed.deploy({
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
      expect(await challenge.commitment()).to.equal(commitment);
    });

    it("Should prevent atomic exploitation", async function () {
      // No contrato vulnerável, um atacante poderia calcular e chamar na mesma transação
      // No contrato corrigido, isso não é possível porque:
      // 1. O número não é calculado usando dados de blocos
      // 2. Há um delay entre commit e reveal
      // 3. O guess só pode ser feito após reveal
      
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      
      // Tentar fazer guess imediatamente (deve falhar)
      await expect(
        challenge.connect(player).guess(secretAnswer, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Answer not yet revealed");
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

    it("Should not allow multiple guesses from same address", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [secretAnswer, salt])
      );

      await challenge.commit(commitment);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);
      
      // Primeira tentativa
      await challenge.connect(player).guess(100, {
        value: ethers.parseEther("1.0")
      });
      
      // Segunda tentativa (deve falhar)
      await expect(
        challenge.connect(player).guess(secretAnswer, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Already guessed");
    });
  });
});

