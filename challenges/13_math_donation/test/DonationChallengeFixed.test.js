const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const DonationChallengeFixed = await ethers.getContractFactory(
      "challenges/13_math_donation/fixes/DonationChallengeFixed.sol:DonationChallengeFixed"
    );
    
    challenge = await DonationChallengeFixed.deploy({
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
      
      expect(await challenge.owner()).to.equal(deployer.address);
    });

    it("Should start with challenge incomplete", async function () {
      expect(await challenge.isComplete()).to.be.false;
    });
  });

  describe("Donate Function", function () {
    it("Should allow donation with correct payment", async function () {
      const etherAmount = ethers.parseEther("1.0");
      const msgValue = etherAmount / ethers.parseEther("1.0");
      
      await challenge.connect(player).donate(etherAmount, {
        value: msgValue
      });

      const donations = await challenge.donationsByAddress(player.address, 0);
      expect(donations.etherAmount).to.equal(etherAmount);
    });

    it("Should revert if payment is incorrect", async function () {
      const etherAmount = ethers.parseEther("1.0");
      
      await expect(
        challenge.connect(player).donate(etherAmount, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.revertedWith("Incorrect payment");
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent storage collision", async function () {
      // No contrato vulnerável, era possível calcular um índice que
      // fazia wrap-around para sobrescrever owner
      // No contrato corrigido, isso não é mais possível
      
      const etherAmount = ethers.parseEther("1.0");
      const msgValue = etherAmount / ethers.parseEther("1.0");
      
      // Fazer várias doações
      for (let i = 0; i < 10; i++) {
        await challenge.connect(player).donate(etherAmount, {
          value: msgValue
        });
      }
      
      // Owner não deve ser afetado
      expect(await challenge.owner()).to.equal(deployer.address);
    });

    it("Should use correct scale calculation", async function () {
      // Scale deve ser 10^18 (1 ether), não 10^36
      const etherAmount = ethers.parseEther("2.0");
      const msgValue = etherAmount / ethers.parseEther("1.0"); // 2
      
      await challenge.connect(player).donate(etherAmount, {
        value: msgValue
      });

      const donations = await challenge.donationsByAddress(player.address, 0);
      expect(donations.etherAmount).to.equal(etherAmount);
    });
  });
});

