const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheNumberChallengeFixed (Commit-Reveal)", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const GuessTheNumberChallengeSimpleFixed = await ethers.getContractFactory(
      "challenges/03_lottery_guess_number/fixes/GuessTheNumberChallengeSimpleFixed.sol:GuessTheNumberChallengeSimpleFixed"
    );
    
    challenge = await GuessTheNumberChallengeSimpleFixed.deploy({
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
      // Gerar número secreto e salt
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
      );

      await challenge.commit(commitment);
      
      expect(await challenge.commitment()).to.equal(commitment);
    });

    it("Should not allow reveal before deadline", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
      );

      await challenge.commit(commitment);
      
      // Tentar revelar imediatamente (deve falhar)
      await expect(
        challenge.reveal(secretAnswer, salt)
      ).to.be.revertedWith("Too early to reveal");
    });

    it("Should allow reveal after deadline", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
      );

      await challenge.commit(commitment);
      
      // Avançar tempo
      await ethers.provider.send("evm_increaseTime", [86401]); // 1 dia + 1 segundo
      await ethers.provider.send("evm_mine", []);
      
      await challenge.reveal(secretAnswer, salt);
      
      expect(await challenge.revealed()).to.be.true;
      expect(await challenge.answer()).to.equal(secretAnswer);
    });

    it("Should reject invalid reveal", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
      );

      await challenge.commit(commitment);
      
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      
      // Tentar revelar com número errado
      await expect(
        challenge.reveal(100, salt)
      ).to.be.revertedWith("Invalid answer or salt");
    });
  });

  describe("Guess with Fixed Contract", function () {
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
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
      );

      // Commit
      await challenge.commit(commitment);
      
      // Avançar tempo e revelar
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);
      
      // Fazer guess correto
      await challenge.connect(player).guess(secretAnswer, {
        value: ethers.parseEther("1.0")
      });
      
      expect(await challenge.isComplete()).to.be.true;
      expect(await challenge.challengeComplete()).to.be.true;
    });

    it("Should not allow multiple guesses from same address", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
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

    it("Should not allow guess after challenge completed", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
      );

      await challenge.commit(commitment);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await challenge.reveal(secretAnswer, salt);
      
      // Completar o desafio
      await challenge.connect(player).guess(secretAnswer, {
        value: ethers.parseEther("1.0")
      });
      
      // Tentar adivinhar novamente (deve falhar)
      await expect(
        challenge.connect(attacker).guess(secretAnswer, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("Challenge already completed");
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent reading hardcoded value", async function () {
      // Não há mais valor hardcoded
      // O answer só é definido após reveal
      expect(await challenge.answer()).to.equal(0);
      expect(await challenge.revealed()).to.be.false;
    });

    it("Should require proper commit-reveal flow", async function () {
      // Sem commit, não pode revelar
      const salt = ethers.hexlify(ethers.randomBytes(32));
      await expect(
        challenge.reveal(42, salt)
      ).to.be.revertedWith("No commitment made");
    });

    it("Should emit events for transparency", async function () {
      const secretAnswer = 42;
      const salt = ethers.hexlify(ethers.randomBytes(32));
      // Usar solidityPacked para simular abi.encodePacked
      const commitment = ethers.keccak256(
        ethers.solidityPacked(
          ["uint8", "bytes32"],
          [secretAnswer, salt]
        )
      );

      // Verificar eventos
      await expect(challenge.commit(commitment))
        .to.emit(challenge, "CommitmentMade")
        .withArgs(commitment);
    });
  });
});

