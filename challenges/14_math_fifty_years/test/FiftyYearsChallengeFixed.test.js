const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FiftyYearsChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const FiftyYearsChallengeFixed = await ethers.getContractFactory(
      "challenges/14_math_fifty_years/fixes/FiftyYearsChallengeFixed.sol:FiftyYearsChallengeFixed"
    );
    
    challenge = await FiftyYearsChallengeFixed.deploy(player.address, {
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
      
      expect(await challenge.owner()).to.equal(player.address);
      expect(await challenge.contributionCount()).to.equal(1n);
    });

    it("Should start with challenge incomplete", async function () {
      expect(await challenge.isComplete()).to.be.false;
    });
  });

  describe("Upsert Function", function () {
    it("Should allow updating existing contribution", async function () {
      const contribution = await challenge.contributions(0);
      const amountBefore = contribution.amount;
      
      await challenge.connect(player).upsert(0, 0, {
        value: ethers.parseEther("0.5")
      });

      const contributionAfter = await challenge.contributions(0);
      expect(contributionAfter.amount).to.equal(amountBefore + ethers.parseEther("0.5"));
    });

    it("Should allow adding new contribution", async function () {
      const contribution = await challenge.contributions(0);
      const lastTimestamp = contribution.unlockTimestamp;
      const newTimestamp = lastTimestamp + 2n * 24n * 60n * 60n; // +2 days
      
      await challenge.connect(player).upsert(1, newTimestamp, {
        value: ethers.parseEther("0.5")
      });

      expect(await challenge.contributionCount()).to.equal(2n);
      const newContribution = await challenge.contributions(1);
      expect(newContribution.amount).to.equal(ethers.parseEther("0.5"));
      expect(newContribution.unlockTimestamp).to.equal(newTimestamp);
    });

    it("Should revert if timestamp is too early", async function () {
      const contribution = await challenge.contributions(0);
      const lastTimestamp = contribution.unlockTimestamp;
      const newTimestamp = lastTimestamp + 12n * 60n * 60n; // +12 hours (menos de 1 dia)
      
      await expect(
        challenge.connect(player).upsert(1, newTimestamp, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.revertedWith("Timestamp must be at least 1 day after previous");
    });

    it("Should revert if not owner", async function () {
      await expect(
        challenge.connect(attacker).upsert(0, 0, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Withdraw Function", function () {
    it("Should allow withdrawal after unlock", async function () {
      // Avançar tempo para desbloquear
      const contribution = await challenge.contributions(0);
      const unlockTimestamp = contribution.unlockTimestamp;
      const currentTime = await ethers.provider.getBlock("latest").then(b => b.timestamp);
      const timeToAdvance = Number(unlockTimestamp) - currentTime + 1;
      
      await ethers.provider.send("evm_increaseTime", [timeToAdvance]);
      await ethers.provider.send("evm_mine", []);
      
      const balanceBefore = await ethers.provider.getBalance(player.address);
      
      const tx = await challenge.connect(player).withdraw(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player.address);
      
      expect(await challenge.isComplete()).to.be.true;
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasUsed + ethers.parseEther("1.0") - ethers.parseEther("0.01"));
    });

    it("Should revert if not yet unlocked", async function () {
      await expect(
        challenge.connect(player).withdraw(0)
      ).to.be.revertedWith("Not yet unlocked");
    });

    it("Should revert if not owner", async function () {
      await expect(
        challenge.connect(attacker).withdraw(0)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent storage collision", async function () {
      // No contrato vulnerável, era possível calcular um índice que
      // fazia wrap-around para modificar unlockTimestamp
      // No contrato corrigido, isso não é mais possível
      
      const contribution = await challenge.contributions(0);
      const lastTimestamp = contribution.unlockTimestamp;
      const newTimestamp = lastTimestamp + 2n * 24n * 60n * 60n;
      
      // Adicionar várias contribuições
      for (let i = 1; i < 10; i++) {
        const timestamp = lastTimestamp + BigInt(i + 1) * 24n * 60n * 60n;
        await challenge.connect(player).upsert(i, timestamp, {
          value: ethers.parseEther("0.1")
        });
      }
      
      // unlockTimestamp da primeira contribuição não deve ser afetado
      const firstContribution = await challenge.contributions(0);
      expect(firstContribution.unlockTimestamp).to.equal(lastTimestamp);
    });

    it("Should prevent integer overflow in timestamp", async function () {
      const contribution = await challenge.contributions(0);
      const lastTimestamp = contribution.unlockTimestamp;
      
      // Tentar usar timestamp muito grande (causaria overflow)
      const tooLargeTimestamp = ethers.MaxUint256;
      
      await expect(
        challenge.connect(player).upsert(1, tooLargeTimestamp, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.revertedWith("Timestamp too far in future");
    });
  });
});

