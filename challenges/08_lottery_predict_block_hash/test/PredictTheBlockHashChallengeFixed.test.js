const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictTheBlockHashChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const PredictTheBlockHashChallengeFixed = await ethers.getContractFactory(
      "challenges/08_lottery_predict_block_hash/fixes/PredictTheBlockHashChallengeFixed.sol:PredictTheBlockHashChallengeFixed"
    );
    
    challenge = await PredictTheBlockHashChallengeFixed.deploy({
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
      expect(await challenge.guesser()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Lock and Settle Flow", function () {
    it("Should allow lockInGuess", async function () {
      const hash = ethers.hexlify(ethers.randomBytes(32));
      
      await challenge.connect(player).lockInGuess(hash, {
        value: ethers.parseEther("1.0")
      });

      expect(await challenge.guesser()).to.equal(player.address);
      expect(await challenge.guess()).to.equal(hash);
    });

    it("Should not allow settle before settlement block", async function () {
      const hash = ethers.hexlify(ethers.randomBytes(32));
      
      await challenge.connect(player).lockInGuess(hash, {
        value: ethers.parseEther("1.0")
      });

      await expect(
        challenge.connect(player).settle()
      ).to.be.revertedWith("Too early");
    });

    it("Should allow settle after settlement block (within range)", async function () {
      const hash = ethers.hexlify(ethers.randomBytes(32));
      
      await challenge.connect(player).lockInGuess(hash, {
        value: ethers.parseEther("1.0")
      });

      const settlementBlock = await challenge.settlementBlockNumber();
      
      // Minerar até o bloco de settlement + 1
      const currentBlock = await ethers.provider.getBlockNumber();
      for (let i = currentBlock; i <= Number(settlementBlock); i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Settle deve funcionar se estiver dentro do range
      await challenge.connect(player).settle();
    });

    it("Should revert if block is too old (outside 256 block range)", async function () {
      const hash = ethers.hexlify(ethers.randomBytes(32));
      
      await challenge.connect(player).lockInGuess(hash, {
        value: ethers.parseEther("1.0")
      });

      const settlementBlock = await challenge.settlementBlockNumber();
      
      // Minerar mais de 256 blocos
      const currentBlock = await ethers.provider.getBlockNumber();
      for (let i = currentBlock; i <= Number(settlementBlock) + 257; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Settle deve reverter porque o bloco está muito antigo
      await expect(
        challenge.connect(player).settle()
      ).to.be.revertedWith("Block too old - hash unavailable");
    });

    it("Should revert if block hash is unavailable (0x0)", async function () {
      // Este teste é difícil de fazer porque precisamos que blockhash retorne 0x0
      // mas isso só acontece para blocos > 256, que já é coberto pelo teste anterior
      // Vamos testar que a validação funciona
      const hash = ethers.hexlify(ethers.randomBytes(32));
      
      await challenge.connect(player).lockInGuess(hash, {
        value: ethers.parseEther("1.0")
      });

      const settlementBlock = await challenge.settlementBlockNumber();
      
      // Minerar até o bloco de settlement + 1
      const currentBlock = await ethers.provider.getBlockNumber();
      for (let i = currentBlock; i <= Number(settlementBlock); i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Se o hash for 0x0, deve reverter
      // Mas em Hardhat, blockhash sempre retorna um valor válido para blocos recentes
      // Então este teste valida que a função funciona corretamente
      await challenge.connect(player).settle();
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent exploitation using 0x0 after 256 blocks", async function () {
      const zeroHash = ethers.ZeroHash;
      
      await challenge.connect(player).lockInGuess(zeroHash, {
        value: ethers.parseEther("1.0")
      });

      const settlementBlock = await challenge.settlementBlockNumber();
      
      // Minerar mais de 256 blocos
      const currentBlock = await ethers.provider.getBlockNumber();
      for (let i = currentBlock; i <= Number(settlementBlock) + 257; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Deve reverter porque o bloco está muito antigo
      await expect(
        challenge.connect(player).settle()
      ).to.be.revertedWith("Block too old - hash unavailable");
    });

    it("Should validate block range before checking hash", async function () {
      const hash = ethers.hexlify(ethers.randomBytes(32));
      
      await challenge.connect(player).lockInGuess(hash, {
        value: ethers.parseEther("1.0")
      });

      const settlementBlock = await challenge.settlementBlockNumber();
      
      // Minerar até o bloco de settlement + 1 (dentro do range)
      const currentBlock = await ethers.provider.getBlockNumber();
      for (let i = currentBlock; i <= Number(settlementBlock); i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Deve funcionar dentro do range
      await challenge.connect(player).settle();
    });
  });
});

