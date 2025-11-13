const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenWhaleChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const TokenWhaleChallengeFixed = await ethers.getContractFactory(
      "challenges/10_math_token_whale/fixes/TokenWhaleChallengeFixed.sol:TokenWhaleChallengeFixed"
    );
    
    challenge = await TokenWhaleChallengeFixed.deploy(player.address);
    await challenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy successfully", async function () {
      const address = await challenge.getAddress();
      expect(address).to.be.properAddress;
      
      expect(await challenge.totalSupply()).to.equal(1000n);
      expect(await challenge.balanceOf(player.address)).to.equal(1000n);
    });

    it("Should start with challenge incomplete", async function () {
      expect(await challenge.isComplete()).to.be.false;
    });
  });

  describe("Transfer Function", function () {
    it("Should allow transfer from player to attacker", async function () {
      await challenge.connect(player).transfer(attacker.address, 100n);
      
      expect(await challenge.balanceOf(player.address)).to.equal(900n);
      expect(await challenge.balanceOf(attacker.address)).to.equal(100n);
    });

    it("Should revert if insufficient balance", async function () {
      await expect(
        challenge.connect(player).transfer(attacker.address, 2000n)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("TransferFrom Function", function () {
    it("Should allow transferFrom with correct allowance", async function () {
      await challenge.connect(player).approve(attacker.address, 100n);
      
      await challenge.connect(attacker).transferFrom(player.address, attacker.address, 100n);
      
      expect(await challenge.balanceOf(player.address)).to.equal(900n);
      expect(await challenge.balanceOf(attacker.address)).to.equal(100n);
      expect(await challenge.allowance(player.address, attacker.address)).to.equal(0n);
    });

    it("Should correctly subtract from 'from' address, not msg.sender", async function () {
      // No contrato vulnerável, transferFrom subtraía de msg.sender (attacker)
      // No contrato corrigido, subtrai de 'from' (player)
      await challenge.connect(player).approve(attacker.address, 100n);
      
      const playerBalanceBefore = await challenge.balanceOf(player.address);
      const attackerBalanceBefore = await challenge.balanceOf(attacker.address);
      
      await challenge.connect(attacker).transferFrom(player.address, attacker.address, 100n);
      
      const playerBalanceAfter = await challenge.balanceOf(player.address);
      const attackerBalanceAfter = await challenge.balanceOf(attacker.address);
      
      // Player perde tokens
      expect(playerBalanceAfter).to.equal(playerBalanceBefore - 100n);
      // Attacker ganha tokens
      expect(attackerBalanceAfter).to.equal(attackerBalanceBefore + 100n);
      // Attacker não perde tokens (bug corrigido)
      expect(attackerBalanceAfter).to.be.greaterThan(0n);
    });

    it("Should revert if insufficient allowance", async function () {
      await challenge.connect(player).approve(attacker.address, 50n);
      
      await expect(
        challenge.connect(attacker).transferFrom(player.address, attacker.address, 100n)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should revert if insufficient balance in 'from'", async function () {
      await challenge.connect(player).approve(attacker.address, 2000n);
      
      await expect(
        challenge.connect(attacker).transferFrom(player.address, attacker.address, 2000n)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent integer underflow in _transfer", async function () {
      // Tentar transferir mais do que tem deve reverter
      await expect(
        challenge.connect(player).transfer(attacker.address, 2000n)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should prevent exploitation via transferFrom with wrong sender", async function () {
      // No contrato vulnerável, transferFrom(player, player, 1) com attacker como msg.sender
      // causava underflow em balanceOf[attacker]
      // No contrato corrigido, isso não é mais possível
      await challenge.connect(player).approve(attacker.address, 1n);
      
      // Tentar transferFrom deve funcionar corretamente
      await challenge.connect(attacker).transferFrom(player.address, player.address, 1n);
      
      // Player não deve ter mais tokens (foi transferido de player para player)
      // Mas o saldo deve ser o mesmo (1000 - 1 + 1 = 1000)
      expect(await challenge.balanceOf(player.address)).to.equal(1000n);
      // Attacker não deve ter tokens (bug corrigido)
      expect(await challenge.balanceOf(attacker.address)).to.equal(0n);
    });
  });
});

