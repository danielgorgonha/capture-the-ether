const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSaleChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const TokenSaleChallengeFixed = await ethers.getContractFactory(
      "challenges/09_math_token_sale/fixes/TokenSaleChallengeFixed.sol:TokenSaleChallengeFixed"
    );
    
    challenge = await TokenSaleChallengeFixed.deploy({
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
    });
  });

  describe("Buy Function", function () {
    it("Should allow buying tokens with correct payment", async function () {
      const numTokens = 10n;
      const totalCost = numTokens * ethers.parseEther("1.0");
      
      await challenge.connect(player).buy(numTokens, {
        value: totalCost
      });

      expect(await challenge.balanceOf(player.address)).to.equal(numTokens);
    });

    it("Should revert on overflow attempt", async function () {
      // Tentar causar overflow
      const MAX_UINT256 = ethers.MaxUint256;
      const PRICE_PER_TOKEN = ethers.parseEther("1.0");
      const numTokens = (MAX_UINT256 / PRICE_PER_TOKEN) + 1n;
      
      // Calcular o valor que seria enviado (com overflow)
      const expectedValue = (numTokens * PRICE_PER_TOKEN) % (MAX_UINT256 + 1n);

      // Deve reverter porque Solidity 0.8.20 previne overflow
      await expect(
        challenge.connect(player).buy(numTokens, {
          value: expectedValue
        })
      ).to.be.reverted;
    });

    it("Should revert if payment is incorrect", async function () {
      await expect(
        challenge.connect(player).buy(10n, {
          value: ethers.parseEther("5.0") // Pagamento incorreto
        })
      ).to.be.revertedWith("Incorrect payment");
    });
  });

  describe("Sell Function", function () {
    it("Should allow selling tokens", async function () {
      const numTokens = 10n;
      const totalCost = numTokens * ethers.parseEther("1.0");
      
      await challenge.connect(player).buy(numTokens, {
        value: totalCost
      });

      const balanceBefore = await ethers.provider.getBalance(player.address);
      
      const tx = await challenge.connect(player).sell(5n);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player.address);
      
      expect(await challenge.balanceOf(player.address)).to.equal(5n);
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed + ethers.parseEther("5.0") - ethers.parseEther("0.01"));
    });

    it("Should revert if insufficient balance", async function () {
      await expect(
        challenge.connect(player).sell(10n)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent integer overflow in buy", async function () {
      // Tentar valores que causariam overflow em Solidity 0.4.21
      const largeNumTokens = ethers.MaxUint256;
      
      await expect(
        challenge.connect(player).buy(largeNumTokens, {
          value: ethers.parseEther("1.0")
        })
      ).to.be.reverted;
    });

    it("Should prevent integer underflow in sell", async function () {
      // Tentar vender mais do que tem
      await challenge.connect(player).buy(5n, {
        value: ethers.parseEther("5.0")
      });

      await expect(
        challenge.connect(player).sell(10n)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});

