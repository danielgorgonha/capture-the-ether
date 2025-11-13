const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheSecretNumberChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const GuessTheSecretNumberChallengeFixed = await ethers.getContractFactory(
      "challenges/04_lottery_guess_secret_number/fixes/GuessTheSecretNumberChallengeFixed.sol:GuessTheSecretNumberChallengeFixed"
    );
    
    challenge = await GuessTheSecretNumberChallengeFixed.deploy({
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
      expect(await challenge.answerHash()).to.equal(ethers.ZeroHash);
    });
  });

  describe("setAnswerHash", function () {
    it("Should allow setting answer hash", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);
      
      expect(await challenge.answerHash()).to.equal(hash);
    });

    it("Should not allow setting hash twice", async function () {
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [170])
      );

      await challenge.setAnswerHash(hash);
      
      await expect(
        challenge.setAnswerHash(hash)
      ).to.be.revertedWith("Hash already set");
    });
  });

  describe("Rate Limiting", function () {
    it("Should enforce max attempts per address", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      // Fazer 10 tentativas (máximo permitido)
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_increaseTime", [3601]); // 1 hora + 1 segundo
        await ethers.provider.send("evm_mine", []);
        
        await challenge.connect(player).guess(i, {
          value: ethers.parseEther("0.1")
        });
      }

      // 11ª tentativa deve falhar
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        challenge.connect(player).guess(100, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWith("Max attempts reached");
    });

    it("Should enforce cooldown period", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      // Primeira tentativa
      await challenge.connect(player).guess(100, {
        value: ethers.parseEther("0.1")
      });

      // Tentar novamente imediatamente (deve falhar)
      await expect(
        challenge.connect(player).guess(100, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWith("Cooldown period not elapsed");

      // Após cooldown, deve funcionar
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hora + 1 segundo
      await ethers.provider.send("evm_mine", []);

      await challenge.connect(player).guess(100, {
        value: ethers.parseEther("0.1")
      });
    });
  });

  describe("guess() - Correct Answer", function () {
    it("Should complete challenge with correct guess", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      // Fazer guess correto
      await challenge.connect(player).guess(secretNumber, {
        value: ethers.parseEther("0.1")
      });

      expect(await challenge.isComplete()).to.be.true;
      expect(await challenge.challengeComplete()).to.be.true;
    });

    it("Should transfer all balance on correct guess", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      const balanceBefore = await ethers.provider.getBalance(player.address);
      
      const tx = await challenge.connect(player).guess(secretNumber, {
        value: ethers.parseEther("0.1")
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player.address);
      const balanceDiff = balanceAfter - balanceBefore;

      // Deve receber ~1.1 ether (1 inicial + 0.1 da tentativa), menos gas
      // Considerando gas, o valor deve ser positivo (recebeu mais do que pagou)
      expect(balanceDiff).to.be.greaterThan(ethers.parseEther("0.9"));
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent brute force with uint256", async function () {
      // uint256 tem 2^256 valores possíveis
      // Brute force é impraticável
      const secretNumber = ethers.MaxUint256; // Número muito grande
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      // Tentar adivinhar é praticamente impossível
      // Mas podemos testar que o sistema funciona
      await challenge.connect(player).guess(100, {
        value: ethers.parseEther("0.1")
      });

      expect(await challenge.isComplete()).to.be.false;
    });

    it("Should track attempts correctly", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      // Fazer 3 tentativas
      for (let i = 0; i < 3; i++) {
        await ethers.provider.send("evm_increaseTime", [3601]);
        await ethers.provider.send("evm_mine", []);
        
        await challenge.connect(player).guess(i, {
          value: ethers.parseEther("0.1")
        });
      }

      expect(await challenge.attempts(player.address)).to.equal(3);
    });

    it("Should allow different addresses to attempt", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      // Player faz tentativa
      await challenge.connect(player).guess(100, {
        value: ethers.parseEther("0.1")
      });

      // Attacker pode fazer tentativa (rate limit é por endereço)
      await challenge.connect(attacker).guess(100, {
        value: ethers.parseEther("0.1")
      });

      expect(await challenge.attempts(player.address)).to.equal(1);
      expect(await challenge.attempts(attacker.address)).to.equal(1);
    });
  });

  describe("getPlayerInfo", function () {
    it("Should return correct player information", async function () {
      const secretNumber = 170;
      const hash = ethers.keccak256(
        ethers.solidityPacked(["uint256"], [secretNumber])
      );

      await challenge.setAnswerHash(hash);

      // Fazer tentativa
      await challenge.connect(player).guess(100, {
        value: ethers.parseEther("0.1")
      });

      const info = await challenge.getPlayerInfo(player.address);
      expect(info.playerAttempts).to.equal(1);
      expect(info.playerLastAttempt).to.be.greaterThan(0);
      expect(info.canAttempt).to.be.false; // Cooldown ativo
    });
  });
});

